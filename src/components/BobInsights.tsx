import { useState } from "react";
import { CalendarDays, DollarSign, Users, Sparkles, RefreshCw, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Recommendation {
  title: string;
  description: string;
  type: "schedule" | "revenue" | "engagement";
}

interface CoachData {
  totalSessions: number;
  totalRevenue: number;
  avgPerDay: number;
  mostActiveDay: string;
  mostActiveWeek: string;
  followerCount: number;
  uniqueClients: number;
  videoCount: number;
  totalViews: number;
  totalLikes: number;
  completionRate: number;
  bookingsByDay: Record<string, number>;
  period: string;
}

interface BobInsightsProps {
  coachData: CoachData;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  schedule: { icon: CalendarDays, color: "text-primary", bg: "bg-primary/10" },
  revenue: { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  engagement: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
};

const BobInsights = ({ coachData }: BobInsightsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    const maxRetries = 3;
    let delay = 2000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("bob-insights", {
          body: { coachData },
        });
        if (fnError) throw fnError;
        if (data?.error) {
          if (data.error.includes("Rate limited") && attempt < maxRetries) {
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
            continue;
          }
          throw new Error(data.error);
        }
        setRecommendations(data.recommendations || []);
        setLoaded(true);
        setLoading(false);
        return;
      } catch (e: any) {
        if (attempt < maxRetries && e?.message?.includes("non-2xx")) {
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          continue;
        }
        console.error("Bob error:", e);
        setError("Couldn't generate recommendations right now. Try again in a moment.");
        break;
      }
    }
    setLoading(false);
  };

  if (!loaded && !loading) {
    return (
      <button
        onClick={fetchRecommendations}
        className="w-full rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/0 p-4 flex items-center gap-3 transition-all hover:border-primary/30 active:scale-[0.98]"
      >
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-heading font-bold text-foreground">Ask Bob</p>
          <p className="text-[10px] text-muted-foreground/60">Get AI-powered recommendations to grow your coaching</p>
        </div>
        <Sparkles className="h-4 w-4 text-primary/40" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Bob suggests</h3>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground/50", loading && "animate-spin")} />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl border border-destructive/15 bg-destructive/5 p-3">
          <p className="text-xs text-destructive/80">{error}</p>
        </div>
      )}

      {/* Recommendations */}
      {!loading && !error && recommendations.map((rec, i) => {
        const meta = TYPE_META[rec.type] || TYPE_META.schedule;
        const Icon = meta.icon;
        return (
          <div
            key={i}
            className="rounded-2xl border border-border/10 bg-card p-3 flex items-start gap-3 animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", meta.bg)}>
              <Icon className={cn("h-4 w-4", meta.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{rec.title}</p>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-0.5">{rec.description}</p>
            </div>
            <span className="text-[9px] font-heading font-bold text-muted-foreground/30 uppercase flex-shrink-0">
              #{i + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BobInsights;
