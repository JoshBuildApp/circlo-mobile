import { useMemo } from "react";
import { Trophy, Flame, Zap, TrendingUp, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTraineeProgress } from "@/hooks/use-trainee-progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
const LEVEL_NAMES = ["Rookie", "Starter", "Amateur", "Regular", "Dedicated", "Athlete", "Pro", "Elite", "Champion", "Legend"];

function getLevelInfo(xp: number) {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
  }
  const currentThreshold = LEVEL_THRESHOLDS[level];
  const nextThreshold = LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)];
  const progress = nextThreshold > currentThreshold
    ? ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;
  return { level: level + 1, name: LEVEL_NAMES[level], progress: Math.min(progress, 100), nextXp: nextThreshold - xp };
}

// GitHub-style heatmap for last 12 weeks
function ActivityHeatmap({ sessions }: { sessions: { date: string }[] }) {
  const weeks = useMemo(() => {
    const today = new Date();
    const days: { date: string; count: number }[] = [];
    const sessionDates = new Set(sessions.map((s) => s.date.split("T")[0]));

    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({ date: dateStr, count: sessionDates.has(dateStr) ? 1 : 0 });
    }

    // Group into weeks
    const result: { date: string; count: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [sessions]);

  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day, di) => (
            <div
              key={di}
              title={day.date}
              className={cn(
                "w-3 h-3 rounded-sm transition-colors",
                day.count > 0 ? "bg-primary" : "bg-muted/30"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface Props {
  userId?: string;
}

const TraineeProgressDashboard = ({ userId }: Props) => {
  const { progress, badges, allBadges, loading } = useTraineeProgress(userId);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-muted/20" />)}
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No progress data yet. Start training!</p>
      </div>
    );
  }

  const levelInfo = getLevelInfo(progress.xp || 0);
  const earnedBadgeIds = new Set(badges.map((ub) => ub.id));

  return (
    <div className="space-y-6">
      {/* Level + XP Card */}
      <div className="rounded-2xl bg-card border border-border/30 p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center">
            <span className="text-2xl font-black text-white">{levelInfo.level}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-foreground">{levelInfo.name}</h3>
              <span className="text-xs text-muted-foreground">{progress.xp || 0} XP</span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{levelInfo.nextXp} XP to next level</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, label: "Streak", value: `${progress.streak_days || 0}d`, color: "text-orange-400" },
            { icon: Zap, label: "Sessions", value: progress.total_sessions || 0, color: "text-yellow-400" },
            { icon: TrendingUp, label: "This Week", value: progress.xp || 0, color: "text-green-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl bg-muted/10 p-3 text-center">
              <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
              <p className="text-sm font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="rounded-2xl bg-card border border-border/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Training Activity</h3>
          <span className="ml-auto text-xs text-muted-foreground">Last 12 weeks</span>
        </div>
        <ActivityHeatmap sessions={[]} />
        <div className="flex items-center gap-1 mt-2 justify-end">
          <span className="text-[10px] text-muted-foreground">Less</span>
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Badges</h3>
            <span className="ml-auto text-xs text-muted-foreground">{earnedBadgeIds.size}/{allBadges.length} earned</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  title={badge.name}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all",
                    earned ? "bg-primary/10 border border-primary/20" : "bg-muted/10 opacity-40"
                  )}
                >
                  <span className="text-2xl">{badge.icon || "🏅"}</span>
                  <span className="text-[9px] text-muted-foreground leading-tight line-clamp-2">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineeProgressDashboard;
