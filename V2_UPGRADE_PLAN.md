# Circlo v2 — Full Upgrade Plan

**Audience:** the next Claude Code (or any developer) picking up the v2 mobile
rollout. Read this top-to-bottom before touching code.

---

## 0 · TL;DR

The v2 UI ships at `/v2/*` behind a feature flag (currently hardcoded ON for
preview builds — see [Step 1](#step-1--re-gate-the-flag-before-store-submission)).
**32 pages, ~50 components, theme switching, role switching, splash, and
Capacitor iOS sync** are all live on `main`. **Auth, real Supabase data,
real images, real notifications, and Stripe** are not — they're on the upgrade
path below.

---

## 1 · What's already done

### Foundations
- **Tailwind tokens** scoped to `.v2-root` via CSS variables that flip per
  `data-theme="dark|light"`. v1 uses the same tokens but never receives the
  `.v2-root` class, so v1 colour values fall back to dark hex defaults.
- **Manrope font** loaded; `font-v2` class opts in.
- **Feature flag** at `src/lib/v2/featureFlag.ts` (currently always-on).
- **Currency util** at `src/lib/v2/currency.ts` — never hardcode ₪.
- **Mock data layer** at `src/lib/v2/mockData.ts` + react-query hooks at
  `src/hooks/v2/useMocks.ts` (300ms simulated delay).
- **RoleContext** (`src/contexts/v2/RoleContext.tsx`) — player/coach,
  persists in `localStorage[circlo:v2_role]`.
- **ThemeContext** (`src/contexts/v2/ThemeContext.tsx`) — dark/light,
  persists in `localStorage[circlo:v2_theme]`, follows OS by default.
- **V2Guard** wraps every `/v2/*` route, applies both providers, redirects
  to `/v2/enable` when flag off.

### Pages (all live)

| Path | Page |
|---|---|
| `/v2/enable` | Flag toggle + plan overview |
| `/v2/splash` | Brand splash with auth check |
| `/v2/home` | Player home — greeting, next session, live now, coaches, circle posts |
| `/v2/discover` | Coaches OR Communities tabs (real distinct content) |
| `/v2/coach/:id` (`/community`, `/shop`) | Coach profile, 3 tabs in one page |
| `/v2/coach/:id/content` | Content library |
| `/v2/coach/:id/join` | Tier picker (Follower / Member / VIP) |
| `/v2/go-pro` | Coach upgrade page |
| `/v2/bob` (`/threads`, `/settings`, `/inbox`) | Bob AI suite — coach-only |
| `/v2/messages` (`/new`, `/:threadId`) | Inbox / new / chat |
| `/v2/calendar` (`/:date`, `/add-workout`) | Month / week / list views |
| `/v2/book/:coachId` + `/v2/book/:bookingId/success` | 5-step booking flow |
| `/v2/profile` (`/bookings`, `/settings`, `/payments`) | Player profile suite |
| `/v2/coach-me` (`/requests`, `/content`) | Coach dashboard |
| `/v2/video/:videoId` | Video player |
| `/v2/live/:sessionId` (`/ended`) | Live viewer + recap |
| `/v2/plans/:planId` (`/subscribe`) | Training plan detail + subscribe |

### Shared primitives (`src/components/v2/shared/`)
PhoneFrame, StatusBar, TabBar (reads role from context), RoundButton, Chip,
StatCard, KpiStrip, SectionHeader, HScroll, PulseDot, Avatar (image+gradient
fallback), VideoThumb.

### Tests
- Vitest unit: `Chip`, `KpiStrip`, `currency`, `featureFlag` — 15 passing.
- Playwright e2e at `e2e/v2/v2-smoke.spec.ts` — 11 specs (routing, player
  flow, coach flow, booking wizard).

### Native preview path
- iOS bundle in `ios/App/App/public/` syncs from `dist/` via
  `npm run cap:sync`. Run `npm run cap:ios` to open Xcode.
- v2 hardcoded ON for preview — `RootRoute` redirects `/` → `/v2/home`.

---

## 2 · Known issues / pending fixes

These came in during the last preview-test session. Fixes are in main, but
each warrants regression testing on real devices.

| Issue | File | Status |
|---|---|---|
| Bottom nav not flush to home indicator | `TabBar.tsx` | Fixed — uses inline `backgroundColor: var(--v2-bg)` + `v2-safe-bottom` |
| iOS status bar overlapping page content | `PhoneFrame.tsx` | Fixed — `v2-safe-top` applied at frame level |
| HScroll blocks iOS vertical pan-through | `HScroll.tsx` | Fixed — removed `touch-action: pan-x` |
| PhoneFrame transform broke iOS momentum scroll | `PhoneFrame.tsx` | Fixed — opacity-only entry |
| Coach-mode Profile tab not clickable | `TabBar.tsx` | Fixed — Profile tab in coach mode renders as `<button>` that flips role + navigates |
| Discover Communities tab showed Coaches content | `DiscoverPage.tsx` | Fixed — separate `<CommunitiesView>` component |
| Avatars were solid colour blocks | `Avatar.tsx`, `CoachCard.tsx` | Fixed — `src` prop with gradient fallback; `Coach.avatarUrl` field threaded through |
| Player profile felt cluttered | `UserProfileV2.tsx` | Fixed — compacted hero, KPI strip with hairline dividers |
| Coach view had no obvious "back to player" or "preview public" | `CoachSelfPage.tsx` | Fixed — both pills in top bar |

---

## 3 · Architecture rules (do not break)

1. **v2 code lives only under `*/v2/` directories.** v1 is never modified.
2. **No hardcoded hex colours** in components — use Tailwind tokens
   (`bg-navy-card`, `text-offwhite`, etc.) so theme switching works.
3. **No hardcoded `₪`** — use `formatCurrency(n)` from `lib/v2/currency.ts`.
4. **All numeric stats use `.tnum`** for tabular numerals.
5. **Components stay under ~150 lines.** Long flow pages may exceed; split
   when reasonable.
6. **Pages root in `<PhoneFrame>`** which applies `.v2-root .font-v2 v2-safe-top`
   plus the active theme's `data-theme` attribute.
7. **TabBar** reads role from `useRole()` when `mode` prop is omitted.
8. **Bob AI screens** wrap in `<CoachOnly>` which redirects players to home.
9. **Currency** is ILS by default — locale-aware via `Intl.NumberFormat`.
10. **No `any` in TypeScript.** Add types under `src/types/v2/`.
11. **Mock hooks have stable contracts.** Switching to real Supabase is a
    one-file change per hook.
12. **Capacitor plugins are accessed via `src/native/useNative.ts`**, never
    imported directly into components (preserves the web build).

---

## 4 · Priority upgrades (do these in order)

### Step 1 · Re-gate the flag before Store submission

Currently `isV2Enabled()` returns `true` unconditionally so Xcode previews
always show v2. Before submitting any TestFlight build that should ship v1
to existing users, restore the gate:

```ts
export function isV2Enabled(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_V2_FORCE === "true") return true;
  try { return window.localStorage.getItem(V2_ENABLED_KEY) === "true"; }
  catch { return false; }
}
```

Acceptance: a fresh install boots into v1 by default; visiting `/v2/enable`
+ tapping Turn On exposes v2.

---

### Step 2 · Wire real Supabase auth (login + signup pages)

**Files to create:**
- `src/pages/v2/LoginV2.tsx` — email + password, "Forgot password?",
  "Don't have an account? Sign up" → `/v2/signup`. On submit calls
  `supabase.auth.signInWithPassword({ email, password })`. Handles
  rate-limit errors. Apple/Google sign-in buttons (call existing
  `SocialLoginButtons` if present in v1).
- `src/pages/v2/SignupV2.tsx` — full name, email, password, confirm
  password, accept terms checkbox, role picker (Player / Coach). On
  submit calls `supabase.auth.signUp(...)` with `data: { full_name,
  username, age, role }` so the existing `handle_new_user` trigger
  fills `profiles` + `user_roles`. Coaches additionally insert into
  `coach_profiles` after the trigger fires.
- `src/pages/v2/WelcomeV2.tsx` — branded landing with Sign in /
  Sign up CTAs (used as the unauth'd entry point).

**Routing:**
- Add `/v2/login`, `/v2/signup`, `/v2/welcome` to `App.tsx`.
- Update `V2Guard` to read `useAuth()`. If not loading and no user and
  current path isn't an auth page or `/v2/enable`, redirect to
  `/v2/welcome`.
- `SplashV2.tsx` already handles the loading state — verify the
  redirect targets after auth resolves.

**Reuse:** `src/contexts/AuthContext.tsx` is already global; no new
context needed. Direct `supabase` calls in pages are fine — that's how
v1 does it.

**Edge cases to handle visibly (designed states required):**
- Email already exists on signup
- Bad credentials on login
- Network error / offline
- Email confirmation pending (Supabase by default requires email verify)

---

### Step 3 · Replace mock hooks with real Supabase queries

For each `useXxx` hook in `src/hooks/v2/useMocks.ts`, swap the body to
hit Supabase. The hook contract (return shape) stays identical. Suggested
order:

| Hook | Supabase table(s) |
|---|---|
| `useMyPlayerProfile` | `profiles` + `user_roles` joined on `user_id` |
| `useMyCoachProfile` | `coach_profiles` + `profiles` |
| `useCoaches` / `useCoach` | `coach_profiles` + `profiles` |
| `useMySessions` | `bookings` |
| `useBookingRequests` | `bookings` filtered to coach-side pending |
| `useBookingRequestAction` | `update bookings.status` mutation |
| `useMessageThreads` / `useChat` | existing v1 `messages` / `message_threads` (verify schema) |
| `useShopItems` | new `shop_items` table or reuse `coach_products` |
| `useTrainingPlan` / `useCoachPlans` | new `training_plans` + `plan_workouts` |
| `useSubscribeToPlan` | new `plan_subscriptions` + auto-insert into a calendar/events table |
| `useCalendarEvents` | union of `bookings` + new `calendar_events` table |
| `useAddWorkout` | insert into `calendar_events` |
| `useVideos` | existing v1 `coach_videos` table |
| `useLiveSession` | new `live_sessions` table or join via `coach_videos.is_live` |
| `useBobInsights` / `useBobThreads` | existing v1 `bob_*` tables |
| `useCirclePosts` | existing v1 `coach_posts` table |

**Schema gaps to verify with the user before writing migrations:**
- `bookings.status` enum values (need: `pending`, `confirmed`, `completed`,
  `cancelled`)
- `coach_profiles.is_available` boolean for the "Available for bookings"
  banner
- `coach_profiles.avg_response_minutes` integer
- `payouts` table existence + structure for next-payout card
- `plan_subscriptions` table — likely doesn't exist yet
- `calendar_events` table — likely doesn't exist; could fold into a
  `personal_workouts` table instead
- `profiles.avatar_url` is the source of truth for `Coach.avatarUrl`

For each new table, generate a migration in `supabase/migrations/` with
RLS policies (player can only read/write own; coach can read student data
for their bookings).

---

### Step 4 · Real images (avatars, content thumbs, video posters)

- `Coach.avatarUrl` already plumbed end-to-end. Wire it from
  `coach_profiles.image_url` (or `profiles.avatar_url`).
- Add a `cover_image_url` field on coaches for hero/profile-card backdrop.
- `VideoThumb` currently renders a teal/orange radial gradient
  placeholder. Add `posterUrl` prop and use `<img>` underneath.
- Set up Supabase Storage buckets if missing: `avatars`, `coach-content`,
  `video-posters`. RLS: public read on avatars + posters; signed URLs for
  premium video files.

---

### Step 5 · Booking flow → real bookings

`BookingFlowPage.tsx` currently navigates to a fake success URL. Replace
the success step's mutation with:

1. `insert into bookings ...` using selected coach, format, time, location,
   note, status `pending`.
2. Push notification stub: in dev, just log; in prod, the coach gets a
   push (see Step 8).
3. Navigate to `/v2/book/:bookingId/success` with the real booking ID.
4. `BookingSuccessPage` reads from `useSession(bookingId)` (new hook).

Cancellation: `MyBookingsPage` Cancel button needs a confirm dialog +
`update bookings set status='cancelled'` mutation, with a 12-hour cutoff
matching the policy displayed on review screen.

---

### Step 6 · Realtime + push notifications

**Realtime:**
- `useChat(threadId)` should subscribe to `messages` inserts via Supabase
  realtime, not just fetch once.
- `useLiveSession` should subscribe to `live_sessions.viewer_count` + a
  `live_chat` table for the chat overlay.
- `useBookingRequests` should subscribe so coach sees new requests appear
  without refresh.

**Push (Capacitor `@capacitor/push-notifications`):**
- Already installed.
- On login, register the device → store the FCM/APNS token in a `devices`
  table keyed by user ID.
- Backend (Supabase edge function) sends pushes for: new booking request
  to coach, booking accepted/declined to player, new message to either
  party, session reminder 1 hour before.
- Add notification permission prompt in onboarding (gracefully degrade if
  declined).

---

### Step 7 · Stripe / payments

- Use existing `src/lib/stripe-webhook-config.ts` — v1 already has Stripe
  wired for v1 booking. Reuse the same products / payment intents API.
- `BookingFlowPage` step 5 currently shows a fake Visa card. Replace with
  Apple Pay sheet via Stripe's payment-request API + Stripe Elements as
  fallback.
- Coach payouts: `PaymentMethodsPage` shows a static list. Wire to Stripe
  Connect for coach side.
- Tier subscriptions (`/v2/coach/:id/join`) need recurring billing — likely
  Stripe subscriptions with metered fallback for free tier.

---

### Step 8 · Native polish

- **Haptics** on key actions: `useHaptics().tap("light")` on booking
  Continue, `success()` on booking confirmed, `tap("medium")` on accept
  request. Use the existing `src/native/useNative.ts` wrapper.
- **Native share** on coach profile share button via `useShare()`.
- **App icon** + splash assets — currently using defaults. Generate from
  the Circlo logo at the right sizes for iOS/Android.
- **Status-bar style** on v2 pages: dark theme → light status-bar text;
  light theme → dark status-bar text. Use `@capacitor/status-bar`'s
  `setStyle({ style: Style.Light|Dark })` from a small helper hook that
  watches `useV2Theme().theme`.
- **Keyboard handling** on chat input — make sure `@capacitor/keyboard`
  resizes the viewport and ChatPage scrolls the latest message into view.

---

### Step 9 · Internationalisation

Strings are currently English-only inline. Move user-visible copy into
the existing `src/lib/i18n.ts` framework (see v1 usage). Keys:

- `v2.home.greeting.morning|afternoon|evening`
- `v2.tabs.player.*`, `v2.tabs.coach.*`
- `v2.booking.step1.title`, etc.

Hebrew RTL is already handled by `[dir="rtl"]` rules in `index.css` —
verify the v2 components mirror cleanly (icon flips, scroll direction).

---

### Step 10 · Test depth

- Convert mock-data unit tests to test the hook contracts (so they keep
  passing when hooks switch to Supabase).
- Add Playwright specs: full booking happy path, cancel booking, switch
  role, theme toggle persists across reload, login + signup happy path.
- Add visual regression via Playwright screenshots for critical
  screens at 375 / 414 / 430 widths in both themes.

---

## 5 · Open questions for the product owner

1. **Coach roles** — does a hybrid user (player + coach) get one
   `coach_profile` per sport, or one per coach record? Currently we
   assume one record per user.
2. **Group session payments** — does the coach get paid only for filled
   spots, or for the full capacity as a guarantee?
3. **Tier subscription cancellation** — immediate cancel, or end-of-period?
4. **Live sessions** — is broadcasting actually a feature in v2 or a
   stretch goal? Current code is viewer-only.
5. **Bob AI** — coach-only at preview. Is there a player-facing Bob
   (training advice, recovery suggestions) planned?
6. **Calendar exports** — `Add to calendar` button on booking success
   should generate an `.ics` (web) or use `EventKit` (Capacitor plugin
   needed). Which?
7. **Reviews** — `coach_reviews` table exists in v1. Should v2 surface
   reviews on the coach profile? Currently only stars + count are shown.
8. **Locale** — confirm Israeli Shekel + DD/MM/YYYY date format is the
   default for the entire user base, or whether to detect per-user.

---

## 6 · Don't dos

- Don't modify `src/pages/UserProfile.tsx` or any v1 file unless the
  change is strictly additive (e.g., a new optional column) and you've
  verified v1 routes still work.
- Don't add npm packages without flagging — the bundle is already 347 KB
  gzipped; every dep matters.
- Don't reintroduce hardcoded hex colours in components.
- Don't bypass `formatCurrency` / `formatCompactNumber`.
- Don't import `@capacitor/*` directly in components — go through
  `src/native/useNative.ts`.
- Don't ship without `npm run build` succeeding (CLAUDE.md hard rule).
- Don't run `git push --force` or amend commits already on origin.

---

## 7 · Run book

```bash
# Web preview
npm run dev                 # http://localhost:8080

# Build + sync to Xcode (for Simulator preview)
npm run build && npm run cap:sync && npm run cap:ios

# Live reload on a physical device on the same wifi
ipconfig getifaddr en0
CAP_SERVER_URL=http://<lan-ip>:8080 npm run cap:sync
npm run dev
npm run cap:run:ios

# Tests
npm run test                # vitest
npx playwright test         # e2e

# Force v2 OFF for a TestFlight build
# (after restoring real flag logic in featureFlag.ts)
VITE_V2_FORCE=false npm run build
```

---

## 8 · Suggested first commit for the next session

1. Re-gate the flag (Step 1).
2. Build LoginV2 + SignupV2 + WelcomeV2 wired to existing Supabase.
3. Update V2Guard to read auth.
4. Add Playwright spec for the auth happy path.
5. Commit + push as `feat(v2/auth): supabase login + signup`.

That's roughly 1 focused session. Everything else queues behind it.
