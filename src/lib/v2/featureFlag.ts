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
  if (import.meta.env.VITE_V2_FORCE === "true") return true;
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
