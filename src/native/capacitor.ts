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

  // Status bar — match Circlo navy and overlay the webview so hero gradients
  // can bleed under the notch/Dynamic Island on iOS.
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#1A1A2E" });
    await StatusBar.setOverlaysWebView({ overlay: true });
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
