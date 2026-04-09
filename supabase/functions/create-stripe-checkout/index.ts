import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the JWT token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { bookingId, coachId, sessionType, price, currency = 'usd' } = await req.json()

    if (!bookingId || !coachId || !sessionType || !price) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch coach and booking details
    const { data: coach, error: coachError } = await supabaseClient
      .from('profiles')
      .select('name, email')
      .eq('id', coachId)
      .single()

    if (coachError || !coach) {
      return new Response(
        JSON.stringify({ error: 'Coach not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('id, date, start_time, end_time')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `${sessionType} with ${coach.name}`,
              description: `Coaching session scheduled for ${booking.date} from ${booking.start_time} to ${booking.end_time}`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/bookings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.get('origin')}/book?canceled=true`,
      metadata: {
        booking_id: bookingId,
        coach_id: coachId,
        user_id: user.id,
      },
      customer_email: user.email,
    })

    // Update booking with Stripe session ID
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        stripe_session_id: session.id,
        payment_status: 'pending'
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update booking' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})