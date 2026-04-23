import * as Sentry from "@sentry/react";
import { isAllowed } from "@/lib/consent";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // graceful — won't break local dev without the var

  // Gate Replay (which captures session interactions, including potentially
  // sensitive form input) behind the user's error_monitoring consent. Plain
  // error capture still runs without consent so we can fix critical bugs,
  // but session-replay needs an opt-in per the Cookie Policy + Israeli PPA
  // guidance on opt-in for non-essential trackers.
  const replayConsented = isAllowed("error_monitoring");
  const integrations: Sentry.Integration[] = [Sentry.browserTracingIntegration()];
  if (replayConsented) integrations.push(Sentry.replayIntegration());

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_ENV ?? "production",
    integrations,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: replayConsented ? 0.05 : 0,
    replaysOnErrorSampleRate: replayConsented ? 1.0 : 0,
  });

  // If the user later grants consent, attach Replay mid-session.
  window.addEventListener("circlo:consent-changed", () => {
    if (!isAllowed("error_monitoring")) return;
    const client = Sentry.getClient();
    if (!client) return;
    if (client.getIntegrationByName?.("Replay")) return; // idempotent
    Sentry.addIntegration(Sentry.replayIntegration());
  });
}

export { Sentry };
