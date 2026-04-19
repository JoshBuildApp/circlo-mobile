/**
 * v2 feature flag — gates access to /v2/* routes.
 *
 * Enable by:
 *   - Setting `VITE_V2_FORCE=true` in env (dev/preview builds)
 *   - Calling `setV2Enabled(true)` (persists to localStorage)
 *   - Visiting `/v2?flag=on` which is wired by V2Guard
 */
export const V2_ENABLED_KEY = "circlo:v2_enabled";

export function isV2Enabled(): boolean {
  if (typeof window === "undefined") return false;
  // Build-time override: use `VITE_V2_FORCE=true npm run build` (or the
  // `npm run preview:ios` shortcut) for Xcode preview builds.
  if (import.meta.env.VITE_V2_FORCE === "true") return true;
  // Default to v2 unless explicitly disabled via /v2/enable.
  try {
    return window.localStorage.getItem(V2_ENABLED_KEY) !== "false";
  } catch {
    return true;
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
