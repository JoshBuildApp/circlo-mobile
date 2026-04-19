import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  ctaLabel?: string;
  onCta?: () => void;
  /** Compact (in-list) vs full-page presentation. */
  variant?: "page" | "inline";
  className?: string;
}

/**
 * Reusable empty state for v2 lists.
 * Page variant centers vertically with a bigger icon; inline variant is
 * a flat box meant to slot into a list area.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  variant = "inline",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center gap-2.5",
        variant === "page" ? "py-16 px-8" : "py-10 px-6",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-2xl bg-navy-card flex items-center justify-center text-teal mb-1",
            variant === "page" ? "w-16 h-16" : "w-12 h-12"
          )}
        >
          <Icon size={variant === "page" ? 28 : 20} />
        </div>
      )}
      <div className={cn("font-bold text-offwhite", variant === "page" ? "text-[18px]" : "text-[15px]")}>
        {title}
      </div>
      {description && (
        <div className={cn("text-v2-muted leading-relaxed max-w-[260px]", variant === "page" ? "text-[13px]" : "text-[12px]")}>
          {description}
        </div>
      )}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-3 px-4 py-2.5 rounded-[12px] bg-teal text-navy-deep font-bold text-[13px]"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
