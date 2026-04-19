import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HScrollProps {
  children: ReactNode;
  className?: string;
  snap?: boolean;
}

/**
 * Horizontal scroll container tuned for touch.
 * NOTE: We do NOT set `touch-action: pan-x` because that prevents iOS
 * from passing vertical swipes through to the page scroll, causing the
 * "stuck swipe" feeling. Browsers correctly route gestures based on
 * direction when touch-action is left at its default `auto`.
 * `overscroll-behavior-inline: contain` keeps horizontal overscroll from
 * bubbling up to the page (which would otherwise trigger swipe-back).
 */
export function HScroll({ children, className, snap }: HScrollProps) {
  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto overflow-y-hidden px-5 scrollbar-none",
        snap && "snap-x snap-mandatory [&>*]:snap-start",
        className
      )}
      style={{
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        overscrollBehaviorInline: "contain",
      }}
    >
      {children}
    </div>
  );
}
