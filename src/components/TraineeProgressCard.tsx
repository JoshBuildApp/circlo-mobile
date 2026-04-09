import { Trophy, Flame, Star, ChevronRight, Zap } from "lucide-react";
import { useTraineeProgress } from "@/hooks/use-trainee-progress";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TraineeProgressCard = ({ userId }: { userId?: string }) => {
  const { progress, badges, allBadges, loading, xpProgress, xpInCurrentLevel } = useTraineeProgress(userId);
  const [showAllBadges, setShowAllBadges] = useState(false);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-border/10 bg-card p-5 animate-pulse">
        <div className="h-20 bg-secondary/50 rounded-2xl" />
      </div>
    );
  }

  const earnedIds = new Set(badges.map((b) => b.id));

  return (
    <>
      {/* Level & XP Card */}
      <div className="rounded-[28px] border border-border/10 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-sm font-bold text-foreground">Progression</h2>
        </div>

        {/* Level display */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand-sm flex-shrink-0">
            <span className="text-2xl font-bold text-primary-foreground">{progress.level}</span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-primary-foreground bg-primary/80 px-2 py-0.5 rounded-full whitespace-nowrap">
              LEVEL
            </span>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {xpInCurrentLevel} / 500 XP
              </span>
              <span className="text-[10px] text-muted-foreground">
                Level {progress.level + 1}
              </span>
            </div>
            <Progress value={xpProgress} className="h-2.5 bg-secondary" />
            <p className="text-[10px] text-muted-foreground">
              {progress.xp} total XP · {progress.total_sessions} sessions
            </p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
            progress.streak_days > 0 ? "bg-orange-500/10" : "bg-secondary"
          )}>
            <Flame className={cn(
              "h-5 w-5",
              progress.streak_days > 0 ? "text-orange-500" : "text-muted-foreground/30"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              {progress.streak_days > 0 ? `${progress.streak_days} day streak 🔥` : "No active streak"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {progress.streak_days > 0
                ? "Keep training daily to maintain your streak!"
                : "Complete a training to start your streak"}
            </p>
          </div>
        </div>

        {/* Badges preview */}
        {badges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Badges ({badges.length}/{allBadges.length})
                </span>
              </div>
              <button
                onClick={() => setShowAllBadges(true)}
                className="text-[10px] font-semibold text-primary flex items-center gap-0.5"
              >
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {badges.slice(0, 6).map((b) => (
                <div
                  key={b.id}
                  className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-xl"
                  title={b.name}
                >
                  {b.icon}
                </div>
              ))}
              {badges.length > 6 && (
                <button
                  onClick={() => setShowAllBadges(true)}
                  className="flex-shrink-0 h-12 w-12 rounded-xl bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground"
                >
                  +{badges.length - 6}
                </button>
              )}
            </div>
          </div>
        )}

        {badges.length === 0 && (
          <div className="rounded-2xl bg-secondary/40 p-4 text-center space-y-1">
            <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-medium text-foreground">No badges yet</p>
            <p className="text-[10px] text-muted-foreground">
              Complete trainings to earn your first badge!
            </p>
          </div>
        )}
      </div>

      {/* All Badges Dialog */}
      <Dialog open={showAllBadges} onOpenChange={setShowAllBadges}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              All Badges
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {allBadges.map((b) => {
              const earned = earnedIds.has(b.id);
              return (
                <div
                  key={b.id}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all",
                    earned
                      ? "bg-primary/5 border-primary/20"
                      : "bg-secondary/30 border-border/10 opacity-40"
                  )}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <p className="text-[10px] font-bold text-foreground leading-tight">{b.name}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">{b.description}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TraineeProgressCard;
