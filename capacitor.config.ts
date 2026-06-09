import type { CapacitorConfig } from "@capacitor/cli";

const isProdBuild = process.env.NODE_ENV === "production";

// Dev-server convention: CAP_SERVER_URL points the native shell at a running
// Vite server, e.g. CAP_SERVER_URL=http://192.168.1.42:8080 npm run cap:sync.
// Guard: never bake a remote dev server (with cleartext) into a production
// build — require an explicit CAP_SERVER_URL_FORCE=true, otherwise warn
// loudly and ignore the variable.
let devServerUrl = process.env.CAP_SERVER_URL;
if (devServerUrl && isProdBuild && process.env.CAP_SERVER_URL_FORCE !== "true") {
  console.warn(
    `[capacitor.config] WARNING: ignoring CAP_SERVER_URL=${devServerUrl} for a ` +
      "production build (NODE_ENV=production). The shipped binary would load its " +
      "entire UI from that remote URL with cleartext allowed. Set " +
      "CAP_SERVER_URL_FORCE=true to override — never for store builds.",
  );
  devServerUrl = undefined;
}

const config: CapacitorConfig = {
  appId: "club.circlo.app",
  appName: "Circlo",
  webDir: "dist",
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
    scheme: "Circlo",
    backgroundColor: "#1A1A2E",
  },
  android: {
    backgroundColor: "#1A1A2E",
    allowMixedContent: false,
    captureInput: true,
    // Debuggable WebView for dev builds only — a release build must never
    // expose the app (and its persisted session) to chrome://inspect.
    webContentsDebuggingEnabled: !isProdBuild,
  },
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
    url: devServerUrl,
    cleartext: !!devServerUrl,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#1A1A2E",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1A1A2E",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
