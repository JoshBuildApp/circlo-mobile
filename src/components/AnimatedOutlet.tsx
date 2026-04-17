import { useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useNavDirection } from "@/hooks/use-nav-direction";
import { cn } from "@/lib/utils";

const slideVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? 30 : -30,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? -30 : 30,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] as const },
  }),
};

/**
 * FrozenSlide freezes the outlet snapshot in useState so the exiting
 * animation shows the OLD page content, not the newly-matched route.
 */
function FrozenSlide({ direction, className }: { direction: number; className?: string }) {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn("w-full", className)}
    >
      {frozen}
    </motion.div>
  );
}

interface AnimatedOutletProps {
  /** Pass the same className that was on the old animate-page-enter div */
  className?: string;
}

/**
 * Drop-in replacement for <Outlet /> that adds direction-aware slide
 * transitions using Framer Motion AnimatePresence.
 *
 * Each navigation creates a new FrozenSlide instance (via location.key).
 * The exiting instance keeps showing its original frozen outlet so the
 * old page animates out correctly while the new page slides in.
 */
export function AnimatedOutlet({ className }: AnimatedOutletProps) {
  const location = useLocation();
  const direction = useNavDirection();

  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <FrozenSlide
        key={location.key}
        direction={direction}
        className={className}
      />
    </AnimatePresence>
  );
}
