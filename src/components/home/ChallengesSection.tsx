import { Trophy, Users } from "lucide-react";
import { useChallenges } from "@/hooks/use-challenges";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import SectionHeader from "./SectionHeader";
import { toast } from "sonner";

const ChallengesSection = () => {
  const { challenges, joinChallenge, updateProgress } = useChallenges();
  const { user } = useAuth();

  if (challenges.length === 0) return null;

  const handleJoin = async (challengeId: string) => {
    if (!user) {
      toast.error("Log in to join challenges");
      return;
    }
    const result = await joinChallenge(challengeId);
    if (result.success) toast.success("You joined the challenge!");
    else toast.error(result.error || "Failed to join");
  };

  return (
    <div className="px-4">
      <SectionHeader
        title="Active Challenges"
        icon={<Trophy className="h-4 w-4 text-foreground" />}
      />
      <div className="space-y-3">
        {challenges.slice(0, 3).map((ch) => {
          const progressPct = ch.duration_days > 0 ? Math.min(100, (ch.user_progress / ch.duration_days) * 100) : 0;
          return (
            <div key={ch.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate">{ch.title}</h4>
                  <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{ch.description}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-3">
                  <Users className="h-3.5 w-3.5" />
                  <span>{ch.participants_count}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{ch.duration_days} days</span>
                <span>·</span>
                <span>{ch.participants_count} joined</span>
              </div>

              {ch.user_joined ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Day {ch.user_progress} / {ch.duration_days}</span>
                    <span className="text-foreground font-semibold">{Math.round(progressPct)}%</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                    {ch.user_progress < ch.duration_days && (
                     <button
                       onClick={() => updateProgress(ch.id, ch.user_progress + 1)}
                       className="w-full h-12 rounded-xl bg-secondary text-foreground text-[13px] font-semibold active:scale-[0.97] transition-all touch-target"
                     >
                      Complete Day {ch.user_progress + 1}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleJoin(ch.id)}
                  className="w-full h-12 rounded-xl bg-foreground text-background text-[13px] font-semibold active:scale-[0.97] transition-all touch-target"
                >
                  Join Challenge
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChallengesSection;
