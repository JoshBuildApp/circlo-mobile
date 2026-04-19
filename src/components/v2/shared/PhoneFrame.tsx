import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useV2Theme } from "@/contexts/v2/ThemeContext";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  /** Disable the page-entry fade. Off by default. */
  noEntry?: boolean;
}

/**
 * v2 page shell. Max 430px wide, respects Capacitor safe areas.
 * Reads the active theme from V2ThemeContext and sets data-theme on the
 * root so all v2 colour CSS variables flip together.
 * Mobile-first — on tablet/desktop it remains centered in a 430px column.
 * Wraps content in a fade+translate page entry (respects reduced-motion).
 */
export function PhoneFrame({ children, className, noEntry }: PhoneFrameProps) {
  const reduceMotion = useReducedMotion();
  const { theme } = useV2Theme();
  // v2-safe-top pads the top by env(safe-area-inset-top) so iOS status bar
  // doesn't overlap content. Pages can still add their own top padding inside.
  const baseClass = cn(
    "v2-root font-v2 v2-safe-top mx-auto w-full max-w-[430px] flex flex-col",
    className
  );

  if (noEntry || reduceMotion) {
    return <div data-theme={theme} className={baseClass}>{children}</div>;
  }

  // Opacity-only entry — `transform: translateY` on the page wrapper
  // breaks momentum scroll on iOS WebKit, so we avoid it here.
  return (
    <motion.div
      data-theme={theme}
      className={baseClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
