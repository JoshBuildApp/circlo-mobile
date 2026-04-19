# Circlo v2 — Security Audit

**Date:** 2026-04-19
**Scope:** v2 mobile app + Supabase project `rsevfeogormnorvcvxio`
**Methodology:** RLS policy inspection (live DB), code review of v2 hooks/pages,
`npm audit`, secrets scan, storage policy review.

Severity key: **P0** = exploitable today, fix before any real users · **P1** =
real abuse vector with limited impact · **P2** = hardening / defence-in-depth.

---

## Executive summary

The auth and surface architecture are sound. Supabase RLS is enabled on every
v2 table, the anon key correctly carries the `anon` role, `.env` is gitignored,
storage buckets are owner-scoped, and `npm audit` is clean.

But the booking + review write paths have **critical client-trust bugs**. A
logged-in user can bypass payment, self-confirm bookings, spam fake reviews,
and rewrite messages received from other users. These are P0 and need
server-side enforcement before any real beta launch.

---

## 🔴 P0 — Critical (fix before launch)

### S-01 · Client can self-confirm a booking with any price (incl. ₪0)

`bookings` INSERT policy is just `WITH CHECK (auth.uid() = user_id)`. There is
no check on `coach_id`, `price`, `platform_fee`, or `status`. A malicious
client can call:

```js
await supabase.from("bookings").insert({
  user_id: <self>, coach_id: <any>, price: 0, status: "confirmed",
  date: "2026-05-01", time: "18:00",
});
```

…and create a free, pre-confirmed session with any coach.

**Fix.** Move booking creation behind a SECURITY DEFINER RPC
(`book_session`) that:
1. Looks up the real price from `coach_pricing` for the chosen format/duration.
2. Forces `status = 'pending'`, computes `platform_fee` server-side.
3. Validates the slot against `availability` + the unique-slot index already in place.
4. Returns the inserted row.

Then revoke direct INSERT on `bookings` from `authenticated` and grant
EXECUTE on the RPC instead.

### S-02 · Client can update its own booking status to 'completed'

`bookings` UPDATE: `USING (auth.uid() = user_id)` with no WITH CHECK. The
player owns the row and can set `status` to anything (e.g. `'completed'` to
trigger payout) and edit `price` after creation.

**Fix.** Replace player UPDATE with a narrow RPC `cancel_booking` that
verifies:
- Caller owns the row.
- Status is currently `pending` or `confirmed`.
- Cancellation is more than 12 hours before `starts_at` (refund window).
…and only updates `status = 'cancelled'`.

### S-03 · Anyone can post a review for any coach

`reviews` INSERT: `WITH CHECK (auth.uid() = user_id)` — no check that the user
actually had a session with that coach. A new account can spam 5-star (or
1-star) reviews for any coach instantly.

**Fix.** RPC `submit_review` that asserts the user has at least one
`bookings` row with status='completed' against `coach_id`. Also enforce the
existing `is_verified_booking` column.

### S-04 · Receiver can rewrite a sender's message

`messages` UPDATE: `USING (auth.uid() = receiver_id)` with no WITH CHECK.
The receiver can edit `content`, `metadata`, `created_at`. They should only
be able to flip `is_read`/`read_at`.

**Fix.** Replace with policy:
```sql
USING (auth.uid() = receiver_id)
WITH CHECK (
  auth.uid() = receiver_id
  AND content IS NOT DISTINCT FROM (SELECT content FROM messages WHERE id = messages.id)
  AND sender_id IS NOT DISTINCT FROM (SELECT sender_id FROM messages WHERE id = messages.id)
)
```
…or move read-state to a SECURITY DEFINER function `mark_message_read`.

### S-05 · No rate limiting on signup, login, password reset, message send, booking insert

A bot can:
- Brute-force passwords on `/v2/login`.
- Email-bomb other users by triggering `auth.resetPasswordForEmail` repeatedly.
- Enumerate accounts by timing.
- Spam messages to fill an inbox.

**Fix.** Add rate-limit middleware in front of edge functions, OR:
- Use Supabase Auth's built-in rate limits (set in dashboard: 30 signups/hour,
  10 password resets/hour per IP).
- Wrap message INSERT in an RPC that checks a `rate_limit_buckets` row.

### S-06 · `GUEST_BROWSE` flag history

This was set to `true` for preview between commits `e468eb1` and `789ae4c`.
Anyone with the URL during that window could browse + "book" (mock) without
auth. Currently `false` ✅ but flag history is in git — make sure no
TestFlight / Store build went out with it on.

**Fix.** Add a build-time assertion: `if (!import.meta.env.DEV && GUEST_BROWSE)
throw`; or remove the flag entirely now that auth is real.

---

## 🟠 P1 — High (real abuse vector, limited blast)

### S-07 · Profiles read-all-authenticated leaks PII

Policy `Authenticated users can view all profiles` exposes every row's
`username`, `avatar_url`, `age`, `interests`, `bio` to any logged-in user.
For a fitness/coaching app this includes personal health interests + age.

**Fix.** Either:
- Drop the policy and add a narrower one that only exposes `username + avatar_url`
  via a view, OR
- Strip sensitive columns (`age`, `interests`) from the public projection
  by serving them only via a SECURITY DEFINER function for the owner.

### S-08 · Reviews expose reviewer `user_id` publicly

`Reviews are viewable by everyone` returns `user_id` (an auth UUID). Combined
with S-07 someone can join `reviews.user_id` → `profiles.username` to identify
specific reviewers. Doxxing risk.

**Fix.** Don't select `user_id` in the v2 query (already done in
`fetchCoachReviews` — good). Belt-and-braces: create a `coach_review_view`
that omits user_id and grant SELECT only on the view.

### S-09 · Live `circle` tier readable without subscription

`live_sessions_public_read` allows anyone to read `tier IN ('free','circle')`
sessions. There's no check that the reader is in the coach's circle.

**Fix.** Tighten:
```sql
USING (
  tier = 'free'
  OR (tier = 'circle' AND EXISTS (
    SELECT 1 FROM user_follows uf
    WHERE uf.user_id = auth.uid() AND uf.coach_id::uuid = live_sessions.coach_id
  ))
  OR (tier = 'vip' AND EXISTS (
    SELECT 1 FROM plan_subscriptions ps
    JOIN training_plans tp ON tp.id = ps.plan_id
    WHERE ps.user_id = auth.uid() AND tp.coach_id = live_sessions.coach_id
      AND ps.status = 'active'
  ))
);
```

### S-10 · No "I am not myself" check on user_follows

Nothing prevents `user_follows.user_id = coach.user_id` (a coach following
their own coach record) — harmless but inflates `followers` count.

**Fix.** Trigger or CHECK constraint:
```sql
ALTER TABLE user_follows ADD CONSTRAINT no_self_follow
  CHECK (user_id::text <> coach_id);
```
(uses text cast because coach_id is text in this table.)

### S-11 · Plan subscription can target unpublished plan

`plan_subscriptions_owner_all` lets a user insert a row for any `plan_id`
even if the plan isn't published. They could subscribe to draft content and
see plan_workouts (which only RLS-checks `is_published OR owner`).

**Fix.** Add a CHECK or trigger ensuring `plan_id` references a published
plan at insert time.

### S-12 · Sentry / console.error leak user data

29 `console.error` / `console.log` / `console.warn` calls in v2 code log
caught error messages from Supabase. Some include payloads with `user.id`,
booking details, message content. In production these stream to Sentry which
is fine for debugging but means anyone with Sentry access can read PII.

**Fix.**
- Strip user data before logging: `console.error('[v2] X failed:', err.code)` instead of full err.
- Configure Sentry `beforeSend` to scrub `email`, `phone`, `body`, `content`.
- Add a `data-private` redaction list.

### S-13 · No CSP on the web build

`index.html` has a comment claiming CSP is set per-platform but no actual
header is configured. On the web preview at circloclub.com, an XSS via a
coach bio with a script tag would execute.

**Fix.** Add a CSP meta tag in `index.html`:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co">
```
For Capacitor native, set `server.allowNavigation` and avoid `'unsafe-inline'`
once Vite supports nonce.

### S-14 · No phone-number validation in profile

`profiles.username` accepts any string. A user can put `<script>` or
emoji-bombs in their username and that renders unsanitised on every coach
card / message thread (React escapes by default but innerHTML in chat refs
needs verification).

**Fix.**
- Server-side validation in a `set_username` RPC: regex `[a-z0-9._-]{3,30}`.
- Add unique constraint on `profiles.username`.

---

## 🟡 P2 — Hardening / defence-in-depth

### S-15 · No GDPR data-export / data-delete endpoints
**Fix.** Edge function `export_my_data` (returns zip of all user-related
rows) + `delete_my_account` (cascades through FKs).

### S-16 · No 2FA for coaches
**Fix.** Use Supabase Auth MFA (TOTP) — enable in dashboard, surface enrolment
UX in `/v2/profile/settings → Security`.

### S-17 · No audit log of sensitive actions
**Fix.** Append-only `audit_log` table with triggers on bookings (status
change), payment events (when wired), role changes, sign-ins.

### S-18 · API key rotation runbook missing
The `VITE_SUPABASE_PUBLISHABLE_KEY` is in `.env`. While the anon key is
non-secret by design, it's still good hygiene to rotate annually + after
any contractor offboarding.

### S-19 · No CAPTCHA on signup
A determined attacker can register many burner accounts (one per email).
**Fix.** hCaptcha (Supabase has built-in support) on signup + password reset.

### S-20 · No content moderation before coach profile shows publicly
**Fix.** New coaches should default to `is_verified=false` and
`is_published=false` on `coach_profiles`; admin queue to approve.

### S-21 · Realtime payload over-broadcasts
`useChat` and `useBookingRequests` listen to ALL inserts on `messages` /
`bookings` and just invalidate React Query. The realtime API respects RLS
so payloads only arrive for visible rows — but it's still a chatty channel.

**Fix.** Filter server-side via `filter: \`receiver_id=eq.${user.id}\``.

### S-22 · Capacitor app allows arbitrary external navigation
`capacitor.config.ts` doesn't declare `server.allowNavigation`. A malicious
deep link could load attacker content in the webview.

**Fix.** Restrict `allowNavigation` to `["circloclub.com", "*.supabase.co"]`.

### S-23 · No hCaptcha or Turnstile on password reset
Could be combined with S-05 to email-bomb users.

### S-24 · `auth.users.email` exposed via shared user_id joins
Although we don't query `auth.users` directly, the user_id UUID is a
correlation key that ties everything together. Consider per-feature pseudonymous
IDs in a future refactor.

### S-25 · No `Strict-Transport-Security` header
For the web build at circloclub.com — set in hosting layer (Vercel/Netlify/Lovable).

---

## ✅ What's already right

- RLS is **on** for all 99 public tables.
- New v2 tables shipped with explicit policies (no defaults).
- `avatars` storage bucket scopes writes to `<uid>/` folders.
- `.env` gitignored; only the public anon key lives in client bundles.
- Realtime subscriptions respect RLS (Supabase enforces this).
- Auth uses Supabase JWT (industry standard).
- Booking integrity: FK to coach_profiles + unique partial index prevents
  double-booking at the DB level (just doesn't prevent price tampering yet).
- Avatar uploads have file-type + 5MB size guard client-side.
- Forgot password page returns the same "check your inbox" message regardless
  of whether the email exists (no enumeration).
- `npm audit --omit=dev`: 0 vulnerabilities.

---

## Suggested fix order (smallest diff → biggest leverage)

| Order | Fix | Effort |
|---|---|---|
| 1 | Drop the v2-era `GUEST_BROWSE` flag entirely (S-06) | 5 min |
| 2 | Patch `messages` UPDATE policy (S-04) | 10 min |
| 3 | Patch `live_sessions` read policy (S-09) | 10 min |
| 4 | Add no-self-follow CHECK (S-10) | 5 min |
| 5 | Sanitise console.errors + Sentry beforeSend (S-12) | 30 min |
| 6 | CSP meta tag (S-13) | 10 min |
| 7 | Replace direct `bookings` INSERT with `book_session` RPC (S-01) | 1 hour |
| 8 | Replace direct `bookings` UPDATE with `cancel_booking` RPC (S-02) | 30 min |
| 9 | Replace direct `reviews` INSERT with `submit_review` RPC (S-03) | 30 min |
| 10 | Tighten profiles read policy + view (S-07) | 1 hour |
| 11 | Enable Supabase Auth rate limits in dashboard (S-05 partial) | 5 min |
| 12 | hCaptcha on signup + password reset (S-19, S-23) | 1 hour |
| 13 | GDPR endpoints (S-15) | 2 hours |

**The first 6 fix the most-exploitable bugs in under 90 minutes total.** Items
7–10 close the meaningful client-trust gaps (about 3 hours). Everything else is
hardening.
