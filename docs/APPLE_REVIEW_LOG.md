# Apple Review Prep Log

- `ios/App/App/Info.plist`: Missing `NSLocationWhenInUseUsageDescription`, added description for finding nearby coaches. Simulator caught: Info.plist Usage Descriptions.
- `src/pages/v2/SettingsV2Page.tsx`: Added double-prompt account deletion wired to `delete_my_account` RPC. Simulator caught: Account deletion missing.
- `src/components/v2/coach/CoachProfileHero.tsx`: Added Report/Block feature inserting to `moderation_reports` for UGC compliance. Simulator caught: UGC reporting missing.
- `ios/App/App/Info.plist`: Locked supported orientations to Portrait-only for iPhone, removed iPad stretched UI. Simulator caught: iPad layout.
- `SocialLoginButtons.tsx`: Needs `@capacitor-community/apple-sign-in` for Guideline 4.8. Added to needs deps.
- `src/pages/v2/SettingsV2Page.tsx`: Swapped `window.open()` for `openExternal` and `openSystemUrl` from `src/lib/platform.ts` so web links open in Capacitor Browser (SFSafariViewController) without breaking the app. Simulator caught: External link opens inside webview.
## Build Checks
- `npm run build` passed successfully.
- `npm run lint` has 870 errors, mostly `@typescript-eslint/no-explicit-any` and outside the V2 scope (e.g. Supabase Edge Functions). Needs a separate tech debt pass.
- `npx cap sync ios` completed successfully.
