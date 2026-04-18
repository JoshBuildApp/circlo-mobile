import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Kpi {
  label: string;
  value: ReactNode;
  accent?: "default" | "teal" | "orange";
}

interface KpiStripProps {
  items: Kpi[];
  className?: string;
}

/**
 * Horizontal stats strip with hairline vertical dividers.
 * Replaces a 2x2 stat grid with quieter hierarchy.
 */
export function KpiStrip({ items, className }: KpiStripProps) {
  return (
    <div className={cn("grid rounded-[16px] bg-navy-card overflow-hidden", className)} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((k, i) => (
        <div
          key={i}
          className={cn(
            "py-3.5 px-2.5 text-center",
            i < items.length - 1 && "border-r border-navy-line"
          )}
        >
          <div
            className={cn(
              "text-[20px] font-extrabold tracking-tight tnum",
              k.accent === "teal" && "text-teal",
              k.accent === "orange" && "text-orange"
            )}
          >
            {k.value}
          </div>
          <div className="text-[10px] text-v2-muted font-semibold uppercase tracking-wider mt-1">{k.label}</div>
        </div>
      ))}
    </div>
  );
}
