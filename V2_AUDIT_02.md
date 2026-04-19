# V2 Audit — 2026-04-19 (post P0 security ship)

Fresh end-to-end audit of `/v2/*` after the P0 security RPC ship (commit
`8498aaf`). Scored P0 → P2 by launch impact, not code size.

---

## TL;DR

- **Architecturally clean.** 41 v2 pages, all routed, all lazy-loaded,
  all auth-gated by `V2Guard`. Dual-hook facade (`useMocks.ts`) dispatches
  to real Supabase queries for authed users — working as designed.
- **Security P0s shipped.** Booking/review/message flows now go through
  SECURITY DEFINER RPCs with rate limiting. Direct INSERT/UPDATE policies
  dropped on `bookings`, `reviews`, `messages`.
- **Real blockers before launch:** 10 hardcoded hex colors break light
  mode. Settings page is almost entirely "coming soon" toasts. A few
  hooks still return pure mocks even when authed (Bob AI, live sessions,
  shop, the rich CoachProfile card).
- **Biggest unknown:** zero telemetry. We won't see what's breaking in
  the wild.

---

## P0 — Must fix before public beta

### P0-1  Theme hex violations (10 sites)

Inline hex/gradients break dark ↔ light theme switching. Light mode
users will hit unreadable orange-on-orange text and invisible buttons.

| File | Line(s) | Violation |
|---|---|---|
| `src/pages/v2/BookingFlowPage.tsx` | 158, 596 | `from-[#3a1c0f] to-[#1f140a]` |
| `src/pages/v2/BookingFlowPage.tsx` | 462 | `from-[#1a1f71] to-[#0f1447]` (visa card) |
| `src/pages/v2/BookingSuccessPage.tsx` | 47 | `stroke="#0A0A0F"` on check icon |
| `src/pages/v2/CoachSelfPage.tsx` | 97 | inline orange avatar gradient |
| `src/pages/v2/DiscoverPage.tsx` | 186-188 | 3 inline hex avatar colors |
| `src/pages/v2/EditProfileV2.tsx` | 124 | `bg-[#ff4d6d1a]` error bg |
| `src/pages/v2/ForgotPasswordV2.tsx` | 69 | `bg-[#ff4d6d1a]` error bg |
| `src/pages/v2/GoProPage.tsx` | 49 | `from-[#3a1c0f] to-[#1f140a]` |
| `src/pages/v2/GoProPage.tsx` | 111-113 | 3 inline hex avatar colors |

**Fix:** replace each with existing `[data-grad="…"]` attribute (already
theme-safe) or add new tokens to `src/index.css` if the gradient
doesn't exist yet. Est. 1-2h.

### P0-2  `SignupV2` leaks Supabase error object to console

`src/pages/v2/SignupV2.tsx:56` — `console.error("coach_profiles insert failed:", coachErr)`
dumps the full `PostgrestError`. Low-severity data leak but violates the
"log codes, not payloads" rule we've applied everywhere else.

**Fix:** `console.error("[v2] coach_profiles insert failed:", coachErr?.code ?? "unknown");`
— one line. Est. 2min.

### P0-3  Pure-mock hooks under authenticated users

Five hooks in `src/hooks/v2/useMocks.ts` return mock data even when the
user is logged in. These surface in production:

| Hook | Line | Surface |
|---|---|---|
| `useCoachProfile(id)` | 123 | rich profile card on coach page (tagline, bio, perks) |
| `useBobInsights` | 278 | Bob AI insight feed |
| `useBobThreads` | 285 | Bob AI chat inbox |
| `useShopItems(coachId)` | 304 | coach merch/shop tab |
| `useLiveSession(id)` | 413 | live viewer + live-ended pages |

**Decision needed, not just fix:**
- `useCoachProfile` → **fix now** (duplicates `useCoach` but adds richer
  fields; consolidate or wire to Supabase).
- Bob AI + Live + Shop → **hide or label "Preview"**. These are post-beta
  features; shipping mock data to real users is worse than shipping nothing.

Est. 30min to hide the preview-only surfaces behind a feature flag;
2-4h to properly consolidate `useCoachProfile` with `useCoach`.

### P0-4  Settings page is 80% "coming soon"

`src/pages/v2/SettingsV2Page.tsx` lines 117, 126-128, 140 — Security,
Notifications prefs, Language, Currency, Data export/delete are all
toast-only stubs. A user tapping "Data & Privacy → Delete my account"
and getting "coming soon" is a trust-breaking experience + a GDPR risk.

**Fix options:**
- **Minimum:** remove the rows that aren't implemented. Empty settings
  is better than fake settings.
- **Right:** wire Notifications + Data-export to real edge functions.
  Language/Currency can stay out — only ILS + English for beta.

Est. 30min to strip the stubs; 1-2 days to properly implement
Data-export.

### P0-5  Promo code field is a lie

`src/pages/v2/BookingFlowPage.tsx:485` — placeholder `"Enter code"` with
no validator, no mutation, no feedback. Users will type and tap "Apply"
and nothing will happen.

**Fix:** hide the input until there's an actual `coupons` table. Est. 5min.

---

## P1 — Should fix for quality launch

### P1-1  Discover filters are 75% dead

`src/pages/v2/DiscoverPage.tsx:79-82` — only the Padel sport filter is
wired. Location, price, "more filters" all toast stubs. The search
query + sport filter work, so the page is usable — but the UI promises
more than it delivers.

**Fix:** gray-out the unwired buttons with a small "soon" badge, or
remove them for beta. Est. 20min.

### P1-2  Dual hook system is permanent tech debt

`useMocks.ts` is called a facade but will never be deleted — every page
imports from it. The naming is confusing and the mock fallback is a
production footgun (if a real fetch fails silently and returns `[]`, we
fall back to mocks and the user sees someone else's fake data).

**Fix options:**
- Rename `useMocks.ts` → `useV2Queries.ts` (it's the real hooks file).
- Remove the mock fallback for logged-in users. Empty/error states are
  already designed; use them.
- Delete the mock-fallback branch in every hook — if real fetch returns
  `[]`, return `[]`, not mock data.

Est. 3-4h to rename + strip fallback + regression-test every page.

### P1-3  `NewMessagePage` + `MessagesInboxPage` haven't been wired

Both import from `useMocks` and the underlying `fetchMessageThreads`
already returns real data — but these pages still render the mock
shape. Worth verifying they actually show real threads post-login.

**Fix:** manual QA + add realtime subscription to the inbox (the chat
already has one; inbox doesn't). Est. 1h.

### P1-4  Still-open P1 items from the security audit

From `V2_SECURITY_AUDIT.md`:
- **S-07** — `profiles` table exposes PII (phone, email) to other users
  via `.select()`. Fix with column-level grant or RLS policy.
- **S-08** — `reviews` table leaks reviewer `user_id`. Use a view or
  return only display name.
- **S-11** — can subscribe to a plan on an unpublished coach; add
  `published=true` check in `subscribeToPlanReal`.
- **S-12** — a few more `console.error` sites log payloads (not just
  codes). Sweep `src/**/v2/**`.

Est. half a day total.

### P1-5  No analytics anywhere

Zero PostHog / Amplitude / Segment / Sentry in the v2 bundle. We will
launch blind. Even a minimal `track("booking_started", { coachId })`
set would let us see the drop-off funnel.

**Fix:** drop in PostHog (cheapest, product-analytics-focused), wire 10
key events: signup started/completed, onboarding completed, discover
search, coach viewed, booking started, booking completed, review
submitted, plan subscribed, message sent, app opened. Est. half a day.

### P1-6  No error boundary on `V2Guard`

If any child throws (realtime subscription blowing up, malformed data
from Supabase), the entire app whitescreen'd. Need an ErrorBoundary
wrapping the v2 tree with a friendly reload button.

**Fix:** wrap the `<V2ThemeProvider>` tree in `V2Guard.tsx` with a
shadcn ErrorBoundary + Sentry capture. Est. 1h.

### P1-7  Apple/Google OAuth still deferred

`SignupV2` and `LoginV2` only support email/password. On iOS App Store
review, "Sign in with Apple" is mandatory if any other social auth is
present — not an issue yet, but if Google is ever added it's a
rejection risk.

**Fix:** set up Apple Developer cert + Supabase Apple provider. Est. 1 day
(mostly cert wrangling).

---

## P2 — Polish, backlog, nice-to-haves

- **Onboarding skip affordance.** Player/Coach onboarding wizards skip
  if already done, but there's no way to *re-open* them. Add a "Redo
  onboarding" row in Settings.
- **Image upload compression.** `uploadAvatar` caps at 5MB but doesn't
  resize. A 5MB phone photo → 5MB public URL every time. Add a 1024px
  longest-side canvas resize.
- **i18n.** ILS + English hardcoded. Fine for beta. Revisit post-PMF.
- **Empty-state copy audit.** Every empty state says "No X yet" — some
  should be actionable CTAs ("No bookings yet → Find a coach").
- **a11y sweep.** VoiceOver pass on all 41 pages. Likely many missing
  aria-labels on icon buttons.
- **Bundle size.** `charts-DndmMcrO.js` is 422KB — used only on
  `CoachDashboard`. Lazy-load it better or drop Recharts for a lighter
  lib (Victory, Chart.js-lite).
- **`V2Stub.tsx`** — exists but unrouted. Delete.
- **Test coverage.** Only 2 test files (Chip, KpiStrip). Add smoke
  tests for the top-5 critical flows (signup, onboarding, discover,
  book, message).
- **Storybook.** We keep building the same card shapes (stat cell,
  session card, coach row). A Storybook would prevent drift.

---

## What's NOT broken (don't touch)

- Auth gate (`V2Guard.tsx`) — tight, no bypass.
- Booking integrity — `book_session` RPC + unique slot index + 5% fee
  computed server-side. Clean.
- Theme switching — works where tokens are used. Only hex violations
  break it.
- Realtime subscriptions — bookings + chat both invalidate correctly.
- File upload (`uploadAvatar`) — 5MB cap, owner-scoped path, mirrors
  to `profiles.avatar_url`.
- CSP meta tag — proper allowlist, no wildcards.
- Content tampering — RLS on posts/videos prevents users editing others'
  content.

---

## Suggested sprint shape

**Day 1 (cheap wins):** P0-1 (hex), P0-2 (console log), P0-5 (promo), P1-1
(filter stubs). **~4 hours total, highest visible impact.**

**Day 2 (Settings + Hooks):** P0-3 (pure-mock hooks — hide Bob/Live/Shop,
wire CoachProfile), P0-4 (Settings stubs — strip + wire Notifications).
**~1 day.**

**Day 3 (Security P1 + Error handling):** P1-4 (S-07/08/11/12), P1-6
(ErrorBoundary). **~1 day.**

**Day 4 (Visibility):** P1-5 (PostHog + 10 events), P1-2 (rename hooks
file, strip mock fallback). **~1 day.**

**Day 5 (QA):** manual sweep on iOS sim + real device, a11y pass, fix
anything the first 4 days surfaced. **~1 day.**

→ **~1 week to launch-ready beta.**

---

_Generated 2026-04-19. Previous audits: `V2_FULL_AUDIT.md` (150-item
coverage), `V2_SECURITY_AUDIT.md` (25 findings, 6 P0s shipped)._
