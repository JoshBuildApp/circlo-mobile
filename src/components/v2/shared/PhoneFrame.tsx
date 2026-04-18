import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * Dark v2 page shell. Max 430px wide, respects Capacitor safe areas.
 * Mobile-first — on tablet/desktop it remains centered in a 430px column.
 */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className={cn("v2-root font-v2 mx-auto w-full max-w-[430px] flex flex-col", className)}>
      {children}
    </div>
  );
}
