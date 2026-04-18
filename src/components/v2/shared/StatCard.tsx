import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "default" | "teal" | "orange";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: Accent;
  className?: string;
  align?: "left" | "center";
}

const accentMap: Record<Accent, string> = {
  default: "text-offwhite",
  teal: "text-teal",
  orange: "text-orange",
};

export function StatCard({ label, value, sub, accent = "default", className, align = "left" }: StatCardProps) {
  return (
    <div
      className={cn(
        "p-3.5 rounded-[14px] bg-navy-card",
        align === "center" && "text-center",
        className
      )}
    >
      <div className="text-[10px] font-bold tracking-wider uppercase text-v2-muted mb-1.5">{label}</div>
      <div className={cn("text-[22px] font-extrabold tracking-tight tnum leading-none", accentMap[accent])}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-v2-muted mt-1">{sub}</div>}
    </div>
  );
}
