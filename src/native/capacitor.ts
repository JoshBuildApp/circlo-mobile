/**
 * Circlo Mobile — Capacitor bootstrap
 * --------------------------------------------------------------
 * Single entry point that initializes all native integrations.
 * Runs once from `main.tsx` before React mounts.
 *
 * Everything here is a no-op on the web (Capacitor's `isNativePlatform`
 * check), so the same bundle runs in the browser during development.
 */
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { App as CapApp } from "@capacitor/app";
import { Network } from "@capacitor/network";

/** True when running inside the iOS or Android native shell. */
export const isNative = Capacitor.isNativePlatform();

/** "ios" | "android" | "web" */
export const platform = Capacitor.getPlatform();

/**
 * Initialize native plugins. Safe to call on web (plugins short-circuit).
 * Keep this list deliberate — every plugin added increases native build time.
 */
export async function initNative(): Promise<void> {
  if (!isNative) return;

  // Status bar — opaque Circlo navy with light (white) content so the native
  // status bar feels like a natural extension of the app chrome. We use
  // `overlay: false` here (iOS reserves its own strip and the webview starts
  // below) because the original overlay:true mode produced a white safe-area
  // gap on light themes that didn't match the dark status bar above it.
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#1A1A2E" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn("[circlo] status bar init failed", err);
  }

  // Splash — hide after the first paint so the app feels instant.
  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (err) {
    console.warn("[circlo] splash hide failed", err);
  }

  // Keyboard — resize the webview natively so modals and inputs stay visible.
  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    await Keyboard.setAccessoryBarVisible({ isVisible: false });
  } catch (err) {
    console.warn("[circlo] keyboard init failed", err);
  }

  // Hardware back button on Android → use React Router history instead of
  // killing the app on every tap.
  CapApp.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.exitApp();
    }
  });

  // Deep links — when the OS opens circlo:// URLs (auth callbacks, password
  // reset emails, payment returns), route them into the SPA.
  CapApp.addListener("appUrlOpen", ({ url }) => {
    try {
      // Strip scheme → in-app path. "circlo://reset-password?code=abc"
      // becomes "/reset-password?code=abc".
      const stripped = url.replace(/^circlo:\/\//i, "/").replace(/^\/\//, "/");
      if (stripped && typeof window !== "undefined") {
        window.history.pushState({}, "", stripped);
        // Let React Router pick it up.
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } catch (err) {
      console.warn("[circlo] appUrlOpen handler failed", err);
    }
  });

  // Network — fire a DOM event so hooks can react to offline state.
  Network.addListener("networkStatusChange", (status) => {
    window.dispatchEvent(
      new CustomEvent("circlo:network", { detail: status }),
    );
  });

  // Expose a tiny diagnostic handle for debugging on device.
  (window as unknown as { __circlo?: unknown }).__circlo = {
    platform,
    isNative,
    version: "0.1.0",
  };
}
