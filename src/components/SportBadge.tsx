import { memo } from "react";
import { cn } from "@/lib/utils";

interface SportBadgeProps {
  sport: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sportColors = {
  padel: "bg-primary/100 text-primary/800 border-primary/200",
  boxing: "bg-red-100 text-red-800 border-red-200",
  yoga: "bg-purple-100 text-purple-800 border-purple-200",
  tennis: "bg-green-100 text-green-800 border-green-200",
  fitness: "bg-blue-100 text-blue-800 border-blue-200",
  swimming: "bg-cyan-100 text-cyan-800 border-cyan-200",
  running: "bg-orange-100 text-orange-800 border-orange-200",
  cycling: "bg-yellow-100 text-yellow-800 border-yellow-200",
  basketball: "bg-amber-100 text-amber-800 border-amber-200",
  football: "bg-emerald-100 text-emerald-800 border-emerald-200",
  volleyball: "bg-pink-100 text-pink-800 border-pink-200",
  martial_arts: "bg-gray-100 text-gray-800 border-gray-200",
  pilates: "bg-indigo-100 text-indigo-800 border-indigo-200",
  crossfit: "bg-slate-100 text-slate-800 border-slate-200",
} as const;

const defaultColor = "bg-gray-100 text-gray-800 border-gray-200";

export const SportBadge = memo(function SportBadge({ sport, size = "md", className }: SportBadgeProps) {
  const normalizedSport = sport.toLowerCase().replace(/\s+/g, "_") as keyof typeof sportColors;
  const colorClasses = sportColors[normalizedSport] || defaultColor;
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        colorClasses,
        sizeClasses[size],
        className
      )}
    >
      {sport}
    </span>
  );
});