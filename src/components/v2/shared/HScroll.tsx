import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HScrollProps {
  children: ReactNode;
  className?: string;
  snap?: boolean;
}

/**
 * Horizontal scroll container tuned for touch. Hides scrollbars and
 * disables vertical pan so the outer page scroll wins on vertical gestures.
 */
export function HScroll({ children, className, snap }: HScrollProps) {
  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto overflow-y-hidden px-5 scrollbar-none",
        snap && "snap-x snap-mandatory [&>*]:snap-start",
        className
      )}
      style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
    >
      {children}
    </div>
  );
}
