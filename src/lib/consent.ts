// Consent state for the cookie banner.
//
// Three categories per Cookie Policy §2:
//   - essential        — always on, never toggled
//   - analytics        — PostHog SDK; opt-in only
//   - error_monitoring — Sentry session-replay; opt-in only
//
// Persists to localStorage. SSR-safe (returns null on server). Bumping
// CONSENT_VERSION re-prompts every user. Re-prompt also fires after 12 months.
//
// Aligned with israeli-privacy-shield + GDPR best practice:
//   - Default = no consent (until user picks)
//   - Reject is as easy as Accept
//   - Closing the banner = reject
//   - 12-month re-prompt
//   - Withdrawal as easy as granting (footer "Privacy preferences" link
//     re-opens the same dialog)

export type ConsentCategory = "essential" | "analytics" | "error_monitoring";

export interface ConsentState {
  version: number;
  categories: {
    essential: true;             // type-level invariant: essential is always on
    analytics: boolean;
    error_monitoring: boolean;
  };
  timestamp: string;             // ISO when set
}

export const CONSENT_VERSION = 1;
const STORAGE_KEY = "circlo_consent_v1";
const REPROMPT_AFTER_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

/** Read consent state from localStorage. Returns null if missing, expired, or version-mismatch. */
export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (!parsed.timestamp) return null;
    const age = Date.now() - new Date(parsed.timestamp).getTime();
    if (age > REPROMPT_AFTER_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(state: Omit<ConsentState, "version" | "timestamp">): ConsentState {
  const full: ConsentState = {
    version: CONSENT_VERSION,
    categories: state.categories,
    timestamp: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    /* localStorage may be blocked (private browsing, quota); fail silently. */
  }
  // Notify any subscribers (the banner, the PostHog gate, etc.)
  window.dispatchEvent(new CustomEvent("circlo:consent-changed", { detail: full }));
  return full;
}

export function clearConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* noop */ }
  window.dispatchEvent(new CustomEvent("circlo:consent-changed", { detail: null }));
}

export function isAllowed(category: ConsentCategory): boolean {
  if (category === "essential") return true;
  const state = readConsent();
  if (!state) return false;
  return state.categories[category] === true;
}

/** Convenience: accept everything except marketing-style trackers. */
export const ACCEPT_ALL: Omit<ConsentState, "version" | "timestamp"> = {
  categories: { essential: true, analytics: true, error_monitoring: true },
};

/** Convenience: reject everything that isn't essential. */
export const REJECT_ALL: Omit<ConsentState, "version" | "timestamp"> = {
  categories: { essential: true, analytics: false, error_monitoring: false },
};
