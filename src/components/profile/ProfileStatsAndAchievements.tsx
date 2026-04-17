import { Star, Users, Trophy, Flame, Zap, Target } from "lucide-react";
import StatEngine, { type StatEngineItem } from "./StatEngine";
import AchievementShowcase, { type Achievement, type Rarity } from "./AchievementShowcase";

interface CoachStatsProps {
  rating?: number;
  totalSessions?: number;
  yearsExperience?: number;
  followers?: number;
  achievements?: string[];
  isPro?: boolean;
}

interface UserStatsProps {
  sessionsBooked?: number;
  trainingStreak?: number;
  xp?: number;
  level?: number;
  achievements?: string[];
  isPro?: boolean;
  /** Distinguishes user from coach data shape */
  variant: "user";
}

type Props = (CoachStatsProps & { variant?: "coach" }) | UserStatsProps;

const RARITY_CYCLE: Rarity[] = ["gold", "silver", "bronze", "gold", "elite"];

function stringsToAchievements(items: string[] = [], elite = false): Achievement[] {
  return items.slice(0, 6).map((label, i) => ({
    id: `${i}-${label.slice(0, 12)}`,
    label: label.length > 18 ? label.slice(0, 17) + "…" : label,
    rarity: elite ? "elite" : RARITY_CYCLE[i % RARITY_CYCLE.length],
    icon: i === 0 ? "trophy" : i === 1 ? "medal" : i === 2 ? "star" : "award",
  }));
}

export default function ProfileStatsAndAchievements(props: Props) {
  const isUser = "variant" in props && props.variant === "user";
  const isPro = props.isPro ?? false;

  const stats: StatEngineItem[] = isUser
    ? [
        {
          label: "Sessions",
          value: (props as UserStatsProps).sessionsBooked ?? 0,
          max: 100,
          icon: Zap,
          color: "teal",
        },
        {
          label: "Streak",
          value: (props as UserStatsProps).trainingStreak ?? 0,
          max: 30,
          suffix: "d",
          icon: Flame,
          color: "orange",
        },
        {
          label: "Level",
          value: (props as UserStatsProps).level ?? 1,
          max: 50,
          icon: Star,
          color: isPro ? "yellow" : "purple",
        },
      ]
    : [
        {
          label: "Rating",
          value: Math.round(((props as CoachStatsProps).rating ?? 0) * 20),
          max: 100,
          suffix: "",
          icon: Star,
          color: "yellow",
        },
        {
          label: "Sessions",
          value: Math.min(
            (props as CoachStatsProps).totalSessions ?? 0,
            999,
          ),
          max: 500,
          icon: Target,
          color: "teal",
        },
        {
          label: "Network",
          value: Math.min((props as CoachStatsProps).followers ?? 0, 9999),
          max: 1000,
          icon: Users,
          color: isPro ? "orange" : "cyan",
        },
      ];

  const achievementsList = stringsToAchievements(
    props.achievements ?? [],
    isPro,
  );

  // Fallback decorative achievements if user/coach has none yet
  const showFallback = achievementsList.length === 0;
  const fallbackAchievements: Achievement[] = isPro
    ? [
        { id: "elite-1", label: "Elite Member", rarity: "elite", icon: "crown" },
        { id: "elite-2", label: "Top Tier", rarity: "gold", icon: "trophy" },
        { id: "elite-3", label: "Verified Pro", rarity: "gold", icon: "medal" },
      ]
    : [
        { id: "fb-1", label: "Newcomer", rarity: "bronze", icon: "star" },
      ];

  return (
    <div className="px-5 pb-4 space-y-3">
      <StatEngine
        title={isUser ? "My Performance" : "Coach Stats"}
        stats={stats}
        elite={isPro}
      />
      <AchievementShowcase
        title={isPro ? "Elite Achievements" : "Achievements"}
        achievements={showFallback ? fallbackAchievements : achievementsList}
        layout="row"
      />
    </div>
  );
}
