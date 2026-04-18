import { cn } from "@/lib/utils";

/**
 * Animated teal dot used on availability/live indicators.
 * Respects `prefers-reduced-motion` (via .v2-pulse-dot CSS rule).
 */
export function PulseDot({ className, size = 8 }: { className?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn("v2-pulse-dot inline-block rounded-full bg-teal", className)}
      style={{
        width: size,
        height: size,
        boxShadow: "0 0 0 4px rgba(0,212,170,0.25)",
      }}
    />
  );
}
