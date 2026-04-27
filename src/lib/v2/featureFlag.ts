/**
 * v2 feature flag — gates access to /v2/* routes.
 *
 * v2 currently runs on mock data — it must NOT be reachable in App Store
 * builds, otherwise Apple reviewers will see fake content (Bob threads,
 * mock coaches, etc.) and reject under guideline 2.1 (App Completeness).
 *
 * Enable by:
 *   - Setting `VITE_V2_FORCE=true` at build time (preview / internal only)
 *   - Calling `setV2Enabled(true)` from /v2/enable (persists to localStorage)
 *   - Visiting `/v2?flag=on` which is wired by V2Guard
 */
export const V2_ENABLED_KEY = "circlo:v2_enabled";

export function isV2Enabled(): boolean {
  if (typeof window === "undefined") return false;
  // Build-time override: use `VITE_V2_FORCE=true npm run build` (or the
  // `npm run preview:ios` shortcut) for internal preview / Xcode builds.
  if (import.meta.env.VITE_V2_FORCE === "true") return true;
  // Default OFF for release. v2 must be opt-in until real backend wiring
  // (Supabase, push, payments) is plumbed end-to-end.
  try {
    return window.localStorage.getItem(V2_ENABLED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setV2Enabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(V2_ENABLED_KEY, enabled ? "true" : "false");
  } catch {
    /* storage unavailable — ignore */
  }
  // Full reload so root-level guards re-evaluate.
  if (typeof window !== "undefined") window.location.reload();
}

/* Preview-only features. These surfaces render mock data even when the user
 * is logged in (the real backend isn't wired yet). Keeping them hidden by
 * default avoids shipping fake activity to real users. Flip via localStorage
 * for internal testing: `circlo:preview_bob`, `circlo:preview_live`,
 * `circlo:preview_shop`. */
function previewFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_V2_PREVIEW_ALL === "true") return true;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export const isBobEnabled = () => previewFlag("circlo:preview_bob");
export const isLiveEnabled = () => previewFlag("circlo:preview_live");
export const isShopEnabled = () => previewFlag("circlo:preview_shop");
