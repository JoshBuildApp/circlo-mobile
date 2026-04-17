import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Dumbbell, Calendar, Target, ChevronDown,
  RefreshCw, Moon, Flame, Zap, Clock, Star, CheckCircle2,
  ChevronRight, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrainingPlan, type GeneratePlanInput, type TrainingDay, type CoachRecommendation } from "@/hooks/use-training-plan";
import { Skeleton } from "@/components/ui/skeleton";

const SPORTS = [
  "Padel", "Tennis", "Fitness", "Boxing", "Soccer", "Basketball",
  "Yoga", "Swimming", "Running", "MMA", "CrossFit", "Martial Arts",
];

const GOALS = [
  "Build Strength", "Improve Endurance", "Lose Weight", "Learn Technique",
  "Compete at Higher Level", "Stay Active & Healthy", "Recover from Injury", "Build Muscle",
];

const FITNESS_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "New to training or returning after a long break" },
  { value: "intermediate", label: "Intermediate", desc: "Training regularly for 6+ months" },
  { value: "advanced", label: "Advanced", desc: "Competing or training 4+ days/week" },
] as const;

const INTENSITY_COLOR: Record<string, string> = {
  low: "text-emerald-500",
  medium: "text-amber-500",
  high: "text-red-500",
};

const INTENSITY_BG: Record<string, string> = {
  low: "bg-emerald-500/10",
  medium: "bg-amber-500/10",
  high: "bg-red-500/10",
};

const DAY_COLORS: Record<string, string> = {
  "Rest & Recovery": "bg-blue-500/10 text-blue-500",
  Strength: "bg-red-500/10 text-red-500",
  Cardio: "bg-orange-500/10 text-orange-500",
  Technique: "bg-purple-500/10 text-purple-500",
  Endurance: "bg-amber-500/10 text-amber-500",
  Speed: "bg-yellow-500/10 text-yellow-500",
  Recovery: "bg-teal-500/10 text-teal-500",
};

function DayCard({ day, isExpanded, onToggle }: { day: TrainingDay; isExpanded: boolean; onToggle: () => void }) {
  const focusColor = DAY_COLORS[day.focus] ?? "bg-primary/10 text-primary";

  if (day.isRest) {
    return (
      <div className="rounded-2xl border border-border/10 bg-card p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Moon className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">{day.day}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Rest</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{day.coachTip}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/10 bg-card overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", focusColor.split(" ")[0])}>
            <Flame className={cn("h-5 w-5", focusColor.split(" ")[1])} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{day.day}</span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", focusColor)}>
                {day.focus}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground">{day.duration_minutes} min</span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[11px] text-muted-foreground">{day.exercises.length} exercises</span>
            </div>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground/50 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/5 pt-3">
          {day.exercises.map((ex, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", INTENSITY_BG[ex.intensity])}>
                <Zap className={cn("h-3 w-3", INTENSITY_COLOR[ex.intensity])} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{ex.name}</span>
                  {(ex.sets || ex.reps) && (
                    <span className="text-[10px] text-muted-foreground/60">
                      {ex.sets && `${ex.sets} sets`}{ex.sets && ex.reps && " × "}{ex.reps}
                    </span>
                  )}
                  {ex.duration_minutes && !ex.sets && (
                    <span className="text-[10px] text-muted-foreground/60">{ex.duration_minutes} min</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-0.5">{ex.description}</p>
              </div>
            </div>
          ))}
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-2.5 flex items-start gap-2 mt-2">
            <Brain className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-primary/80 leading-relaxed">{day.coachTip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CoachCard({ coach }: { coach: CoachRecommendation }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/coach/${coach.id}`)}
      className="rounded-xl border border-border/10 bg-card p-3 flex items-center gap-3 text-left w-full hover:bg-secondary/50 transition-colors active:scale-[0.98]"
    >
      <div className="h-10 w-10 rounded-xl bg-primary/10 overflow-hidden flex-shrink-0">
        {coach.image_url ? (
          <img src={coach.image_url} alt={coach.coach_name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{coach.coach_name[0]}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{coach.coach_name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
          <span className="text-[10px] text-muted-foreground">{coach.rating.toFixed(1)}</span>
          {coach.price && <span className="text-[10px] text-muted-foreground/60">· ₪{coach.price}/session</span>}
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{coach.reason}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
    </button>
  );
}

const TrainingPlan = () => {
  const navigate = useNavigate();
  const { plan, loading, error, source, generate, reset } = useTrainingPlan();

  const [sport, setSport] = useState("");
  const [goal, setGoal] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(4);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!sport || !goal) return;
    const input: GeneratePlanInput = { sport, goal, fitnessLevel, sessionsPerWeek };
    generate(input);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-foreground text-center">Generating your personalized plan…</p>
            <p className="text-xs text-muted-foreground text-center">Analyzing your history and goals</p>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (plan) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-5 pb-3">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <button onClick={reset} className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-base font-bold text-foreground">Your Training Plan</h1>
              <p className="text-[11px] text-muted-foreground">{plan.sport} · {plan.fitnessLevel}</p>
            </div>
            <button
              onClick={handleGenerate}
              className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center"
              title="Regenerate"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* AI Badge */}
          {source === "ai" && (
            <div className="flex items-center gap-1.5 mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-2.5 w-2.5" />
                AI Generated
              </span>
            </div>
          )}

          {/* Summary Card */}
          <div className="rounded-2xl border border-border/10 bg-card p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{plan.goal}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{plan.summary}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Sport", value: plan.sport, icon: Dumbbell },
                { label: "Sessions", value: `${plan.weeklyDays.filter(d => !d.isRest).length}/week`, icon: Calendar },
                { label: "Level", value: plan.fitnessLevel, icon: CheckCircle2 },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-secondary/50 p-2.5 text-center">
                  <stat.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-foreground capitalize">{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Plan */}
          <div className="mb-1">
            <p className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Weekly Schedule
            </p>
            <div className="space-y-2">
              {plan.weeklyDays.map((day) => (
                <DayCard
                  key={day.day}
                  day={day}
                  isExpanded={expandedDay === day.day}
                  onToggle={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                />
              ))}
            </div>
          </div>

          {/* Coach Recommendations */}
          {plan.coachRecommendations.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-primary" />
                Recommended Coaches
              </p>
              <div className="space-y-2">
                {plan.coachRecommendations.map((coach) => (
                  <CoachCard key={coach.id} coach={coach} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-5 pb-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">Training Plan</h1>
            <p className="text-[11px] text-muted-foreground">AI-personalized for your goals</p>
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10 p-5 mb-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">AI Training Plan Generator</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Get a personalized weekly training plan based on your sport, goals, and past sessions.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 mb-4">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Sport Selection */}
        <div className="mb-5">
          <label className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-2 block flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5 text-primary" />
            Sport
          </label>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  sport === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border/20 hover:bg-secondary/70"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Goal Selection */}
        <div className="mb-5">
          <label className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-2 block flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            Goal
          </label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  goal === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border/20 hover:bg-secondary/70"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Fitness Level */}
        <div className="mb-5">
          <label className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-2 block flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-primary" />
            Fitness Level
          </label>
          <div className="space-y-2">
            {FITNESS_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setFitnessLevel(level.value)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-all",
                  fitnessLevel === level.value
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary border-border/20 hover:bg-secondary/70"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    fitnessLevel === level.value ? "border-primary" : "border-muted-foreground/30"
                  )}>
                    {fitnessLevel === level.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{level.label}</p>
                    <p className="text-[10px] text-muted-foreground">{level.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Per Week */}
        <div className="mb-6">
          <label className="text-[11px] font-bold text-foreground uppercase tracking-wide mb-2 block flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Sessions per week: <span className="text-primary">{sessionsPerWeek}</span>
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setSessionsPerWeek(n)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all",
                  sessionsPerWeek === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border/20 hover:bg-secondary/70"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!sport || !goal}
          className={cn(
            "w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
            sport && goal
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Generate My Plan
        </button>

        {(!sport || !goal) && (
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Select a sport and goal to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default TrainingPlan;
