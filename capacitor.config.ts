import type { CapacitorConfig } from "@capacitor/cli";

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
    webContentsDebuggingEnabled: true,
  },
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
    // For local dev against the running Vite server, set CAP_SERVER_URL
    // e.g. CAP_SERVER_URL=http://192.168.1.42:8080 npm run cap:sync
    url: process.env.CAP_SERVER_URL,
    cleartext: !!process.env.CAP_SERVER_URL,
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
