import { useState, useEffect } from "react";
import { ChevronUp, Plus, Send, Clock, CalendarDays, MessageSquare, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AMASession {
  id: string;
  coach_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "upcoming" | "live" | "ended";
  created_at: string;
}

interface AMAQuestion {
  id: string;
  ama_id: string;
  user_id: string;
  question: string;
  votes: number;
  created_at: string;
}

interface CoachAMAProps {
  coachId: string;
  isCoach?: boolean;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-IL", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusBadge = ({ status }: { status: AMASession["status"] }) => {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wide">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
        Live
      </span>
    );
  }
  if (status === "ended") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
        Ended
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-semibold uppercase tracking-wide">
      Upcoming
    </span>
  );
};

const CoachAMA = ({ coachId, isCoach = false }: CoachAMAProps) => {
  const { user } = useAuth();
  const [amas, setAmas] = useState<AMASession[]>([]);
  const [questions, setQuestions] = useState<Record<string, AMAQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedAma, setExpandedAma] = useState<string | null>(null);
  const [questionInput, setQuestionInput] = useState<Record<string, string>>({});
  const [submittingQ, setSubmittingQ] = useState<string | null>(null);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  // Schedule new AMA (coach only)
  const [showSchedule, setShowSchedule] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState(60);
  const [scheduling, setScheduling] = useState(false);

  const fetchAMAs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coach_amas" as any)
      .select("*")
      .eq("coach_id", coachId)
      .order("scheduled_at", { ascending: true });
    if (!error && data) {
      setAmas(data as unknown as AMASession[]);
    }
    setLoading(false);
  };

  const fetchQuestions = async (amaId: string) => {
    const { data, error } = await supabase
      .from("ama_questions" as any)
      .select("*")
      .eq("ama_id", amaId)
      .order("votes", { ascending: false });
    if (!error && data) {
      setQuestions((prev) => ({ ...prev, [amaId]: data as unknown as AMAQuestion[] }));
    }
  };

  useEffect(() => {
    fetchAMAs();
  }, [coachId]);

  const handleExpand = (amaId: string) => {
    if (expandedAma === amaId) {
      setExpandedAma(null);
    } else {
      setExpandedAma(amaId);
      fetchQuestions(amaId);
    }
  };

  const handleSubmitQuestion = async (amaId: string) => {
    if (!user) { toast.error("Sign in to ask a question"); return; }
    const q = (questionInput[amaId] || "").trim();
    if (!q) return;
    setSubmittingQ(amaId);
    const { error } = await supabase.from("ama_questions" as any).insert({
      ama_id: amaId,
      user_id: user.id,
      question: q,
      votes: 0,
    });
    setSubmittingQ(null);
    if (error) {
      toast.error("Failed to submit question");
    } else {
      toast.success("Question submitted!");
      setQuestionInput((prev) => ({ ...prev, [amaId]: "" }));
      fetchQuestions(amaId);
    }
  };

  const handleUpvote = async (question: AMAQuestion) => {
    if (upvotedIds.has(question.id)) return;
    setUpvotedIds((prev) => new Set(prev).add(question.id));
    // Optimistic update
    setQuestions((prev) => ({
      ...prev,
      [question.ama_id]: (prev[question.ama_id] || []).map((q) =>
        q.id === question.id ? { ...q, votes: q.votes + 1 } : q
      ).sort((a, b) => b.votes - a.votes),
    }));
    await supabase
      .from("ama_questions" as any)
      .update({ votes: question.votes + 1 })
      .eq("id", question.id);
  };

  const handleSchedule = async () => {
    if (!newTitle.trim() || !newDate || !newTime) {
      toast.error("Please fill in all fields");
      return;
    }
    setScheduling(true);
    const scheduled_at = new Date(`${newDate}T${newTime}`).toISOString();
    const { error } = await supabase.from("coach_amas" as any).insert({
      coach_id: coachId,
      title: newTitle.trim(),
      scheduled_at,
      duration_minutes: newDuration,
      status: "upcoming",
    });
    setScheduling(false);
    if (error) {
      toast.error("Failed to schedule AMA");
    } else {
      toast.success("AMA scheduled!");
      setShowSchedule(false);
      setNewTitle("");
      setNewDate("");
      setNewTime("");
      setNewDuration(60);
      fetchAMAs();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))" }}
          >
            <Mic className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">AMA Sessions</h2>
            <p className="text-[11px] text-muted-foreground">Ask Me Anything</p>
          </div>
        </div>
        {isCoach && (
          <button
            onClick={() => setShowSchedule((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))" }}
          >
            <Plus className="h-3.5 w-3.5" />
            Schedule AMA
          </button>
        )}
      </div>

      {/* Schedule form (coach only) */}
      {isCoach && showSchedule && (
        <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">New AMA Session</p>
          <input
            type="text"
            placeholder="Topic / Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400/30"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-11 px-4 rounded-xl border border-border bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400/30"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="h-11 px-4 rounded-xl border border-border bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400/30"
            />
          </div>
          <div className="flex gap-2">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setNewDuration(d)}
                className={cn(
                  "flex-1 h-10 rounded-xl text-xs font-semibold border transition-all",
                  newDuration === d
                    ? "text-white border-transparent"
                    : "border-border bg-secondary text-muted-foreground"
                )}
                style={newDuration === d ? { background: "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))" } : {}}
              >
                {d} min
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSchedule(false)}
              className="flex-1 h-11 rounded-xl bg-secondary text-sm font-semibold text-muted-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={scheduling}
              className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))" }}
            >
              {scheduling ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </div>
      )}

      {/* AMA list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : amas.length === 0 ? (
        <div className="rounded-2xl border border-border/30 bg-card p-8 text-center">
          <Mic className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No AMA sessions yet</p>
          {isCoach && (
            <p className="text-xs text-muted-foreground mt-1">Schedule your first AMA above</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {amas.map((ama) => (
            <div
              key={ama.id}
              className="rounded-2xl border border-border/40 bg-card overflow-hidden"
            >
              {/* AMA header */}
              <button
                onClick={() => handleExpand(ama.id)}
                className="w-full flex items-start justify-between p-4 text-left gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusBadge status={ama.status} />
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ama.duration_minutes} min
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">{ama.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 flex-shrink-0" />
                    {formatDate(ama.scheduled_at)}
                  </p>
                </div>
                <ChevronUp
                  className={cn(
                    "h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform",
                    expandedAma === ama.id ? "rotate-0" : "rotate-180"
                  )}
                />
              </button>

              {/* Questions panel */}
              {expandedAma === ama.id && (
                <div className="border-t border-border/30 px-4 pt-3 pb-4 space-y-3">
                  {/* Questions list */}
                  {(questions[ama.id] || []).length === 0 ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      No questions yet — be the first!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(questions[ama.id] || []).map((q) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-3 rounded-xl bg-secondary/40 px-3 py-3"
                        >
                          <button
                            onClick={() => handleUpvote(q)}
                            disabled={upvotedIds.has(q.id)}
                            className={cn(
                              "flex flex-col items-center gap-0.5 flex-shrink-0 transition-all active:scale-90",
                              upvotedIds.has(q.id) ? "opacity-60" : "hover:scale-110"
                            )}
                          >
                            <ChevronUp
                              className={cn(
                                "h-4 w-4",
                                upvotedIds.has(q.id) ? "text-orange-400" : "text-muted-foreground"
                              )}
                            />
                            <span
                              className={cn(
                                "text-[10px] font-bold leading-none",
                                upvotedIds.has(q.id) ? "text-orange-400" : "text-muted-foreground"
                              )}
                            >
                              {q.votes}
                            </span>
                          </button>
                          <p className="text-sm text-foreground flex-1">{q.question}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit question */}
                  {ama.status !== "ended" && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask a question..."
                        value={questionInput[ama.id] || ""}
                        onChange={(e) =>
                          setQuestionInput((prev) => ({ ...prev, [ama.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSubmitQuestion(ama.id);
                        }}
                        className="flex-1 h-10 px-3 rounded-xl border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400/30"
                      />
                      <button
                        onClick={() => handleSubmitQuestion(ama.id)}
                        disabled={submittingQ === ama.id || !(questionInput[ama.id] || "").trim()}
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white disabled:opacity-50 flex-shrink-0 active:scale-95 transition-all"
                        style={{ background: "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))" }}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachAMA;
