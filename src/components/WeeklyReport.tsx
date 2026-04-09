import { useState } from "react";
import {
  FileText, TrendingUp, TrendingDown, CalendarDays, DollarSign,
  Users, Sparkles, RefreshCw, ChevronDown, ChevronUp, Lightbulb,
  CheckCircle2, Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface Recommendation {
  title: string;
  description: string;
  type: "schedule" | "revenue" | "engagement";
}

interface ReportData {
  summary: string;
  highlights: string[];
  recommendations: Recommendation[];
  metrics: {
    sessions: number;
    revenue: number;
    clients: number;
    growth: number;
    revenueGrowth: number;
  };
}

interface WeeklyReportProps {
  coachProfileId: string;
  isPro: boolean;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  schedule: CalendarDays,
  revenue: DollarSign,
  engagement: Users,
};

const WeeklyReport = ({ coachProfileId, isPro }: WeeklyReportProps) => {
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!isPro) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("weekly-report", {
        body: { coachProfileId },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setReport(data.report || null);
    } catch (e: any) {
      console.error("Weekly report error:", e);
      setError("Couldn't generate report right now.");
    } finally {
      setLoading(false);
    }
  };

  // Non-Pro gate
  if (!isPro) {
    return (
      <button
        onClick={() => navigate("/pro")}
        className="w-full rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/0 p-4 flex items-center gap-3 transition-all hover:border-primary/30 active:scale-[0.98]"
      >
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-heading font-bold text-foreground">Weekly Report</p>
          <p className="text-[10px] text-muted-foreground/60">Upgrade to Pro to get AI-generated weekly performance reports</p>
        </div>
        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">PRO</span>
      </button>
    );
  }

  // Not yet loaded
  if (!report && !loading) {
    return (
      <button
        onClick={fetchReport}
        className="w-full rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/0 p-4 flex items-center gap-3 transition-all hover:border-primary/30 active:scale-[0.98]"
      >
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-heading font-bold text-foreground">Your Weekly Report</p>
          <p className="text-[10px] text-muted-foreground/60">Tap to generate your AI-powered performance summary</p>
        </div>
        <Sparkles className="h-4 w-4 text-primary/40" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Weekly Report</h3>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/40" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/40" />}
        </button>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground/50", loading && "animate-spin")} />
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-destructive/15 bg-destructive/5 p-3">
          <p className="text-xs text-destructive/80">{error}</p>
        </div>
      )}

      {!loading && !error && report && expanded && (
        <div className="space-y-3 animate-fade-in">
          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Sessions" value={report.metrics.sessions} change={report.metrics.growth} />
            <MetricCard label="Revenue" value={`₪${report.metrics.revenue}`} change={report.metrics.revenueGrowth} />
            <MetricCard label="Clients" value={report.metrics.clients} />
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-border/10 bg-card p-3">
            <p className="text-xs text-foreground/80 leading-relaxed">{report.summary}</p>
          </div>

          {/* Highlights */}
          {report.highlights.length > 0 && (
            <div className="space-y-1.5">
              {report.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 px-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground/70">{h}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-3 w-3 text-primary/50" />
                <p className="text-[10px] font-heading font-bold text-muted-foreground/50 uppercase tracking-wider">Next Steps</p>
              </div>
              {report.recommendations.map((rec, i) => {
                const Icon = TYPE_ICONS[rec.type] || Lightbulb;
                return (
                  <div key={i} className="rounded-xl border border-border/10 bg-card p-2.5 flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-foreground">{rec.title}</p>
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-0.5">{rec.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, change }: { label: string; value: string | number; change?: number }) => (
  <div className="rounded-xl border border-border/10 bg-card p-2.5 text-center">
    <p className="text-sm font-heading font-bold text-foreground">{value}</p>
    <p className="text-[9px] text-muted-foreground/50 mt-0.5">{label}</p>
    {change !== undefined && (
      <div className={cn("flex items-center justify-center gap-0.5 mt-1", change >= 0 ? "text-emerald-500" : "text-red-500")}>
        {change >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
        <span className="text-[9px] font-bold">{change >= 0 ? "+" : ""}{change}%</span>
      </div>
    )}
  </div>
);

export default WeeklyReport;
