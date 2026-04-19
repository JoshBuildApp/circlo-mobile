# Circlo v2 UI rollout

A parallel v2 UI lives under `/v2/*`. Everything is feature-flagged, fully
isolated from v1, and ready to ship to production. v1 routes and components
are unchanged.

## Enabling v2

In the browser console on the running app:

```js
localStorage.setItem("circlo:v2_enabled", "true");
location.reload();
```

Or visit `/v2/enable` and tap **Turn on**, or set `VITE_V2_FORCE=true` in
`.env.development.local`. With the flag off, all `/v2/*` routes redirect to
`/v2/enable`.

## Routes (all live)

| Path | Page | Phase |
|---|---|---|
| `/v2/enable` | EnableV2 (flag toggle + overview) | 3 |
| `/v2/home` | HomePage | 4 |
| `/v2/discover` | DiscoverPage | 4 |
| `/v2/coach/:id` | CoachProfile · About | 5 |
| `/v2/coach/:id/community` | CoachProfile · Community | 5 |
| `/v2/coach/:id/shop` | CoachProfile · Shop | 5 |
| `/v2/coach/:id/content` | ContentLibrary | 12 |
| `/v2/coach/:id/join` | TiersPage | 6 |
| `/v2/go-pro` | GoProPage | 6 |
| `/v2/bob` | BobPage (empty / chat — coach-only) | 7 |
| `/v2/bob/threads` | BobDrawer (coach-only) | 7 |
| `/v2/bob/settings` | BobSettings (coach-only) | 7 |
| `/v2/bob/inbox` | BobInbox (coach-only) | 7 |
| `/v2/messages` | MessagesInbox | 8 |
| `/v2/messages/new` | NewMessage | 8 |
| `/v2/messages/:threadId` | Chat | 8 |
| `/v2/calendar` | Calendar (Month/Week/List) | 13 |
| `/v2/calendar/:date` | DayDetail | 13 |
| `/v2/calendar/add-workout` | AddWorkout | 13 |
| `/v2/book/:coachId` | BookingFlow (5 steps, supports `?date=`) | 9 |
| `/v2/book/:bookingId/success` | BookingSuccess | 9 |
| `/v2/profile` | UserProfile (with hybrid switch) | 10 |
| `/v2/profile/bookings` | MyBookings | 10 |
| `/v2/profile/settings` | Settings | 10 |
| `/v2/profile/payments` | PaymentMethods | 10 |
| `/v2/coach-me` | CoachSelf (dashboard) | 11 |
| `/v2/coach-me/requests` | CoachRequests | 11 |
| `/v2/coach-me/content` | ContentLibrary | 12 |
| `/v2/video/:videoId` | VideoPlayer | 12 |
| `/v2/live/:sessionId` | LiveViewer | 12 |
| `/v2/live/:sessionId/ended` | LiveEnded (recap) | 12 |
| `/v2/plans/:planId` | TrainingPlanDetail | 13 |
| `/v2/plans/:planId/subscribe` | PlanSubscribeFlow | 13 |

## File map

```
src/
├── lib/v2/
│   ├── featureFlag.ts          # isV2Enabled / setV2Enabled
│   ├── currency.ts             # formatCurrency / formatCompactNumber / formatPrice
│   ├── mockData.ts             # all typed mock data
│   ├── currency.test.ts
│   └── featureFlag.test.ts
├── types/v2/
│   └── index.ts                # all v2 domain types
├── hooks/v2/
│   └── useMocks.ts             # react-query wrappers (300ms delay)
├── contexts/v2/
│   └── RoleContext.tsx         # player/coach role + persistence
├── components/v2/
│   ├── V2Guard.tsx
│   ├── shared/                 # PhoneFrame, StatusBar, TabBar, RoundButton,
│   │                           # Chip, StatCard, KpiStrip, SectionHeader,
│   │                           # HScroll, PulseDot, Avatar, VideoThumb
│   ├── home/                   # LiveCard, CoachCard, PostRow
│   ├── coach/                  # CoachProfileHero, AboutTab, CommunityTab,
│   │                           # ShopTab, BookingBar, RequestCard
│   ├── booking/                # StepShell
│   └── bob/                    # BobHeader, CoachOnly
└── pages/v2/                   # 27 page components
e2e/v2/
└── v2-smoke.spec.ts            # 11 Playwright smoke tests
```

## Design tokens

Added to `tailwind.config.ts` non-destructively (v1 tokens preserved):

- `teal.soft / teal.dim`, `orange.soft / orange.dim`
- `navy-card-2`, `navy-line`, `offwhite`, `danger`
- `v2-muted`, `v2-muted-2` (dark-theme aware; doesn't shadow shadcn `muted`)
- `borderRadius.card` (18px), `borderRadius.pill`
- `fontFamily.v2` — Manrope stack, opt-in via `font-v2` class
- CSS utilities (in `src/index.css`): `.tnum`, `.v2-root`, `.v2-safe-top`,
  `.v2-safe-bottom`, `.v2-pulse-dot`
- Keyframes: `v2-pulse-dot`, `v2-float-up`, `v2-slide-up`, `v2-typing-bounce`
- All animations respect `prefers-reduced-motion`

## Architecture rules (enforced)

- v2 code is fully scoped under `*/v2/` directories. v1 is never modified.
- All v2 pages root in `<PhoneFrame>` which applies `.v2-root .font-v2` and a
  fade-in page entry.
- `<TabBar>` reads role from `useRole()` when `mode` is omitted.
- All currency goes through `formatCurrency()` / `formatPrice()`.
- All numeric stats use the `.tnum` utility for tabular numerals.
- No hardcoded hex colours in components.
- No `any` in TypeScript.
- Components stay under 150 lines (with rare exceptions in flow pages
  where a step body is naturally long).
- Bob AI screens are wrapped in `<CoachOnly>` which redirects players home.

## Hybrid users (athlete + coach)

- `RoleContext` persists the active role in `localStorage[circlo:v2_role]`.
- `UserProfileV2` shows an orange "Switch to coach view" pill when
  `roles.includes("coach")` — switches role and navigates to `/v2/coach-me`.
- `CoachSelfPage` shows a "Switch to player" link in the footer.
- Tab bar adapts automatically: player tabs are
  Home / Discover / Calendar / Messages / Profile; coach tabs are
  Dashboard / Messages / Bob / Content / Profile.

## Mock data

Hooks under `src/hooks/v2/useMocks.ts` wrap typed fixtures from
`src/lib/v2/mockData.ts` with `useQuery` + a 300ms delay so loading states
are exercised. Every hook keeps a stable contract; flipping to real Supabase
queries is a one-file change per hook.

## Tests

- `npm run test` — vitest unit tests (15 v2-specific, all passing).
- `npm run lint` — ESLint clean.
- `npm run build` — clean build.
- Playwright e2e at `e2e/v2/v2-smoke.spec.ts` — 11 specs covering routing,
  player flows, coach flows, and the booking wizard.

## Open follow-ups (intentionally deferred)

- Wire mock hooks to real Supabase queries phase-by-phase.
- Per-screen empty/error states have a sensible default but can be tuned
  per-page once real data shapes land.
- Calendar Week view's hour grid is functional; fancy event-block
  rendering with overlap handling is a future polish pass.
- Plan progress dashboard inside `CoachSelfPage` is sketched in the
  Content performance section — full subscriber drill-down to come.
- Replace the prototype `prototype/README.md` with a proper Storybook
  index of the v2 primitives.
