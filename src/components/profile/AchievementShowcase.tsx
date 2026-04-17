import { motion } from "framer-motion";
import { Trophy, Star, Crown, Flame, Award, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export type Rarity = "bronze" | "silver" | "gold" | "elite";

export interface Achievement {
  id: string;
  label: string;
  description?: string;
  rarity: Rarity;
  /** Icon name or default to trophy */
  icon?: "trophy" | "star" | "crown" | "flame" | "award" | "medal";
}

interface AchievementShowcaseProps {
  title?: string;
  achievements: Achievement[];
  /** Compact = single row, default. Grid = wrap into 3-col */
  layout?: "row" | "grid";
}

const rarityStyles: Record<
  Rarity,
  { ring: string; glow: string; iconBg: string; iconColor: string; label: string }
> = {
  bronze: {
    ring: "border-amber-700/60",
    glow: "rgba(180, 83, 9, 0.5)",
    iconBg: "bg-gradient-to-br from-amber-700 to-amber-900",
    iconColor: "text-amber-200",
    label: "text-amber-400",
  },
  silver: {
    ring: "border-slate-300/60",
    glow: "rgba(203, 213, 225, 0.5)",
    iconBg: "bg-gradient-to-br from-slate-300 to-slate-500",
    iconColor: "text-slate-100",
    label: "text-slate-300",
  },
  gold: {
    ring: "border-yellow-400/70",
    glow: "rgba(250, 204, 21, 0.5)",
    iconBg: "bg-gradient-to-br from-yellow-400 to-orange-500",
    iconColor: "text-navy-deep",
    label: "text-yellow-300",
  },
  elite: {
    ring: "border-purple-400/70",
    glow: "rgba(168, 85, 247, 0.5)",
    iconBg: "bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-300",
    iconColor: "text-navy-deep",
    label: "text-purple-300",
  },
};

const iconMap = {
  trophy: Trophy,
  star: Star,
  crown: Crown,
  flame: Flame,
  award: Award,
  medal: Medal,
};

function AchievementBadge({ a, idx }: { a: Achievement; idx: number }) {
  const style = rarityStyles[a.rarity];
  const Icon = iconMap[a.icon || "trophy"];

  return (
    <motion.div
      className="relative flex flex-col items-center gap-2 group"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative">
        {/* Glow */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full blur-lg opacity-60 group-hover:opacity-90 transition-opacity"
          style={{ background: style.glow }}
        />
        {/* Outer ring */}
        <div
          className={cn(
            "relative w-16 h-16 rounded-full border-2 flex items-center justify-center",
            style.ring,
          )}
        >
          {/* Inner medallion */}
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
              style.iconBg,
            )}
          >
            <Icon className={cn("w-6 h-6", style.iconColor)} fill="currentColor" />
          </div>
        </div>
      </div>
      <p className={cn("text-[11px] font-semibold uppercase tracking-wider text-center max-w-[90px]", style.label)}>
        {a.label}
      </p>
    </motion.div>
  );
}

export default function AchievementShowcase({
  title = "Achievements",
  achievements,
  layout = "row",
}: AchievementShowcaseProps) {
  if (achievements.length === 0) return null;

  return (
    <div className="rounded-2xl p-5 border border-border bg-muted/30 backdrop-blur-md">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {achievements.length} unlocked
        </span>
      </div>
      <div
        className={cn(
          layout === "row"
            ? "flex items-start gap-4 overflow-x-auto pb-2 scrollbar-none"
            : "grid grid-cols-3 gap-4",
        )}
      >
        {achievements.map((a, i) => (
          <AchievementBadge key={a.id} a={a} idx={i} />
        ))}
      </div>
    </div>
  );
}
