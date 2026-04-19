import { CSSProperties, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * The circlo brand mark — a teal-and-orange two-arc ring with an orange dot.
 *
 * Lives on every auth screen in a different slot. Each `variant` encodes the
 * screen's position + size + glow intensity so a page only has to render
 * <CirloRing variant="welcome" /> to place it correctly.
 *
 * Visual spec (prototype/auth-flow.html):
 *   - viewBox 0 0 200 200
 *   - teal arc:   M 150 42 A 70 70 0 1 0 145 157   (long arc, ~270°)
 *   - orange arc: M 150 42 A 70 70 0 0 1 145 157   (short arc at top-right)
 *   - orange dot: cx=150 cy=42 r=13
 *   - stroke-width 18, linecap round
 *
 * Idle state: the SVG breathes on a 4s loop — scale 1 → 1.03 → 1 with a 2deg
 * sway. Breathing is applied to the inner <motion.svg>, NOT the outer wrapper,
 * so the drop-shadow filter on the wrapper stays anchored while the ring sways.
 *
 * `opening` prop is a scaffold for the Success C-collapse animation (Phase 11
 * of the v2 auth rollout). In this phase it is accepted but has no effect.
 */

export type CirloRingVariant =
  | "welcome"
  | "login"
  | "role"
  | "sports"
  | "credentials"
  | "verify"
  | "success";

interface VariantConfig {
  /** Ring diameter in px. */
  size: number;
  /** Absolute-position rules within the parent .screen. */
  position: CSSProperties;
  /** CSS filter (stacked drop-shadows) for the ring's teal + orange glow. */
  filter: string;
}

const VARIANTS: Record<CirloRingVariant, VariantConfig> = {
  welcome: {
    size: 120,
    position: { top: 140, left: "50%", transform: "translateX(-50%)" },
    filter:
      "drop-shadow(0 8px 36px rgba(0, 212, 170, 0.45)) drop-shadow(0 4px 24px rgba(255, 107, 44, 0.28))",
  },
  login: {
    size: 56,
    position: { top: 62, right: 24 },
    filter:
      "drop-shadow(0 6px 20px rgba(0, 212, 170, 0.35)) drop-shadow(0 3px 14px rgba(255, 107, 44, 0.22))",
  },
  role: {
    size: 64,
    position: { top: 80, left: "50%", transform: "translateX(-50%)" },
    filter:
      "drop-shadow(0 6px 20px rgba(0, 212, 170, 0.35)) drop-shadow(0 3px 14px rgba(255, 107, 44, 0.22))",
  },
  sports: {
    size: 36,
    position: { top: 64, right: 24 },
    filter:
      "drop-shadow(0 6px 20px rgba(0, 212, 170, 0.35)) drop-shadow(0 3px 14px rgba(255, 107, 44, 0.22))",
  },
  credentials: {
    size: 44,
    position: { top: 62, right: 24 },
    filter:
      "drop-shadow(0 6px 20px rgba(0, 212, 170, 0.35)) drop-shadow(0 3px 14px rgba(255, 107, 44, 0.22))",
  },
  verify: {
    size: 80,
    position: { top: 96, left: "50%", transform: "translateX(-50%)" },
    filter:
      "drop-shadow(0 6px 20px rgba(0, 212, 170, 0.35)) drop-shadow(0 3px 14px rgba(255, 107, 44, 0.22))",
  },
  success: {
    size: 140,
    position: { top: 130, left: "50%", transform: "translateX(-50%)" },
    filter:
      "drop-shadow(0 0 50px rgba(0, 212, 170, 0.55)) drop-shadow(0 0 30px rgba(255, 107, 44, 0.4))",
  },
};

export interface CirloRingProps {
  variant: CirloRingVariant;
  /** When false, the idle breathing animation is paused (used during the travel transition and on success C-collapse). */
  breathing?: boolean;
  /**
   * Scaffold for the Success C-collapse animation.
   * Phase 1: accepted but inert. Phase 11 will wire up the stroke-dasharray
   * collapse + living-gradient swap.
   */
  opening?: boolean;
  /** Extra className applied to the outer positioned wrapper. */
  className?: string;
  /** Inline style merged onto the outer wrapper (after the variant defaults). */
  style?: CSSProperties;
  /** Accessible label. Defaults to "Circlo". */
  "aria-label"?: string;
}

export function CirloRing({
  variant,
  breathing = true,
  opening: _opening = false,
  className,
  style,
  "aria-label": ariaLabel = "Circlo",
}: CirloRingProps) {
  const config = VARIANTS[variant];
  const prefersReduced = useReducedMotion();
  const shouldBreathe = breathing && !prefersReduced;

  // Unique per-instance IDs so multiple rings on one page don't collide on
  // gradient refs (important during framer-motion layout animations where both
  // origin and target mount briefly).
  const rawId = useId();
  const gradId = rawId.replace(/:/g, "");
  const tealGradId = `${gradId}-teal`;
  const orangeGradId = `${gradId}-orange`;

  return (
    <div
      aria-label={ariaLabel}
      role="img"
      className={className ? `circlo-ring ${className}` : "circlo-ring"}
      style={{
        position: "absolute",
        width: config.size,
        height: config.size,
        filter: config.filter,
        pointerEvents: "none",
        zIndex: 3,
        ...config.position,
        ...style,
      }}
    >
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        style={{ width: "100%", height: "100%", display: "block" }}
        animate={
          shouldBreathe
            ? { scale: [1, 1.03, 1], rotate: [0, 2, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={
          shouldBreathe
            ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0 }
        }
      >
        <defs>
          <linearGradient id={tealGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4AA" />
            <stop offset="100%" stopColor="#00B894" />
          </linearGradient>
          <linearGradient id={orangeGradId} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF6B2C" />
            <stop offset="100%" stopColor="#FF8A4C" />
          </linearGradient>
        </defs>

        {/* Long arc — ~270° teal sweep from top down around to the bottom. */}
        <path
          d="M 150 42 A 70 70 0 1 0 145 157"
          stroke={`url(#${tealGradId})`}
          strokeWidth={18}
          strokeLinecap="round"
          fill="none"
        />
        {/* Short arc — orange cap at the top-right closing the ring. */}
        <path
          d="M 150 42 A 70 70 0 0 1 145 157"
          stroke={`url(#${orangeGradId})`}
          strokeWidth={18}
          strokeLinecap="round"
          fill="none"
        />
        {/* Orange dot where the two arcs meet at the top. Hidden on success. */}
        {variant !== "success" && (
          <circle cx={150} cy={42} r={13} fill="#FF6B2C" />
        )}
      </motion.svg>
    </div>
  );
}
