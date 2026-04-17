/**
 * Platform-aware helpers.
 *
 * Use these instead of `window.open` / `window.location.origin` / `location.href`
 * so the same code works on web and inside the Capacitor native shell.
 */
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App as CapApp } from "@capacitor/app";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

/** Production web origin (Supabase redirects, share URLs). */
export const WEB_ORIGIN = "https://circloclub.com";

/** Custom URL scheme registered with iOS + Android for deep links. */
export const NATIVE_SCHEME = "circlo://";

/**
 * Origin to use for redirect URLs (Supabase auth, OAuth, password reset,
 * email confirmation, payment return, share links, etc.).
 *
 * - On native: use the custom scheme so the OS routes the callback back
 *   into the app.
 * - On web: use the actual browser origin.
 */
export function getOrigin(): string {
  if (isNative) return NATIVE_SCHEME.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return WEB_ORIGIN;
}

/**
 * Build an absolute URL for a given in-app path, platform-aware.
 * Example: authRedirect("/reset-password") → "circlo://reset-password"
 *                                          → "https://circloclub.com/reset-password"
 */
export function authRedirect(path: string): string {
  const base = getOrigin();
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * Build a public share URL (always the web origin — stores, social media,
 * WhatsApp all need a real https link, never `circlo://`).
 */
export function shareUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${WEB_ORIGIN}${suffix}`;
}

/**
 * Open an external URL. Uses the Capacitor in-app browser on native,
 * `window.open(url, "_blank")` on web.
 *
 * Use this INSTEAD of `window.open(url, "_blank")` everywhere.
 */
export async function openExternal(url: string): Promise<void> {
  if (isNative) {
    try {
      await Browser.open({ url, presentationStyle: "popover" });
      return;
    } catch (err) {
      console.warn("[circlo] Browser.open failed, falling back", err);
    }
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Hand a non-http URL to the OS (mailto:, tel:, whatsapp://, etc.).
 * Uses `App.openUrl` on native, `window.location.href` on web.
 */
export async function openSystemUrl(url: string): Promise<void> {
  if (isNative) {
    try {
      await CapApp.openUrl({ url });
      return;
    } catch (err) {
      console.warn("[circlo] App.openUrl failed, falling back", err);
    }
  }
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}
