import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/native/useNative";

/**
 * Small banner that slides down from the top of the app when the device
 * loses network connectivity. No-op on web when the browser is online.
 */
const OfflineBanner = () => {
  const { connected } = useNetworkStatus();
  const offline = connected === false;

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          key="offline-banner"
          role="status"
          aria-live="polite"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="app-top-nav fixed inset-x-0 top-0 z-[10000] flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium shadow-md"
        >
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span>You're offline — some features may not work</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
