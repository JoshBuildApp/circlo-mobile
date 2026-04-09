import { Users, User, Calendar, Clock, MapPin } from "lucide-react";
import { usePublicSessions, type TrainingSession } from "@/hooks/use-training-sessions";
import { cn } from "@/lib/utils";

interface OpenTrainingsProps {
  coachProfileId?: string;
  onJoin: (session: TrainingSession) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  personal: User,
  small_group: Users,
  group: Users,
};

const OpenTrainings = ({ coachProfileId, onJoin }: OpenTrainingsProps) => {
  const { sessions, loading } = usePublicSessions();

  // Filter to this coach if provided
  const filtered = coachProfileId
    ? sessions.filter((s) => s.coach_id === coachProfileId)
    : sessions;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold text-foreground">Open Trainings</h3>
          <p className="text-[10px] text-muted-foreground">Join a group session</p>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((session) => {
          const Icon = TYPE_ICONS[session.session_type] || Users;
          const spotsLeft = session.max_capacity - session.current_bookings;
          const isFull = session.status === "full" || spotsLeft <= 0;

          return (
            <button
              key={session.id}
              disabled={isFull}
              onClick={() => onJoin(session)}
              className={cn(
                "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left",
                isFull
                  ? "bg-secondary/30 border-border/10 opacity-50 cursor-not-allowed"
                  : "bg-card border-border/20 hover:border-primary/20 active:scale-[0.98]"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                isFull ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"
              )}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{session.title || "Open Training"}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(session.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {session.time_label || session.time}
                  </span>
                  {(session as any).location && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" />
                      {(session as any).location}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {session.price != null && (
                  <p className="text-xs font-bold text-primary">₪{session.price}</p>
                )}
                {isFull ? (
                  <p className="text-[9px] font-bold text-destructive">Full</p>
                ) : (
                  <p className="text-[9px] text-muted-foreground">
                    {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OpenTrainings;
