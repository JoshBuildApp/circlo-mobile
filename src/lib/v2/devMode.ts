/**
 * Developer-only controls for the v2 app.
 *
 * A small allowlist of Circlo internal emails unlocks a floating dev panel
 * that can switch between demo (mocks) and real (live Supabase) data. Normal
 * users see nothing — the helpers below return false/"demo" for them, which
 * lets `useMocks.ts` keep its current auth-aware behavior unchanged.
 */
import type { User } from "@supabase/supabase-js";

/** Emails that get the dev panel. Add with care — this grants role switching
 *  and data-mode control inside the app. Case-insensitive compare. */
const DEV_EMAILS = new Set<string>([
  "circlomanagement@circloclub.com",
]);

export function isDeveloperAccount(user: User | null | undefined): boolean {
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;
  return DEV_EMAILS.has(email);
}

// ---- Data mode ("demo" = use mocks, "real" = use live Supabase) ----

export type DataMode = "demo" | "real";

const DATA_MODE_KEY = "circlo:v2_dev_data_mode";

/** Returns the current data mode for the dev panel. Non-devs never see this,
 *  but the flag is still consulted by useMocks. Default is "demo" so that
 *  new environments land on a populated experience. */
export function getDataMode(): DataMode {
  if (typeof window === "undefined") return "demo";
  try {
    const stored = window.localStorage.getItem(DATA_MODE_KEY);
    return stored === "real" ? "real" : "demo";
  } catch {
    return "demo";
  }
}

export function setDataMode(mode: DataMode): void {
  try {
    window.localStorage.setItem(DATA_MODE_KEY, mode);
  } catch {
    /* storage unavailable */
  }
}

/** Normal production behavior: no dev-mode override. Used by useMocks to
 *  decide whether to honor the data-mode toggle at all. If the current user
 *  isn't a dev, we stick with the existing auth-aware dispatch regardless of
 *  what's in localStorage. This prevents a leaked flag from affecting end
 *  users. */
export function devOverrideActive(user: User | null | undefined): boolean {
  return isDeveloperAccount(user);
}

/** Should the hook return mocks without hitting Supabase?
 *  - Dev in demo mode: yes, always.
 *  - Dev in real mode: no — show honest empty states.
 *  - Non-dev authed: no — normal behavior.
 *  - Non-dev guest: yes — existing guest-browse behavior. */
export function shouldUseMocks(user: User | null | undefined): boolean {
  if (devOverrideActive(user)) return getDataMode() === "demo";
  return !user;
}

/** Should an empty real-query result fall back to mocks?
 *  Only "auto" (non-dev) paths fall back. Devs in real mode see empty.
 *  Devs in demo mode never fetch real in the first place. */
export function shouldFallbackToMocks(user: User | null | undefined): boolean {
  return !devOverrideActive(user);
}
