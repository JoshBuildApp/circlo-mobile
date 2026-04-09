import { useState } from "react";
import {
  Plus, Trash2, Users, User, CalendarDays, Clock,
  X, Dumbbell, MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTrainingSessions, SESSION_TYPES, type TrainingSession } from "@/hooks/use-training-sessions";
import { useTrainingTemplates, type TrainingTemplate } from "@/hooks/use-training-templates";
import { formatHour } from "@/hooks/use-availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SessionManagerProps {
  coachProfileId: string;
  coachPrice: number;
}

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6;
  return { value: `${h.toString().padStart(2, "0")}:00`, label: formatHour(`${h.toString().padStart(2, "0")}:00`) };
});

const TYPE_ICONS: Record<string, React.ElementType> = {
  personal: User,
  small_group: Users,
  group: Users,
};

const SessionManager = ({ coachProfileId, coachPrice }: SessionManagerProps) => {
  const { sessions, loading, refresh } = useTrainingSessions(coachProfileId);
  const { templates, loading: templatesLoading } = useTrainingTemplates(coachProfileId);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state — template-driven
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  const activeTemplates = templates.filter((t) => t.is_active);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleCreate = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a training type");
      return;
    }
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    if (!selectedTemplate) return;

    setSaving(true);
    const { error } = await supabase.from("training_sessions").insert({
      coach_id: coachProfileId,
      title: selectedTemplate.title,
      description: selectedTemplate.description,
      session_type: selectedTemplate.training_type,
      date,
      time,
      time_label: formatHour(time),
      max_capacity: selectedTemplate.max_participants,
      price: selectedTemplate.price,
      location: selectedTemplate.location,
      template_id: selectedTemplate.id,
      status: "open",
    } as any);
    setSaving(false);
    if (error) {
      toast.error("Failed to create session");
    } else {
      toast.success("Session created!");
      resetForm();
      refresh();
    }
  };

  const handleCancel = async (session: TrainingSession) => {
    await supabase.from("training_sessions").update({ status: "cancelled" } as any).eq("id", session.id);
    toast.success("Session cancelled");
    refresh();
  };

  const handleDelete = async (session: TrainingSession) => {
    await supabase.from("training_sessions").delete().eq("id", session.id);
    toast.success("Session deleted");
    refresh();
  };

  const resetForm = () => {
    setCreating(false);
    setSelectedTemplateId("");
    setDate("");
    setTime("09:00");
  };

  // Group by date
  const grouped = sessions.reduce<Record<string, TrainingSession[]>>((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {});

  const today = new Date().toISOString().split("T")[0];
  const upcoming = Object.entries(grouped)
    .filter(([d]) => d >= today)
    .sort(([a], [b]) => a.localeCompare(b));

  const past = Object.entries(grouped)
    .filter(([d]) => d < today)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Training Sessions</h2>
            <p className="text-[11px] text-muted-foreground">Schedule sessions from your trainings</p>
          </div>
        </div>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5 rounded-xl h-9">
            <Plus className="h-3.5 w-3.5" />
            New Session
          </Button>
        )}
      </div>

      {/* Create form — template-driven */}
      {creating && (
        <div className="bg-secondary/50 rounded-2xl border border-border/50 p-5 space-y-4 animate-fade-in">
          <p className="text-sm font-heading font-semibold text-foreground">New Training Session</p>

          {/* Select Training */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Select Training *</label>
            {activeTemplates.length === 0 ? (
              <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-3 text-xs text-destructive">
                <Dumbbell className="h-3.5 w-3.5 inline mr-1" />
                No active trainings. Create one in "My Trainings" first.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {activeTemplates.map((t) => {
                  const Icon = TYPE_ICONS[t.training_type] || User;
                  const active = selectedTemplateId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98]",
                        active
                          ? "bg-primary/10 border-primary/30"
                          : "bg-background border-border/30 hover:border-border/50"
                      )}
                    >
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                        active ? "bg-primary/20" : "bg-secondary")}>
                        <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold", active ? "text-primary" : "text-foreground")}>{t.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>₪{t.price}</span>
                          <span>·</span>
                          <span>{t.max_participants} max</span>
                          {t.duration_minutes && <><span>·</span><span>{t.duration_minutes}min</span></>}
                          {t.location && <><span>·</span><span className="truncate">{t.location}</span></>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date *</label>
              <Input
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="rounded-xl bg-background border-border/50 h-11"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Time</label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected template preview */}
          {selectedTemplate && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Session Preview</p>
              <p className="text-sm font-heading font-bold text-foreground">{selectedTemplate.title}</p>
              <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-muted-foreground">
                <span>₪{selectedTemplate.price}</span>
                <span>·</span>
                <span>{selectedTemplate.max_participants} spots</span>
                <span>·</span>
                <span>{selectedTemplate.duration_minutes}min</span>
                {selectedTemplate.location && <><span>·</span><span>{selectedTemplate.location}</span></>}
              </div>
              {selectedTemplate.description && (
                <p className="text-[11px] text-muted-foreground mt-1">{selectedTemplate.description}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={resetForm} className="rounded-xl h-9">Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving || !selectedTemplateId} className="rounded-xl h-9 px-5">
              {saving ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 && !creating ? (
        <div className="text-center py-12 space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto">
            <CalendarDays className="h-7 w-7 text-primary/50" />
          </div>
          <p className="text-sm font-heading font-bold text-foreground">No sessions yet</p>
          <p className="text-xs text-muted-foreground/60">Create your first training session to start taking bookings</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">Upcoming</p>
              {upcoming.map(([dateKey, dateSessions]) => (
                <div key={dateKey} className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">
                    {new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  {dateSessions.map((s) => (
                    <SessionCard key={s.id} session={s} onCancel={handleCancel} onDelete={handleDelete} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">Past Sessions</p>
              {past.map(([dateKey, dateSessions]) => (
                <div key={dateKey} className="space-y-1.5 opacity-60">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  {dateSessions.map((s) => (
                    <SessionCard key={s.id} session={s} onCancel={handleCancel} onDelete={handleDelete} past />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* Session card */
const SessionCard = ({
  session: s, onCancel, onDelete, past,
}: {
  session: TrainingSession;
  onCancel: (s: TrainingSession) => void;
  onDelete: (s: TrainingSession) => void;
  past?: boolean;
}) => {
  const typeInfo = SESSION_TYPES.find((t) => t.value === s.session_type);
  const Icon = TYPE_ICONS[s.session_type] || User;
  const spotsLeft = s.max_capacity - s.current_bookings;
  const isFull = s.status === "full" || spotsLeft <= 0;
  const isCancelled = s.status === "cancelled";

  return (
    <div className={cn(
      "rounded-xl border p-3 transition-all",
      isCancelled ? "bg-destructive/5 border-destructive/15 opacity-60" :
      isFull ? "bg-accent/5 border-accent/20" :
      "bg-card border-border/20 hover:border-border/40"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0",
          isCancelled ? "bg-destructive/10 text-destructive" :
          isFull ? "bg-accent/15 text-accent-foreground" :
          "bg-primary/10 text-primary"
        )}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{s.title || "Untitled"}</p>
            {isCancelled && (
              <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">Cancelled</span>
            )}
            {isFull && !isCancelled && (
              <span className="text-[9px] font-bold text-accent-foreground bg-accent/20 px-1.5 py-0.5 rounded-full">Full</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" /> {s.time_label || s.time}
            </span>
            <span className="text-[10px] text-muted-foreground">{typeInfo?.label || s.session_type}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Users className="h-2.5 w-2.5" />
              {s.current_bookings}/{s.max_capacity}
              {!isFull && !isCancelled && spotsLeft <= 3 && (
                <span className="text-destructive font-bold ml-0.5">· {spotsLeft} left</span>
              )}
            </span>
            {s.price != null && <span className="text-[10px] font-bold text-primary">₪{s.price}</span>}
          </div>
        </div>

        {!past && !isCancelled && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => onCancel(s)}
              className="h-7 w-7 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-destructive active:scale-90 transition-all"
              title="Cancel session">
              <X className="h-3 w-3" />
            </button>
            <button onClick={() => onDelete(s)}
              className="h-7 w-7 rounded-lg bg-destructive/8 flex items-center justify-center text-destructive/60 hover:text-destructive active:scale-90 transition-all"
              title="Delete session">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager;
