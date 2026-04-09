import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot, Sparkles, Send, Zap, Database, Flame, Brain, TrendingUp,
  ArrowLeft, BarChart3, DollarSign, Users, CalendarDays, Award,
  ArrowUpRight, Lightbulb, RefreshCw, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { BOB_PRESETS } from "@/lib/bob-presets";
import { useBobCache, type CachedAnswer } from "@/hooks/use-bob-cache";
import type { CoachBusinessData } from "@/components/dashboard/BobAITab";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: CachedAnswer["source"];
}

interface Recommendation {
  title: string;
  description: string;
  type: "schedule" | "revenue" | "engagement";
}

const SOURCE_BADGE: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  preset: { label: "Instant", icon: Zap, className: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  cache: { label: "Cached", icon: Database, className: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  fresh: { label: "Fresh", icon: Flame, className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
};

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  schedule: { icon: CalendarDays, color: "text-primary", bg: "bg-primary/10" },
  revenue: { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  engagement: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
};

const QUICK_CATEGORIES = [
  { key: "performance", label: "Performance", icon: TrendingUp },
  { key: "revenue", label: "Revenue", icon: DollarSign },
  { key: "growth", label: "Growth", icon: BarChart3 },
  { key: "clients", label: "Clients", icon: Users },
];

const BobAI = () => {
  const { user, role, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { getAnswer, getPresetAnswer } = useBobCache();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Data loading
  const [pageLoading, setPageLoading] = useState(true);
  const [coachProfile, setCoachProfile] = useState<{
    id: string;
    coach_name: string;
    sport: string;
    image_url: string | null;
    followers: number | null;
    price: number | null;
    is_pro: boolean;
  } | null>(null);
  const [coachData, setCoachData] = useState<CoachBusinessData | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  // Active category filter for presets
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Fetch coach data
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setPageLoading(true);

      // Get coach profile
      const { data: profile } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, followers, price, is_pro")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        setPageLoading(false);
        return;
      }
      setCoachProfile(profile);

      // Fetch bookings and videos in parallel
      const [bookingsRes, videosRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, user_id, date, time, status, price, training_type")
          .eq("coach_id", profile.id)
          .order("date", { ascending: false }),
        supabase
          .from("coach_videos")
          .select("id, title, views, likes_count, comments_count, created_at")
          .eq("coach_id", profile.id),
      ]);

      const rawBookings = bookingsRes.data || [];
      const rawVideos = videosRes.data || [];

      const nonCancelled = rawBookings.filter((b: any) => b.status !== "cancelled");
      const totalEarnings = nonCancelled.reduce((s: number, b: any) => s + (b.price || 0), 0);
      const uniqueClientIds = new Set(nonCancelled.map((b: any) => b.user_id));
      const uniqueClients = uniqueClientIds.size;

      // Rebooking rate
      const userBookingCounts: Record<string, number> = {};
      nonCancelled.forEach((b: any) => {
        userBookingCounts[b.user_id] = (userBookingCounts[b.user_id] || 0) + 1;
      });
      const returning = Object.values(userBookingCounts).filter(c => c > 1).length;
      const rebookingRate = uniqueClients > 0 ? Math.round((returning / uniqueClients) * 100) : 0;

      // Cancellation rate
      const cancelled = rawBookings.filter((b: any) => b.status === "cancelled").length;
      const cancellationRate = rawBookings.length > 0 ? Math.round((cancelled / rawBookings.length) * 100) : 0;

      const totalSessions = nonCancelled.length;
      const avgPerDay = totalSessions > 0 ? Math.max(1, Math.round(totalSessions / 30)) : 0;

      // Bookings by day
      const bookingsByDay: Record<string, number> = {};
      nonCancelled.forEach((b: any) => {
        const day = new Date(b.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
        bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
      });
      const mostActiveDay = Object.entries(bookingsByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      const totalViews = rawVideos.reduce((s: number, v: any) => s + (v.views || 0), 0);
      const totalLikes = rawVideos.reduce((s: number, v: any) => s + (v.likes_count || 0), 0);

      // Weekly growth
      const now = Date.now();
      const weekAgo = new Date(now - 7 * 86400000).toISOString().split("T")[0];
      const twoWeeksAgo = new Date(now - 14 * 86400000).toISOString().split("T")[0];
      const thisWeekEarnings = nonCancelled.filter((b: any) => b.date >= weekAgo).reduce((s: number, b: any) => s + (b.price || 0), 0);
      const lastWeekEarnings = nonCancelled.filter((b: any) => b.date >= twoWeeksAgo && b.date < weekAgo).reduce((s: number, b: any) => s + (b.price || 0), 0);
      const monthlyGrowthPct = lastWeekEarnings === 0 ? (thisWeekEarnings > 0 ? 100 : 0) : Math.round(((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100);

      const data: CoachBusinessData = {
        totalSessions,
        totalRevenue: totalEarnings,
        avgPerDay,
        mostActiveDay,
        mostActiveWeek: "Current",
        followerCount: profile.followers || 0,
        uniqueClients,
        videoCount: rawVideos.length,
        totalViews,
        totalLikes,
        completionRate: totalSessions > 0 ? Math.round(((totalSessions - cancelled) / Math.max(1, totalSessions + cancelled)) * 100) : 0,
        bookingsByDay,
        period: "all-time",
        cancellationRate,
        rebookingRate,
        avgSessionPrice: profile.price || 0,
        monthlyGrowthPct,
        topPerformingContent: rawVideos.length > 0
          ? rawVideos.reduce((best: any, v: any) => (v.views || 0) > (best.views || 0) ? v : best).title || ""
          : "",
      };

      setCoachData(data);
      setPageLoading(false);
    };
    fetchData();
  }, [user]);

  // Health score
  const healthScore = useMemo(() => {
    if (!coachData) return 0;
    let score = 50;
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
  }, [coachData]);

  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Needs Work";
  const healthColor = healthScore >= 80 ? "text-success" : healthScore >= 60 ? "text-primary" : healthScore >= 40 ? "text-yellow-500" : "text-destructive";

  const fetchRecommendations = useCallback(async () => {
    if (!coachData) return;
    setRecsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bob-insights", {
        body: { coachData },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecommendations(data.recommendations || []);
    } catch (e) {
      console.error("Bob recommendations error:", e);
    } finally {
      setRecsLoading(false);
    }
  }, [coachData]);

  const handlePresetClick = (presetKey: string, label: string) => {
    if (!coachData) return;
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
    if (!chatInput.trim() || chatLoading || !coachData || !coachProfile || !user?.id) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const result = await getAnswer(
        user.id,
        userMsg,
        coachData,
        coachProfile.coach_name,
        coachProfile.sport,
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

  // Filtered presets by category
  const filteredPresets = useMemo(() => {
    if (!activeCategory) return BOB_PRESETS;
    const categoryMap: Record<string, string[]> = {
      performance: ["improve_rating", "get_verified", "get_more_bookings"],
      revenue: ["what_to_charge", "increase_revenue", "online_sessions"],
      growth: ["grow_followers", "online_sessions"],
      clients: ["get_more_bookings", "peak_booking_days", "improve_rating"],
    };
    const keys = categoryMap[activeCategory] || [];
    return BOB_PRESETS.filter(p => keys.includes(p.key));
  }, [activeCategory]);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (role !== "coach" && !isAdmin)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="rounded-[28px] border border-border/10 bg-card p-6 text-center space-y-3 max-w-sm">
          <Bot className="h-12 w-12 text-primary/30 mx-auto" />
          <h1 className="font-heading text-lg font-bold text-foreground">Bob AI</h1>
          <p className="text-sm text-muted-foreground">Bob is available for coaches only. Switch to a coach account to access your AI business advisor.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-heading font-bold text-primary-foreground"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-5 pb-3">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-24 w-full rounded-2xl mb-4" />
          <Skeleton className="h-10 w-full rounded-xl mb-3" />
          <Skeleton className="h-10 w-full rounded-xl mb-3" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!coachProfile || !coachData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="rounded-[28px] border border-border/10 bg-card p-6 text-center space-y-3 max-w-sm">
          <Bot className="h-12 w-12 text-primary/30 mx-auto" />
          <h1 className="font-heading text-lg font-bold text-foreground">No Coach Profile</h1>
          <p className="text-sm text-muted-foreground">Set up your coach profile first to start using Bob AI.</p>
          <button
            onClick={() => navigate("/coach-onboarding")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-heading font-bold text-primary-foreground"
          >
            Set Up Profile
          </button>
        </div>
      </div>
    );
  }

  const monthlyRevenue = coachData.totalRevenue > 0
    ? coachData.totalRevenue / Math.max(1, Math.ceil(coachData.totalSessions / coachData.avgPerDay / 30))
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Bob AI</h1>
              <p className="text-[10px] text-muted-foreground">Your AI Business Advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "h-2 w-2 rounded-full",
              healthScore >= 60 ? "bg-success" : healthScore >= 40 ? "bg-yellow-500" : "bg-destructive"
            )} />
            <span className={cn("text-xs font-bold", healthColor)}>{healthScore}</span>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Sessions", value: coachData.totalSessions, icon: CalendarDays },
            { label: "Revenue", value: `$${Math.round(monthlyRevenue)}`, icon: DollarSign },
            { label: "Clients", value: coachData.uniqueClients, icon: Users },
            { label: "Rebook", value: `${coachData.rebookingRate}%`, icon: TrendingUp },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-card border border-border/20 p-2.5 text-center">
              <stat.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold text-foreground">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Health Score Mini */}
        <div className="rounded-2xl border border-border/30 bg-card p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 flex-shrink-0">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={healthScore >= 60 ? "#00D4AA" : healthScore >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${healthScore * 2.64} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-lg font-bold", healthColor)}>{healthScore}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">Business Health</span>
                <span className={cn("text-[10px] font-bold ml-auto", healthColor)}>{healthLabel}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {healthScore >= 80
                  ? "Your coaching business is thriving! Keep up the great work."
                  : healthScore >= 60
                  ? "Solid performance. A few improvements could push you higher."
                  : healthScore >= 40
                  ? "Room for growth. Ask Bob for tips to improve your score."
                  : "Let's work on building your coaching business together."}
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
          {QUICK_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border",
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border/20 hover:bg-secondary/80"
              )}
            >
              <cat.icon className="h-3 w-3" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Preset Questions */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {filteredPresets.map((preset) => (
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

        {/* AI Recommendations */}
        {recommendations.length === 0 && !recsLoading && (
          <button
            onClick={fetchRecommendations}
            className="w-full rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4 flex items-center justify-center gap-2 mb-4 hover:bg-primary/10 transition-colors"
          >
            <Lightbulb className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Get AI Recommendations</span>
          </button>
        )}

        {recsLoading && (
          <div className="space-y-2 mb-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">Recommendations</span>
              </div>
              <button
                onClick={fetchRecommendations}
                disabled={recsLoading}
                className="p-1 rounded-lg hover:bg-secondary/50"
              >
                <RefreshCw className={cn("h-3 w-3 text-muted-foreground/50", recsLoading && "animate-spin")} />
              </button>
            </div>
            {recommendations.map((rec, i) => {
              const meta = TYPE_META[rec.type] || TYPE_META.schedule;
              const Icon = meta.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border/10 bg-card p-3 flex items-start gap-2.5 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0", meta.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground">{rec.title}</p>
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-0.5">{rec.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Section — full width, sticky input */}
      <div className="border-t border-border/10">
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">Chat with Bob</span>
          </div>
        </div>

        <div className="px-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3">
          {chatMessages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-primary/15 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">Hey {coachProfile.coach_name}!</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                I'm Bob, your AI business advisor. Ask me anything about your coaching performance, pricing, growth strategies, or how to get more bookings.
              </p>
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

        {/* Chat Input */}
        <div className="px-4 py-3 border-t border-border/10">
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

export default BobAI;
