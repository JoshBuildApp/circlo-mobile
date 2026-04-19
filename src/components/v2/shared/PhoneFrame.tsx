import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  /** Disable the page-entry fade. Off by default. */
  noEntry?: boolean;
}

/**
 * Dark v2 page shell. Max 430px wide, respects Capacitor safe areas.
 * Mobile-first — on tablet/desktop it remains centered in a 430px column.
 * Wraps content in a fade+translate page entry (respects reduced-motion).
 */
export function PhoneFrame({ children, className, noEntry }: PhoneFrameProps) {
  const reduceMotion = useReducedMotion();
  const baseClass = cn("v2-root font-v2 mx-auto w-full max-w-[430px] flex flex-col", className);

  if (noEntry || reduceMotion) {
    return <div className={baseClass}>{children}</div>;
  }

  return (
    <motion.div
      className={baseClass}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
