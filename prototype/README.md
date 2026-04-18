# Circlo v2 Prototype

The visual prototype for v2 UI was generated in claude.ai Artifacts.
Source HTML references live in the project's claude.ai conversation history.

## Phase plan (executed by Claude Code)

1. Design tokens + Manrope + feature flag + currency util
2. Shared primitives + mock data + v2 hooks
3. Routing + V2Guard + RoleContext
4. Home + Discover pages
5. Coach profile (About / Community / Content / Shop tabs)
6. Tiers + Go Pro
7. Bob AI screens (coach-only)
8. Messaging — inbox, chat, new message
9. Booking flow — 5 steps + success
10. Player profile + bookings + settings + payments
11. Coach self-view + requests
12. Content library + video player + live viewer / recap
13. Calendar + training plans
14. Context-aware TabBar + role switcher
15. framer-motion animations
16. Tests (Playwright e2e + Vitest unit)
17. Open PR

## How to enable v2 locally

```js
// In the browser console on http://localhost:8080:
localStorage.setItem("circlo:v2_enabled", "true");
location.reload();
// Then navigate to /v2/home
```

Or set `VITE_V2_FORCE=true` in `.env.development.local`.

## Ground rules

- v2 code lives exclusively in `src/components/v2/`, `src/pages/v2/`, `src/hooks/v2/`, `src/lib/v2/`.
- v1 files are never modified.
- All v2 pages must wrap their root in `.v2-root .font-v2` (dark theme, Manrope).
- Never hardcode colours — use Tailwind tokens from `tailwind.config.ts`.
- Never hardcode `₪` — use `formatCurrency()` from `lib/v2/currency.ts`.
