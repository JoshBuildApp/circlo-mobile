# V2 Security Audit — 2026-04-19 (post-P0 ship)

Fresh security-only sweep after the P0 RPC ship (`8498aaf`). The earlier
`V2_SECURITY_AUDIT.md` closed 6 P0s. This pass looks for NEW issues and
verifies what's still open.

---

## NEW P0 (must fix before beta)

### S2-01  Stripe checkout: client-controlled price
`supabase/functions/create-stripe-checkout/index.ts:48-104` — the edge
function accepts `price` from the client body and forwards to Stripe
without reconciling against `coach_pricing` or the booking row.
**Attack:** `supabase.functions.invoke("create-stripe-checkout", { body: { bookingId, price: 1 }})`
→ pay ₪1 for a ₪500 session.
**Fix:** edge function should look up `bookings.price_ils` or
`coach_pricing.base_ils` by `bookingId` and ignore the client-provided
price. Same pattern as `book_session` RPC.

### S2-02  `booking_participants.payment_status` IDOR
`src/hooks/use-group-booking.ts:181-198` — `updatePaymentStatus` updates
by participant id alone. No `user_id` filter, no RLS verification.
**Attack:** call with someone else's participant id → flip their status
to `paid` without paying.
**Fix:** move to a SECURITY DEFINER RPC that checks
`auth.uid() = booking_participants.user_id` OR webhook-only (Stripe
webhook is the only legitimate writer).

### S2-03  `fetchBooking` IDOR — UUID enumeration
`src/hooks/use-group-booking.ts:40-54` — reads any booking by id with
no ownership filter. UUIDs are not secret; brute-force reveals price,
participants, coach notes.
**Fix:** RLS on `bookings` already limits SELECT to participants/coach,
but verify the policy exists and matches. If the hook still returns
rows for non-owners, RLS is weak.

---

## NEW P1

### S2-04  Edge function input validation gaps
`create-stripe-checkout/index.ts:48-58` — no validation on `price` sign,
`currency` whitelist, `sessionType` length. A negative price or
malformed currency can reach Stripe and cause undefined state.
**Fix:** add `z.object({ price: z.number().positive().max(100000), currency: z.enum(["ils","usd"]), ... })`.

### S2-05  No rate limit on Stripe checkout
Same file — unlimited invocations. Spam vector for Stripe API quota
exhaustion / junk booking rows.
**Fix:** wrap in `check_rate_limit('stripe_checkout', 10)` RPC (1/10 per
min) — same pattern as messages.

### S2-06  CSP allows `unsafe-inline` + `unsafe-eval`
`index.html:11-23` — documented as intentional for Vite/React. Still a
real XSS risk if a stored-XSS lands in a bio/review/username. A tightened
CSP with nonces is a medium-term project; in the meantime every user-
generated string must be rendered through React (never `dangerouslySetInnerHTML`).
**Fix (short):** grep `dangerouslySetInnerHTML` across v2 — zero tolerance.
**Fix (long):** nonce-based CSP via Vite plugin.

### S2-07  Edge functions log full error objects to Sentry
`create-stripe-checkout/index.ts:152` + stripe-webhook — `console.error("…", error)`
dumps PostgrestError with booking/user details. Anyone with Sentry
access reads them.
**Fix:** log `error?.code ?? "unknown"` only.

### S2-08  Service-role key rotation absent
`.env:6` comment "Swarm mission runner — same service_role key as
circlo-hub" means one leaked key compromises two systems. Rotate
quarterly and scope per-service.

---

## STILL OPEN FROM V2_SECURITY_AUDIT.md

- **S-07** — `profiles` PII (phone, email, DOB) readable by any authed
  user via `.select("*")`. Column-level grant or RLS policy needed.
- **S-08** — `reviews.user_id` leak. Return only `display_name` via view.
- **S-11** — `plan_subscriptions` can subscribe to unpublished plans.
- **S-12** — remaining `console.error` payload leaks (partial sweep done).

---

## VERIFIED CLOSED

- S-01/S-02 (booking price/status tampering) — `book_session`,
  `respond_to_booking`, `cancel_booking` RPCs + RLS policies dropped. ✅
- S-03 (review spam) — `submit_review` RPC requires completed booking
  + unique index. ✅
- S-05 (rate limit) — `send_message` RPC + `check_rate_limit` + `v2_rate_limits` table. ✅
- S-06 (GUEST_BROWSE bypass) — removed entirely in V2Guard. ✅
- S-13 (no CSP) — meta tag shipped (still uses `unsafe-inline`, see S2-06). ✅

---

## Priority fix order

1. **S2-01** — Stripe price tampering (1h, move price lookup to edge function).
2. **S2-02** — payment_status IDOR (30min, new RPC or lock down to webhook).
3. **S2-03** — verify bookings RLS SELECT policy is actually enforced.
4. **S2-07** — sweep `supabase/functions/**` for `console.error(..., error)`.
5. **S2-04 / S2-05** — checkout input validation + rate limit.
6. **S-07 / S-08** — profiles + reviews column exposure (migration).
7. **S-11** — published-plan check.

_Estimate: ~1 day for all new P0/P1. Then re-audit._
