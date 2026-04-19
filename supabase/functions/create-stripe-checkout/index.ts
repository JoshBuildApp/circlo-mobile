import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

// Hardened 2026-04-19 per V2_SECURITY_AUDIT_02.md findings:
//   S2-01 price tampering  — price now looked up via get_booking_stripe_ctx RPC
//   S2-04 input validation — bookingId must be a uuid, sessionType bounded
//   S2-05 rate limit       — check_rate_limit('stripe_checkout', 10) per user/min
//   S2-07 console leaks    — only error code is logged, never the full object

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) return json(401, { error: 'Unauthorized' })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json(401, { error: 'Unauthorized' })

    // --- rate limit (10 req/min/user) ---
    const { error: rlErr } = await supabase.rpc('check_rate_limit', {
      p_bucket: 'stripe_checkout',
      p_max: 10,
    })
    if (rlErr) {
      console.error('[checkout] rate limit:', rlErr?.code ?? 'unknown')
      return json(429, { error: 'Too many requests. Try again in a minute.' })
    }

    // --- parse + validate body ---
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return json(400, { error: 'Invalid JSON' })
    }

    const bookingId = body.bookingId
    const sessionType = body.sessionType

    if (typeof bookingId !== 'string' || !UUID_RE.test(bookingId)) {
      return json(400, { error: 'bookingId must be a uuid' })
    }
    if (typeof sessionType !== 'string' || sessionType.length === 0 || sessionType.length > 80) {
      return json(400, { error: 'sessionType required (<= 80 chars)' })
    }

    // --- server-authoritative price + coach/context lookup ---
    // The RPC enforces: caller is the booking owner or a participant, and
    // returns the real price/currency from the DB (not the client).
    const { data: ctxRows, error: ctxErr } = await supabase.rpc('get_booking_stripe_ctx', {
      p_booking_id: bookingId,
    })
    if (ctxErr) {
      console.error('[checkout] ctx rpc:', ctxErr?.code ?? 'unknown')
      return json(500, { error: 'Failed to load booking' })
    }
    const ctx = Array.isArray(ctxRows) ? ctxRows[0] : ctxRows
    if (!ctx) return json(404, { error: 'Booking not found or not accessible' })

    const priceILS = Number(ctx.price_ils)
    if (!Number.isFinite(priceILS) || priceILS <= 0 || priceILS > 100000) {
      console.error('[checkout] invalid server price:', priceILS)
      return json(500, { error: 'Invalid price configuration' })
    }

    // --- create Stripe session ---
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const origin = req.headers.get('origin') ?? 'https://circloclub.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: ctx.currency ?? 'ils',
            product_data: {
              name: `${sessionType} with ${ctx.coach_name ?? 'Coach'}`,
              description: `Coaching session on ${ctx.session_date} at ${ctx.session_time}`,
            },
            // Stripe smallest unit (agorot for ILS, cents for USD).
            unit_amount: Math.round(priceILS * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/bookings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/book?canceled=true`,
      metadata: {
        booking_id: bookingId,
        coach_id: ctx.coach_id ?? '',
        user_id: user.id,
      },
      customer_email: user.email,
    })

    const { error: updErr } = await supabase
      .from('bookings')
      .update({ stripe_session_id: session.id, payment_status: 'pending' })
      .eq('id', bookingId)
    if (updErr) {
      console.error('[checkout] booking update:', updErr?.code ?? 'unknown')
      return json(500, { error: 'Failed to update booking' })
    }

    return json(200, { sessionId: session.id, url: session.url })
  } catch (err) {
    // Never log the raw error — may contain Stripe keys, user data, or stack.
    const name = err instanceof Error ? err.name : 'UnknownError'
    console.error('[checkout] fatal:', name)
    return json(500, { error: 'Internal server error' })
  }
})
