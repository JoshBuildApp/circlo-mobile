# Circlo v2 — Full Audit

**Date:** 2026-04-19
**Scope:** Everything under `/v2/*` in `circlo-mobile` (Capacitor iOS/Android wrapper).
**Stats today:** 37 v2 pages · 27 v2 components · 8 test files · ~95k LOC repo · ~349 KB main bundle gzipped.
**Live at:** [github.com/JoshBuildApp/circlo-mobile](https://github.com/JoshBuildApp/circlo-mobile) on `main`.

Priority key: **P0** = blocks launch · **P1** = needed for first paying user · **P2** = polish that decides retention.

---

## 1. Frontend / UI / UX

### Current state
- 37 v2 pages, dark theme by default, light mode opt-in via `.v2-root[data-theme="light"]` CSS vars.
- Shared primitives (`src/components/v2/shared/`): PhoneFrame, TabBar (role-aware), Avatar (image + gradient fallback), VideoThumb, Chip, KpiStrip, etc.
- Page-entry fade via framer-motion (respects reduced-motion).
- Mobile-first, max-w-[430px] gutter.

### Critical gaps
- **36 hardcoded gradients** (`bg-[#3a1c0f]`, `linear-gradient(135deg, #0f3b33 ...)`) in pages that bypass the theme system. They look broken in light mode.
- Many secondary buttons still don't have handlers (Settings rows, Discover filter chips, content library "Buy", Bob settings toggles).
- No skeleton/empty states tuned for fresh accounts — UI assumes mock data populates everything.
- A few hero gradients (Coach Profile, Booking step 4 + 5 cards, Welcome) hardcode dark navy values.
- Toast positioning is Sonner default (top-center), which collides with the v2 sticky top bar.

### Tasks
| | Task | File(s) | Priority |
|--|--|--|--|
| 1.1 | Replace 36 hardcoded gradients with CSS-var-driven helpers | `pages/v2/`, `components/v2/coach/`, `components/v2/booking/` | **P1** |
| 1.2 | Wire all remaining stub buttons (Settings rows, Discover chips, content library Buy, Bob inbox actions) | various | **P1** |
| 1.3 | Build per-screen empty states (no coaches, no sessions, no messages, no plans) | every list page | **P1** |
| 1.4 | Move Sonner Toaster `position="bottom-center"` and add `richColors` defaults globally | `App.tsx` | **P2** |
| 1.5 | Audit horizontal overflow at 320px / 375px (Discover trending, message thread name) | various | **P2** |
| 1.6 | Activity feed on UserProfileV2 is hardcoded — wire to a real `audit_log`-style query or remove until real | `pages/v2/UserProfileV2.tsx` | **P2** |
| 1.7 | Coach profile share button works but needs an OG image for the `circloclub.com/coach/{id}` link | website repo | **P2** |

---

## 2. Backend / Data layer (Supabase)

### Current state
- Project ID: `rsevfeogormnorvcvxio` (Supabase, Postgres 17).
- 99 tables in public schema; v2 reads from `profiles`, `user_roles`, `coach_profiles`, `bookings`, `messages` (partitioned), `coach_videos`, `coach_posts`, `reviews`, `availability`, `user_follows`.
- Realtime publication includes `bookings` + `messages` (added in v2 migration).
- Storage buckets: `avatars` (public, owner-only write).
- v2 hooks (`src/hooks/v2/useSupabaseQueries.ts`) wrap each table read.

### Critical gaps
- **No tables exist for: training plans, plan workouts, plan subscriptions, calendar events / personal workouts, shop items / packages, live sessions, push device tokens, in-app payment intents specific to v2.** All these screens are pure UI on top of in-memory mocks.
- **`bookings.coach_id` is `text` not `uuid`** — fragile join with `coach_profiles.id`. v1 may have written different formats.
- **No constraint preventing double-booking** (same coach + date + time).
- **No FK from `bookings.coach_id` → `coach_profiles.id`.**
- **No `availability_exceptions` mechanism** — can't model "out sick this week."
- **No row-level audit/soft-delete** on bookings (cancellation just flips status).
- `messages` table is partitioned by month through 2027 — partition maintenance (creating 2028+ partitions) needs automation.
- **No `coach_pricing` table** — `coach_profiles.price` is a single int. No tiered pricing.
- `reviews.coach_id` is uuid but `bookings.coach_id` is text — inconsistent.

### Tasks
| | Task | Priority |
|--|--|--|
| 2.1 | Migration: create `training_plans`, `plan_workouts`, `plan_subscriptions` with RLS | **P1** |
| 2.2 | Migration: create `personal_workouts` (or `calendar_events`) so add-workout writes to DB | **P1** |
| 2.3 | Migration: `device_tokens` table for push notifications (FK to auth.users, last_seen) | **P0** for push |
| 2.4 | Migration: `shop_items` table or reuse `coach_packages` (currently empty) | **P1** |
| 2.5 | Migration: `live_sessions` table OR add `is_live` + `viewers` + `started_at` to `coach_videos` | **P2** |
| 2.6 | Migration: cast `bookings.coach_id` to uuid + add FK to `coach_profiles.id` | **P0** integrity |
| 2.7 | Migration: unique partial index on `(coach_id, date, time)` where `status != 'cancelled'` to prevent double-bookings at the DB level | **P0** integrity |
| 2.8 | Migration: `coach_pricing` table (one-on-one, group, video review) keyed to coach | **P1** |
| 2.9 | Audit & enable RLS policies on all v2-touched tables — confirm read/write rules match guest vs authed scope | **P0** security |
| 2.10 | Cron job (Supabase pg_cron or edge function) to generate `messages_YYYY_MM` partitions 6 months ahead | **P1** |

---

## 3. Authentication & Onboarding

### Current state
- v1 `AuthProvider` is shared with v2.
- v2 routes: `/v2/welcome`, `/v2/login`, `/v2/signup`, `/v2/forgot-password`.
- `V2Guard` has `GUEST_BROWSE = true` so `/v2/*` is browseable without an account (mocks fill the gaps).
- Sign out is wired in Settings.
- Edit profile page exists at `/v2/profile/edit`.

### Critical gaps
- **`GUEST_BROWSE = true`** is a footgun for production — anyone can browse and "book" (mock) without signing in.
- **No onboarding flow after signup.** Player lands cold, coach lands in a zero-state dashboard.
- **No phone-number / SMS auth** even though Capacitor mobile users prefer it.
- **No social login (Apple/Google)** — required by App Store guidelines if you offer email signup.
- **Signup defaults a coach's sport to 'padel'** with no other setup — coach can't be discovered with real data.
- **Email verification message is a toast on signup**, easy to miss.
- **No "magic link" / OTP option.**
- **No account deletion flow** (GDPR requires one).
- **No "switch account" UX** for shared devices.
- **Auth state changes don't reset role context** — switching accounts can leave coach mode active.
- **Username validation is naive** (lowercase + dot replace) — collisions on common names.
- **No password strength meter** on signup.

### Tasks
| | Task | Priority |
|--|--|--|
| 3.1 | Set `GUEST_BROWSE = false` for production; build a `?guest=true` URL override for previews | **P0** |
| 3.2 | Player onboarding wizard: pick sport(s), level, city, optional phone — write to `profiles` | **P0** |
| 3.3 | Coach onboarding wizard: sport, hourly rate, intro video, first availability slot, photo | **P0** |
| 3.4 | Apple Sign-In via Supabase OAuth + Capacitor `@capacitor-community/apple-sign-in` | **P0** for iOS launch |
| 3.5 | Google Sign-In via Supabase OAuth | **P1** |
| 3.6 | Phone auth (Twilio) via Supabase | **P2** |
| 3.7 | Reset role context on `auth.user.id` change | **P1** |
| 3.8 | Username uniqueness check during signup with available alternatives shown | **P1** |
| 3.9 | Account deletion endpoint + GDPR data-export edge function | **P0** legal |
| 3.10 | Email-confirm screen ("we sent a link to X — open it to continue") instead of just a toast | **P1** |
| 3.11 | Password strength meter + min 12 chars (current is 8) | **P2** |
| 3.12 | "Sign in with Magic Link" alternative in LoginV2 | **P2** |

---

## 4. Realtime & Push notifications

### Current state
- Realtime subscriptions wired on `useChat` and `useBookingRequests` (invalidate React Query on event).
- Tables added to `supabase_realtime` publication via migration.
- `@capacitor/push-notifications` is installed but not initialised.

### Critical gaps
- **No device token registration on login.**
- **No edge function to send pushes** (e.g., on `bookings` insert → coach push).
- **No APNS cert in App Store Connect** — has to be set up in Apple Developer console first.
- **No FCM project for Android** push.
- **No in-app notification centre** — pushes fire then vanish; user can't review.
- **Realtime subscriptions are per-component** (rebuild on render). Could be promoted to a global subscription manager with reference counting.
- **No retry/backoff** on realtime channel failures.
- **No presence channel** for "Maya is online" indicators.

### Tasks
| | Task | Priority |
|--|--|--|
| 4.1 | Set up APNS certificate in Apple Developer Console + register in Supabase | **P0** |
| 4.2 | Set up Firebase project + FCM credentials for Android | **P1** |
| 4.3 | Capacitor push registration on app boot (`PushNotifications.requestPermissions` → `register` → store token in `device_tokens`) | **P0** |
| 4.4 | Edge function `notify-on-booking-insert` (triggered by Supabase webhook on `bookings` insert) → push to coach | **P0** |
| 4.5 | Edge function `notify-on-booking-status-change` → push to player when accepted/declined | **P0** |
| 4.6 | Edge function `notify-on-message-insert` → push to receiver when chat closed | **P1** |
| 4.7 | Notification centre page + bell icon with unread badge | **P1** |
| 4.8 | In-app banner for foreground notifications (Capacitor `@capacitor/local-notifications`) | **P2** |
| 4.9 | Realtime presence channel (Supabase `.channel('presence')`) for online status | **P2** |
| 4.10 | Notification preferences page (currently a stub at /v2/profile/settings → Notifications) | **P1** |

---

## 5. Payments & Monetization

### Current state
- v1 has Stripe configured (`src/lib/stripe-webhook-config.ts`).
- v2 BookingFlow Pay step is fake (no Stripe call).
- Tiers + Go Pro pages have buttons that route to mock URLs.
- No subscriptions, no payouts, no platform fee enforcement.
- `bookings.platform_fee` column exists (we're inserting `Math.round(price * 0.05)`) but nothing acts on it.

### Critical gaps
- **No revenue path.** Even if a user "books," nothing is charged.
- **No Stripe Connect for coaches** — coaches can't get paid.
- **No tier subscription billing** (member ₪59/mo, VIP ₪149/mo).
- **No cancellation/refund flow** matching the "free cancellation up to 12h" copy on review screen.
- **No invoice/receipt emails.**
- **Tax handling missing** — Israeli VAT (17%) needs to be applied.
- **No coupon/promo code engine** behind the visual input.
- **No payment-failed retry UX.**

### Tasks
| | Task | Priority |
|--|--|--|
| 5.1 | Stripe Connect onboarding for coaches (express accounts) — new `/v2/coach-me/payouts/setup` page | **P0** for revenue |
| 5.2 | Real Stripe payment intent on booking Pay step (Stripe Elements + Apple Pay sheet) | **P0** |
| 5.3 | Edge function `create-booking-payment` that creates intent + holds funds, finalises on coach accept | **P0** |
| 5.4 | Refund flow on cancellation within 12h policy | **P0** legal |
| 5.5 | Stripe Subscriptions for tier memberships (member, VIP) | **P1** |
| 5.6 | Stripe Tax for ILS VAT collection | **P1** |
| 5.7 | Coupon table + apply logic for the promo input on Pay step | **P2** |
| 5.8 | Payouts dashboard for coaches (show next payout amount, history, bank details) — currently shows hardcoded ₪9,680 | **P1** |
| 5.9 | Payment receipt edge function + email template | **P1** |
| 5.10 | Failed-payment recovery emails (3 attempts over 7 days for subscriptions) | **P2** |

---

## 6. Content & Media

### Current state
- `avatars` storage bucket created with RLS, public read, owner-only write.
- `uploadAvatar()` helper in `src/lib/v2/storage.ts`, wired to player profile pencil.
- `coach_videos.thumbnail_url` exists but isn't surfaced in `VideoThumb` (still uses gradient placeholder).
- `coach_videos.media_url` exists but VideoPlayerPage shows a fake static gradient instead of an actual `<video>` tag.

### Critical gaps
- **VideoPlayerPage doesn't actually play video.** Just a styled mock.
- **No image compression** before avatar upload (could hit 5MB cap unnecessarily).
- **No `coach-content` storage bucket** for videos / docs / training plan PDFs.
- **No `cover_image_url`** on coaches for hero backdrops.
- **No ability for coach to upload videos** in-app (CoachSelfPage "Upload content" button is dead).
- **No video processing pipeline** (no thumbnail generation, no HLS variants for streaming).
- **No moderation** on uploaded content.
- **No exclusive-content gating enforcement** — `coach_videos.is_exclusive` is set but the player can still hit `media_url` directly if they have it.

### Tasks
| | Task | Priority |
|--|--|--|
| 6.1 | Wire `VideoThumb` to use `coach_videos.thumbnail_url` when present | **P1** |
| 6.2 | VideoPlayerPage: real `<video>` tag with HLS source, poster, controls hookup | **P0** to ship content |
| 6.3 | Migration: `coach-content` bucket with tier-aware RLS (free/circle/vip readable based on user_follows + tier subscription) | **P0** |
| 6.4 | Coach upload UI on `/v2/coach-me/content` — pick file, set tier, upload → insert `coach_videos` row | **P0** |
| 6.5 | Edge function on upload to extract a poster frame + generate 480p/720p variants (or use Mux/Cloudflare Stream) | **P1** |
| 6.6 | Image compression + resize on upload via `browser-image-compression` (already small enough for one dep) | **P1** |
| 6.7 | Add `cover_image_url` column to `coach_profiles`; surface on hero | **P2** |
| 6.8 | Content moderation: flag-for-review queue + manual approval before public listing | **P2** legal |
| 6.9 | Signed URLs for premium video files; expire in 4 hours | **P0** for paid content |

---

## 7. Native / Capacitor

### Current state
- Capacitor 6 installed with: app, status-bar, splash-screen, keyboard, haptics, preferences, share, network, push-notifications, browser, camera, filesystem.
- `src/native/useNative.ts` wraps haptics, share, network, platform.
- v2 actually uses: `useShare` (coach profile only). That's it.
- Status bar is not theme-aware.
- App icon + launch screen are still defaults.

### Critical gaps
- **Almost no haptic feedback** anywhere in v2. Tap-and-go interactions feel like a webview.
- **Status bar style doesn't follow theme** — light status text on light background = invisible.
- **Keyboard handling** on chat: typing on iPhone hides the input behind the keyboard.
- **No splash screen branding** — defaults to white.
- **Camera plugin installed but unused** — should be available in avatar upload UI.
- **Filesystem plugin unused** — could enable offline content downloads for VIP video.
- **App ID `club.circlo.app`** is set; bundle name + display name might not match v2.

### Tasks
| | Task | Priority |
|--|--|--|
| 7.1 | Haptics: `useHaptics().tap("light")` on every primary CTA, `success()` on booking confirmed, `error()` on toast errors | **P1** |
| 7.2 | StatusBar plugin helper that calls `setStyle({ style: theme === 'dark' ? Style.Light : Style.Dark })` | **P0** for both themes |
| 7.3 | Keyboard plugin: `Keyboard.setResizeMode({mode: KeyboardResize.Body})` + scroll-into-view on focus | **P0** for chat usable |
| 7.4 | App icon set: 1024x1024 master + sized exports for iOS + Android via `cordova-res` or manual | **P0** for launch |
| 7.5 | Splash screen: branded teal-on-dark with Circlo wordmark | **P0** for launch |
| 7.6 | Native share: wire Coach posts share, content video share, training plan share | **P1** |
| 7.7 | Camera capture option in avatar upload modal (vs file picker) | **P2** |
| 7.8 | Pull-to-refresh on home, discover, messages (Capacitor doesn't ship this — implement with `useScrollPosition` + `react-pull-to-refresh`) | **P2** |
| 7.9 | App Store metadata (description, screenshots, age rating, privacy nutrition labels) | **P0** for submission |

---

## 8. Performance

### Current state
- Main bundle: 349 KB gzipped — borderline-OK for first paint, heavy for cold open on 3G.
- Charts bundle: 422 KB ungzipped — only used by v1 admin views.
- React Query cache is global with no GC tuning.
- No virtualization on any list.
- Realtime subscriptions are per-component.

### Critical gaps
- **Charts dep (recharts) is ~400 KB** and v2 doesn't use it — still bundled because v1 imports it.
- **No prefetching** of likely-next routes (e.g., when on Discover, prefetch the top coach).
- **Long lists (Discover trending, all coaches) have no virtualization** — fine at 27 coaches, broken at 1000.
- **No image lazy-loading sentinel** — `<img loading="lazy">` is used but no IntersectionObserver fallback for older Webviews.
- **No service-worker / offline cache.**
- **React Query default `staleTime: 0`** — every page revisit refetches even if data is fresh.
- **Mock data is bundled into production** — adds ~15 KB unnecessarily.

### Tasks
| | Task | Priority |
|--|--|--|
| 8.1 | Set `staleTime: 30_000` on most v2 query defaults; per-hook overrides where needed | **P1** |
| 8.2 | Code-split v1 routes that use recharts so v2 builds don't pull it | **P1** |
| 8.3 | Tree-shake mock data out of production builds (move to `src/lib/v2/mockData.dev.ts` or wrap in `if (import.meta.env.DEV)`) | **P1** |
| 8.4 | Virtualize `MessagesInboxPage`, Discover `Trending`, `MyBookingsPage` with `@tanstack/react-virtual` (already a dep) | **P2** |
| 8.5 | Prefetch coach profile on Discover card hover/long-press | **P2** |
| 8.6 | Service worker for offline static asset cache + last-seen booking list | **P2** |
| 8.7 | Promote realtime channels to a global manager with refcount instead of one-per-component | **P2** |
| 8.8 | Lighthouse + bundle-analyzer pass; aim for ≤200 KB main JS | **P1** |

---

## 9. Security & Privacy

### Current state
- RLS enabled on all 99 public tables.
- Storage bucket `avatars` policies scoped to owner.
- v2 inherits Sentry from v1.
- Auth is Supabase JWT.

### Critical gaps
- **RLS policies on `coach_profiles` / `bookings` / `messages` haven't been audited for v2 patterns.** A coach reading bookings should see only their own students; a player reading bookings should see only their own. Not verified.
- **No input validation** on the booking insert (price, date, time could be tampered with from the client).
- **No rate limiting** on signup, login, password reset, message send.
- **No email enumeration protection** on the forgot-password page (currently shows the email back to the user — minor leak).
- **No content security policy** (CSP) header on the web build.
- **Sentry tags** don't include user_id/role — hard to debug user-reported bugs.
- **No GDPR data-export / data-deletion endpoints.**
- **No audit log** of sensitive actions (role changes, payment events, account deletion).
- **API keys** in `.env` aren't rotated.

### Tasks
| | Task | Priority |
|--|--|--|
| 9.1 | RLS audit on every v2-touched table; write a SQL test suite that asserts each policy | **P0** |
| 9.2 | Move booking insert/update behind a SQL function with input validation (price recalculated server-side) | **P0** |
| 9.3 | Rate-limit signup/login/reset via Supabase `rate_limits` table or edge-function middleware | **P0** |
| 9.4 | Forgot password page should always show the same "if account exists, we sent it" message regardless | **P1** |
| 9.5 | CSP header on the web build (Vite plugin or hosting layer) | **P1** |
| 9.6 | Sentry: tag every span with `user_id`, `role`, `app_version` | **P1** |
| 9.7 | GDPR: `/v2/profile/data` page with download + delete + export JSON | **P0** for EU users |
| 9.8 | Audit log table — append-only, RLS for user to read own + admin to read all | **P1** |
| 9.9 | API key rotation script + document the runbook | **P2** |

---

## 10. Testing & QA

### Current state
- 8 test files total: 4 v2 unit (Chip, KpiStrip, currency, featureFlag), 4 v1 hook tests.
- 1 Playwright spec at `e2e/v2/v2-smoke.spec.ts` — 11 tests covering routing + auth + booking advance.
- No CI runs them.

### Critical gaps
- **No tests cover the real-data hooks** (`useCoaches`, `useMyPlayerProfile`, etc.) — biggest regression risk.
- **No test for the booking insert + status update flow.**
- **No test for the chat send + realtime delivery.**
- **No test for the avatar upload flow.**
- **No visual regression** baseline.
- **No accessibility tests** (axe-core).
- **No Capacitor-native tests** (would need Detox or XCUITest).

### Tasks
| | Task | Priority |
|--|--|--|
| 10.1 | Mock Supabase client in Vitest setup; write hook tests for every Supabase-aware hook in `useMocks.ts` | **P0** |
| 10.2 | Playwright e2e: full booking happy path (login → discover → coach → book → success → coach side accept → player sees confirmed) | **P0** |
| 10.3 | Playwright e2e: chat send + recipient sees it via realtime | **P1** |
| 10.4 | Playwright e2e: avatar upload + verify the URL appears in the next render | **P1** |
| 10.5 | Add `@axe-core/playwright` checks on every v2 page | **P1** |
| 10.6 | Visual regression with Playwright screenshots at 375 / 414 / 430 widths in both themes | **P2** |
| 10.7 | Detox (RN) or XCUITest setup for native gestures (haptics, swipes, keyboard) | **P2** |
| 10.8 | k6 / Artillery load test on the booking insert path before launch | **P1** |

---

## 11. DevOps / CI / CD

### Current state
- No GitHub Actions workflows.
- Manual `npm run preview:build && npx cap sync ios` to update Xcode preview.
- Lovable auto-deploys the website (`supabase-starter-kit` repo) on push to main; mobile repo doesn't.
- No staging environment.

### Critical gaps
- **No CI** — easy to merge a build break.
- **No automated TestFlight / Play Internal Testing pipeline.**
- **No staging environment** — every test happens against production Supabase.
- **No preview-deployment-per-PR.**
- **No automatic Sentry release uploads** (sourcemaps are missing → unreadable stack traces).
- **No version bump automation** (capacitor.config.ts version + package.json + iOS/Android plist sync).

### Tasks
| | Task | Priority |
|--|--|--|
| 11.1 | GitHub Actions: lint + typecheck + vitest + playwright on every PR | **P0** |
| 11.2 | GitHub Actions: build iOS via Fastlane → upload to TestFlight on tag | **P0** |
| 11.3 | GitHub Actions: build Android AAB → upload to Play Internal Testing on tag | **P0** |
| 11.4 | Staging Supabase project clone + GitHub env var routing to staging on `next` branch | **P0** |
| 11.5 | Per-PR preview Vercel/Netlify deploy of the web build | **P1** |
| 11.6 | Sentry release upload (sourcemaps) in build pipeline | **P1** |
| 11.7 | Version-bump script (`npm run release:patch` → bumps all version files + commits + tags) | **P2** |
| 11.8 | Database migration linting (preserve down-migration parity) | **P2** |

---

## 12. Internationalization & Accessibility

### Current state
- v1 has `src/lib/i18n.ts` with English + Hebrew strings.
- v2 strings are all inline English.
- v1 has RTL handling for Hebrew (`[dir="rtl"]` selectors in `index.css`).
- v2 components mostly use Tailwind logical classes — should mirror cleanly, but never tested.

### Critical gaps
- **No v2 strings in i18n catalog.**
- **RTL not tested** on v2.
- **No locale selector UI** in v2 settings (the row exists but is dead).
- **Currency hardcoded ILS** — locale-aware util exists but always passes `'ILS'`.
- **Date/time formatting hardcoded** in places (`toLocaleDateString("en-US", ...)` everywhere).
- **No screen-reader testing** done on v2.
- **Many icon-only buttons missing aria-label**.
- **Color contrast not audited** for AA.
- **Focus rings missing** on most interactive elements.

### Tasks
| | Task | Priority |
|--|--|--|
| 12.1 | Move all v2 user-facing strings into `src/lib/i18n.ts` with `v2.*` namespace | **P1** |
| 12.2 | Add Hebrew translations for v2 namespace | **P1** |
| 12.3 | RTL audit + fix: chevrons mirror, scroll direction, sticky bar offsets | **P1** |
| 12.4 | Locale selector in Settings → Language flips lng + reloads | **P1** |
| 12.5 | Currency switcher in Settings + persist + apply via `formatCurrency(amount, currency)` | **P2** |
| 12.6 | Replace `toLocaleDateString("en-US", ...)` calls with locale-aware helper | **P2** |
| 12.7 | Add aria-label on every icon-only button (Discover filter chips, Avatar onClick, etc.) | **P0** WCAG |
| 12.8 | Color contrast pass at AA (4.5:1 body, 3:1 large) — `.text-v2-muted` may fail | **P0** WCAG |
| 12.9 | Visible focus rings on all interactive elements | **P0** WCAG |
| 12.10 | Screen-reader walk-through of the booking flow | **P1** |
| 12.11 | `prefers-reduced-motion` actually disables ALL animations (currently only the named ones) | **P2** |

---

## 13. Analytics & Observability

### Current state
- Sentry is initialised in v1 (`src/lib/sentry.ts`).
- No product analytics (PostHog, Mixpanel, Amplitude, etc.).
- No funnel tracking.
- No A/B testing framework.

### Critical gaps
- **No way to know how many users sign up vs book.**
- **No funnel data** for the booking wizard (where do users drop off?).
- **No retention metrics.**
- **No revenue dashboard.**
- **Sentry has no v2-specific tags.**
- **No structured logging** on edge functions.

### Tasks
| | Task | Priority |
|--|--|--|
| 13.1 | PostHog (or Amplitude) install + identify on login | **P1** |
| 13.2 | Funnel events: `signup_started`, `signup_completed`, `discover_viewed`, `coach_viewed`, `book_started`, `book_step_*`, `book_completed`, `cancel`, `accept`, `decline` | **P1** |
| 13.3 | Cohort dashboard for D1/D7/D30 retention | **P1** |
| 13.4 | Add `app_version`, `platform`, `theme`, `role` tags to every Sentry event | **P1** |
| 13.5 | A/B test framework (PostHog feature flags) — test booking flow variants | **P2** |
| 13.6 | Revenue dashboard pulling from Stripe + Supabase joined view | **P1** |
| 13.7 | Edge function structured logging → Supabase logs explorer + Sentry breadcrumbs | **P1** |

---

## 14. Documentation & Code quality

### Current state
- `V2_ROLLOUT.md` and `V2_UPGRADE_PLAN.md` at repo root.
- `CLAUDE.md` has agent guardrails.
- Most v2 code has top-of-file purpose comments.
- `useMocks.ts` is a tangled facade mixing mock-only and Supabase-aware hooks (450+ lines).

### Critical gaps
- **`useMocks.ts` is 450+ lines** and growing. Should be split.
- **No API contracts documented** between hooks and screens.
- **No README for `src/components/v2/shared/`** explaining the primitives.
- **No ADR (Architecture Decision Records)** for things like "why CSS vars for theming" or "why mock fallback."
- **No Storybook** for the primitives — designers can't see them in isolation.
- **No JSDoc on public helpers** in `useSupabaseQueries.ts`.

### Tasks
| | Task | Priority |
|--|--|--|
| 14.1 | Split `useMocks.ts` → `useMockData.ts` + per-domain Supabase hook files (`useCoaches.ts`, `useBookings.ts`, etc.) | **P1** |
| 14.2 | README in `src/components/v2/shared/` with prop signatures + usage examples | **P2** |
| 14.3 | ADR-001 (Theme system), ADR-002 (Mock fallback), ADR-003 (Role context) — keep in `docs/adr/` | **P2** |
| 14.4 | Storybook 8 install — wrap shared primitives | **P2** |
| 14.5 | JSDoc on all exports in `useSupabaseQueries.ts` (already started) — finish | **P2** |
| 14.6 | Auto-generated TypeScript types from Supabase via `supabase gen types typescript` in CI | **P1** |

---

## 15. Cross-cutting decisions to make NOW

These aren't tasks — they're calls the product owner needs to make so engineering doesn't go in circles:

1. **Launch market.** Israel only? Add other countries later? Affects payments, locale, legal copy.
2. **Pricing model.** Platform fee % vs flat? Subscription tiers actually subscriptions or one-shots? The whole tiers page hangs on this.
3. **Coach approval.** Self-service signup, or manual admin approval? Affects coach onboarding flow + content moderation.
4. **Live broadcasting.** Is it actually a feature, or a stretch goal? Current code is viewer-only and would need RTC infra (LiveKit / Agora) to be real.
5. **Bob AI.** Player-facing too, or coach-only forever? Big scope difference.
6. **iOS vs Android priority.** App Store first → focus on Apple Sign-In + APNS. Play Store → FCM + Material polish.
7. **App vs web.** Are most users coming via Capacitor app, or via the website? Affects whether to invest in Capacitor polish or web SEO.

---

## 16. Suggested 4-week sprint plan

If you wanted to get to a real public launch, the smallest path:

**Week 1 — Trust**
- 2.6 (FK), 2.7 (unique slot), 9.1 (RLS audit), 9.2 (server-side booking), 9.3 (rate limiting), 9.7 (GDPR).

**Week 2 — Money**
- 5.1 (Stripe Connect), 5.2 (Pay step), 5.3 (intent edge fn), 5.4 (refund), 5.5 (subscriptions).

**Week 3 — Onboarding & Push**
- 3.1 (flag off), 3.2 (player wizard), 3.3 (coach wizard), 3.4 (Apple), 4.1–4.5 (push end-to-end).

**Week 4 — Polish & launch**
- 7.2 (status bar), 7.3 (keyboard), 7.4 (icon), 7.5 (splash), 11.1 (CI), 11.2 (TestFlight), 14.6 (gen types), 1.1 (gradient cleanup).

That's roughly the floor for "I'd let real strangers use this." Below that floor it's a strong demo, not a product.

---

## 17. What this audit doesn't cover

- The website (`supabase-starter-kit` / circloclub.com).
- The admin dashboard (`circlo-hub`).
- Marketing site / blog.
- Email templates / transactional email design.
- Customer support tooling.
- Coach success metrics dashboard.
- Community moderation tools.
- Legal: ToS, Privacy, Coach Agreement, Trainee Waiver — exist in v1, may need v2-specific updates.

---

**Bottom line.** Architecture is sound. The 30+ screens + theme + role + auth + most data hooks done in a weekend is genuine progress. But there are roughly **150 distinct tasks** above before this is a launchable product, and probably 4–6 focused weeks at the suggested pace. The work that remains isn't technically hard — it's mostly volume, schema design, and the boring parts (payments, push, CI, accessibility) that determine whether real users stay or leave.
