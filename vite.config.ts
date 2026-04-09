import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Circlo Mobile — Vite config tuned for Capacitor native shell.
// The same React codebase powers both the website and the native wrapper.
// Output goes into `dist/` which Capacitor (`webDir`) bundles into the app.
export default defineConfig({
  server: {
    host: "0.0.0.0", // expose on LAN so a physical device can hit the dev server
    port: 8080,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Capacitor loads assets from file:// on iOS and https://localhost on Android
    // → keep asset paths relative so they resolve under both schemes.
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-slot", "@radix-ui/react-toast"],
          supabase: ["@supabase/supabase-js"],
          charts: ["recharts"],
          forms: ["react-hook-form", "@hookform/resolvers"],
          dates: ["date-fns"],
          capacitor: [
            "@capacitor/core",
            "@capacitor/app",
            "@capacitor/status-bar",
            "@capacitor/splash-screen",
            "@capacitor/keyboard",
            "@capacitor/haptics",
            "@capacitor/preferences",
            "@capacitor/share",
            "@capacitor/network",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
