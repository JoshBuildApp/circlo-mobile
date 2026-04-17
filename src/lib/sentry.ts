import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // graceful — won't break local dev without the var

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_ENV ?? "production",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0, // always capture replay when an error occurs
  });
}

export { Sentry };
