import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/use-pwa-install";

/**
 * Floating install-to-home-screen banner.
 * Appears at the bottom on Android/Chrome when the PWA criteria are met
 * (manifest + service worker). Dismissed state is persisted in sessionStorage
 * so it doesn't re-appear mid-session but resets on next visit.
 */
export function PWAInstallPrompt() {
  const { isInstallable, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("pwa_prompt_dismissed") === "1"
  );

  const dismiss = () => {
    sessionStorage.setItem("pwa_prompt_dismissed", "1");
    setDismissed(true);
  };

  const handleInstall = async () => {
    const accepted = await triggerInstall();
    if (!accepted) dismiss(); // user declined — hide prompt
  };

  const visible = isInstallable && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="pwa-install-prompt"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className={cn(
            "fixed bottom-[72px] left-4 right-4 z-[9998]",
            "md:left-auto md:right-6 md:w-80 md:bottom-6"
          )}
          role="banner"
          aria-label="Install Circlo app"
        >
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl border border-border/20 bg-card/95 backdrop-blur-xl">
            {/* App icon */}
            <img
              src="/apple-touch-icon.png"
              alt="Circlo"
              className="h-10 w-10 rounded-xl shrink-0 object-cover"
            />

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground leading-tight">
                Add Circlo to Home Screen
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Fast access. Works offline.
              </p>
            </div>

            {/* Install button */}
            <button
              onClick={handleInstall}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5",
                "text-[12px] font-semibold text-white",
                "bg-gradient-to-r from-[#00D4AA] to-[#00b899]",
                "active:scale-95 transition-transform"
              )}
              aria-label="Install app"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
