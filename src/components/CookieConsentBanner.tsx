// Cookie consent banner.
//
// Mounted once at the App root. Renders only when the user has not yet
// consented (or their stored choice expired / version-bumped). Implements:
//   - 3 actions of equal visual weight: Reject all / Customize / Accept all
//   - Esc key + click-outside = Reject all (per Cookie Policy §3.1)
//   - Keyboard reachable, ARIA-labelled, polite live region for changes
//   - Re-opens from anywhere via the global `circlo:consent-open` event
//     (use this from a footer "Privacy Preferences" link)
//
// See drafts-en/03-cookie-policy.md §3 for the user-facing contract.

import { useEffect, useState, useRef } from "react";
import { Cookie, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  readConsent,
  writeConsent,
  ACCEPT_ALL,
  REJECT_ALL,
  type ConsentState,
} from "@/lib/consent";

type Mode = "summary" | "customize";

export function CookieConsentBanner() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("summary");
  const [analytics, setAnalytics] = useState(false);
  const [errorMonitoring, setErrorMonitoring] = useState(false);
  const [announce, setAnnounce] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  // On mount: if no valid consent, open the banner.
  useEffect(() => {
    const stored = readConsent();
    if (!stored) {
      setOpen(true);
    } else {
      setAnalytics(stored.categories.analytics);
      setErrorMonitoring(stored.categories.error_monitoring);
    }
  }, []);

  // Listen for an external request to re-open the banner (footer link).
  useEffect(() => {
    const handler = () => {
      const stored = readConsent();
      if (stored) {
        setAnalytics(stored.categories.analytics);
        setErrorMonitoring(stored.categories.error_monitoring);
      }
      setMode("customize");
      setOpen(true);
    };
    window.addEventListener("circlo:consent-open", handler as EventListener);
    return () => window.removeEventListener("circlo:consent-open", handler as EventListener);
  }, []);

  // Esc key = reject (per Cookie Policy §3.1).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        rejectAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function acceptAll() {
    const next = writeConsent(ACCEPT_ALL);
    onSet(next, "Saved — analytics and error monitoring enabled");
  }

  function rejectAll() {
    const next = writeConsent(REJECT_ALL);
    onSet(next, "Saved — only essential cookies");
  }

  function saveCustom() {
    const next = writeConsent({
      categories: { essential: true, analytics, error_monitoring: errorMonitoring },
    });
    onSet(next, "Saved your cookie preferences");
  }

  function onSet(_next: ConsentState, message: string) {
    setAnnounce(message);
    setOpen(false);
    setMode("summary");
  }

  if (!open) {
    // Live region kept mounted so the previous announcement fires before we unmount it.
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announce}
      </div>
    );
  }

  return (
    <>
      {/* live region for save announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announce}</div>
      {/* dim layer, click = reject (treated as dismissal) */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={rejectAll}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="circlo-consent-title"
        aria-describedby="circlo-consent-desc"
        className="fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-2xl rounded-t-2xl border border-border/60 bg-background shadow-2xl md:bottom-6 md:left-6 md:right-auto md:max-w-md md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5">
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 id="circlo-consent-title" className="text-sm font-semibold text-foreground">
                Cookies & privacy
              </h2>
              <button
                type="button"
                onClick={rejectAll}
                aria-label="Close — reject non-essential cookies"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p id="circlo-consent-desc" className="mt-1 text-xs text-muted-foreground leading-snug">
              We use essential cookies to keep you logged in. With your permission, we'd like to use analytics (PostHog) and error monitoring (Sentry) to improve the app. Closing this dialog or pressing Esc counts as Reject.
            </p>

            {mode === "customize" && (
              <div className="mt-4 space-y-3">
                <ToggleRow
                  label="Essential"
                  description="Required for login, security, and basic Platform functionality. Cannot be disabled."
                  checked={true}
                  disabled
                  onChange={() => {}}
                />
                <ToggleRow
                  label="Analytics (PostHog)"
                  description="Helps us understand which features are used. No advertising."
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <ToggleRow
                  label="Error monitoring (Sentry)"
                  description="Lets us catch and fix bugs faster."
                  checked={errorMonitoring}
                  onChange={setErrorMonitoring}
                />
              </div>
            )}

            {mode === "summary" ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button type="button" onClick={rejectAll} className={EQUAL_BTN}>
                  Reject all
                </button>
                <button type="button" onClick={() => setMode("customize")} className={EQUAL_BTN}>
                  Customize
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className={cn(EQUAL_BTN, "bg-primary text-primary-foreground border-primary hover:bg-primary/90")}
                >
                  Accept all
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMode("summary")} className={EQUAL_BTN}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={saveCustom}
                  className={cn(EQUAL_BTN, "bg-primary text-primary-foreground border-primary hover:bg-primary/90")}
                >
                  Save
                </button>
              </div>
            )}

            <p className="mt-3 text-[10px] text-muted-foreground/70 leading-snug">
              See our{" "}
              <a href="/legal/cookies" className="underline">Cookie Policy</a>
              {" · "}
              <a href="/legal/privacy" className="underline">Privacy Policy</a>
              . You can change your choice anytime from "Privacy Preferences" in the footer.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const EQUAL_BTN =
  "h-9 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted transition-colors";

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 cursor-pointer",
        disabled && "cursor-not-allowed opacity-70",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
        aria-label={`${label}: ${checked ? "on" : "off"}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground leading-snug">{description}</p>
      </div>
    </label>
  );
}
