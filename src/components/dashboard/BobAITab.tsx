import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Sparkles, RefreshCw, TrendingUp, DollarSign, CalendarDays,
  Users, Target, Zap, Send, Shield, AlertCircle, ArrowUpRight,
  BarChart3, Brain, Lightbulb, Award, MessageCircle, Database, Flame,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { BOB_PRESETS } from "@/lib/bob-presets";
import { useBobCache, type CachedAnswer } from "@/hooks/use-bob-cache";

interface Recommendation {
  title: string;
  description: string;
  type: "schedule" | "revenue" | "engagement";
}

export interface CoachBusinessData {
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
  cancellationRate: number;
  rebookingRate: number;
  avgSessionPrice: number;
  monthlyGrowthPct: number;
  topPerformingContent: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: CachedAnswer["source"];
}

export interface BobAITabProps {
  coachData: CoachBusinessData;
  coachName: string;
  sport: string;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  schedule: { icon: CalendarDays, color: "text-primary", bg: "bg-primary/10" },
  revenue: { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  engagement: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
};

const SOURCE_BADGE: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  preset: { label: "Instant", icon: Zap, className: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  cache: { label: "Cached", icon: Database, className: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  fresh: { label: "Fresh", icon: Flame, className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
};

const BobAITab = ({ coachData, coachName, sport }: BobAITabProps) => {
  const { user } = useAuth();
  const { getAnswer, getPresetAnswer } = useBobCache();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("bob-insights", {
        body: { coachData },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setRecommendations(data.recommendations || []);
      setLoaded(true);
    } catch (e: unknown) {
      console.error("Bob error:", e);
      setError("Couldn't generate recommendations right now.");
    } finally {
      setLoading(false);
    }
  };

  // Business Health Score (0-100)
  const healthScore = (() => {
    let score = 50; // base
    if (coachData.totalSessions > 10) score += 10;
    if (coachData.totalSessions > 50) score += 5;
    if (coachData.rebookingRate > 50) score += 10;
    if (coachData.rebookingRate > 70) score += 5;
    if (coachData.cancellationRate < 10) score += 5;
    if (coachData.cancellationRate > 30) score -= 10;
    if (coachData.videoCount > 5) score += 5;
    if (coachData.followerCount > 100) score += 5;
    if (coachData.monthlyGrowthPct > 0) score += 5;
    return Math.min(100, Math.max(0, score));
  })();

  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Needs Work";
  const healthColor = healthScore >= 80 ? "text-success" : healthScore >= 60 ? "text-primary" : healthScore >= 40 ? "text-yellow-500" : "text-destructive";

  // Revenue forecast (simple projection)
  const monthlyRevenue = coachData.totalRevenue > 0 ? coachData.totalRevenue / Math.max(1, Math.ceil(coachData.totalSessions / coachData.avgPerDay / 30)) : 0;
  const forecastRevenue = Math.round(monthlyRevenue * (1 + coachData.monthlyGrowthPct / 100));

  // Competitor benchmarking (simulated anonymous data)
  const avgCoachRevenue = Math.round(coachData.avgSessionPrice * 4 * 4.3 * 1.5);
  const revenueVsAvg = avgCoachRevenue > 0 ? Math.round(((monthlyRevenue - avgCoachRevenue) / avgCoachRevenue) * 100) : 0;

  const handlePresetClick = (presetKey: string, label: string) => {
    const answer = getPresetAnswer(presetKey, coachData);
    if (answer) {
      setChatMessages(prev => [
        ...prev,
        { role: "user", content: label },
        { role: "assistant", content: answer, source: "preset" },
      ]);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      if (!user?.id) throw new Error("Not authenticated");

      const result = await getAnswer(
        user.id,
        userMsg,
        coachData,
        coachName,
        sport,
        healthScore
      );

      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: result.answer,
        source: result.source,
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't process that right now. Try asking again in a moment.",
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Health Score */}
      <div className="rounded-2xl border border-border/30 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Business Health Score</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 flex-shrink-0">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={healthScore >= 80 ? "#00D4AA" : healthScore >= 60 ? "#00D4AA" : healthScore >= 40 ? "#f59e0b" : "#ef4444"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${healthScore * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-2xl font-bold", healthColor)}>{healthScore}</span>
              <span className="text-[8px] text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <p className={cn("text-sm font-bold", healthColor)}>{healthLabel}</p>
            <div className="space-y-1">
              {[
                { label: "Sessions", value: coachData.totalSessions, good: coachData.totalSessions > 10 },
                { label: "Rebooking", value: `${coachData.rebookingRate}%`, good: coachData.rebookingRate > 50 },
                { label: "Content", value: coachData.videoCount, good: coachData.videoCount > 5 },
                { label: "Followers", value: coachData.followerCount, good: coachData.followerCount > 50 },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-foreground">{s.value}</span>
                    <div className={cn("h-1.5 w-1.5 rounded-full", s.good ? "bg-success" : "bg-yellow-500")} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Forecast */}
      <div className="rounded-2xl border border-border/30 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-success" />
          <h3 className="text-sm font-bold text-foreground">Revenue Forecast</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Current Monthly</p>
            <p className="text-lg font-bold text-foreground">${Math.round(monthlyRevenue).toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Next Month (est.)</p>
            <p className="text-lg font-bold text-primary">${forecastRevenue.toLocaleString()}</p>
            {coachData.monthlyGrowthPct !== 0 && (
              <span className={cn(
                "text-[9px] font-bold flex items-center gap-0.5 mt-0.5",
                coachData.monthlyGrowthPct > 0 ? "text-success" : "text-destructive"
              )}>
                <ArrowUpRight className={cn("h-2.5 w-2.5", coachData.monthlyGrowthPct < 0 && "rotate-90")} />
                {Math.abs(coachData.monthlyGrowthPct)}% projected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Competitor Benchmarking */}
      <div className="rounded-2xl border border-border/30 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-bold text-foreground">How You Compare</h3>
          <span className="text-[9px] text-muted-foreground ml-auto">vs. avg {sport} coaches</span>
        </div>
        <div className="space-y-3">
          {[
            { label: "Monthly Revenue", yours: `$${Math.round(monthlyRevenue)}`, avg: `$${avgCoachRevenue}`, better: monthlyRevenue >= avgCoachRevenue },
            { label: "Rebooking Rate", yours: `${coachData.rebookingRate}%`, avg: "45%", better: coachData.rebookingRate >= 45 },
            { label: "Content Posts", yours: `${coachData.videoCount}`, avg: "8", better: coachData.videoCount >= 8 },
            { label: "Followers", yours: `${coachData.followerCount}`, avg: "120", better: coachData.followerCount >= 120 },
          ].map(c => (
            <div key={c.label} className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{c.label}</span>
              <div className="flex items-center gap-3">
                <span className={cn("text-[11px] font-bold", c.better ? "text-success" : "text-foreground")}>{c.yours}</span>
                <span className="text-[10px] text-muted-foreground/50">vs {c.avg}</span>
                {c.better ? (
                  <Award className="h-3 w-3 text-success" />
                ) : (
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground/30" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Actionable Tips</h3>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground/50", loading && "animate-spin")} />
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-destructive/15 bg-destructive/5 p-3">
            <p className="text-xs text-destructive/80">{error}</p>
          </div>
        )}

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

      {/* Bob Chat */}
      <div className="rounded-2xl border border-primary/20 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Ask Bob Anything</h3>
              <p className="text-[10px] text-muted-foreground">Your AI business advisor — tap a question for instant answers</p>
            </div>
          </div>
        </div>

        {/* Preset Question Chips */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex flex-wrap gap-1.5">
            {BOB_PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetClick(preset.key, preset.label)}
                className="text-[10px] text-primary bg-primary/5 border border-primary/10 px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1"
              >
                <Zap className="h-2.5 w-2.5" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
          {chatMessages.length === 0 && (
            <div className="text-center py-4">
              <Bot className="h-10 w-10 text-primary/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Tap a question above for instant answers, or type your own below.</p>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div key={i}>
              <div
                className={cn(
                  "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
              {msg.role === "assistant" && msg.source && (
                <div className="mt-1 ml-1">
                  {(() => {
                    const badge = SOURCE_BADGE[msg.source];
                    if (!badge) return null;
                    const BadgeIcon = badge.icon;
                    return (
                      <span className={cn("inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border", badge.className)}>
                        <BadgeIcon className="h-2.5 w-2.5" />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-2xl rounded-bl-md max-w-[85%]">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-border/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleChat()}
              placeholder="Ask Bob about your business..."
              className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30"
            />
            <button
              onClick={handleChat}
              disabled={!chatInput.trim() || chatLoading}
              className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 active:scale-95 transition-transform"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BobAITab;
