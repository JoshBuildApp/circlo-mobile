import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipVariant = "default" | "teal" | "orange" | "danger";

interface ChipProps {
  variant?: ChipVariant;
  children: ReactNode;
  className?: string;
  leadingDot?: boolean;
}

const variantMap: Record<ChipVariant, string> = {
  default: "bg-navy-card text-offwhite",
  teal: "bg-teal-dim text-teal",
  orange: "bg-orange-dim text-orange",
  danger: "bg-[#ff4d6d1a] text-danger",
};

export function Chip({ variant = "default", children, className, leadingDot }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold leading-none",
        variantMap[variant],
        className
      )}
    >
      {leadingDot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
