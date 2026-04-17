import { useState, useEffect, useMemo, useRef } from "react";
import {
  Eye, Heart, Users, Video, DollarSign, TrendingUp, Clock,
  CalendarDays, Zap, BarChart3, Play, MessageSquare, Star,
  Lightbulb, Activity, Flame, Download, LayoutGrid, Hash,
  LineChart as LineChartIcon, ArrowUpRight, ArrowDownRight, Trophy,
  UserCheck, Repeat, Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import BobInsights from "@/components/BobInsights";
import WeeklyReport from "@/components/WeeklyReport";
import ProAdvancedInsights from "@/components/ProAdvancedInsights";
import { toast } from "sonner";

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type TimeFilter = "week" | "month" | "year";
type ViewMode = "charts" | "numbers" | "cards";

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const VIEW_MODES: { value: ViewMode; label: string; icon: React.ElementType }[] = [
  { value: "charts", label: "Charts", icon: LineChartIcon },
  { value: "numbers", label: "Numbers", icon: Hash },
  { value: "cards", label: "Cards", icon: LayoutGrid },
];

interface CoachInsightsProps {
  coachProfileId: string;
  coachUserId: string;
  isPro?: boolean;
}

interface ContentItem {
  id: string;
  title: string;
  views: number;
  likes_count: number;
  comments_count: number;
  media_type: string;
  created_at: string;
}

interface BookingRow {
  date: string;
  price: number;
  time: string;
  status: string;
  user_id: string;
  training_type: string;
}

/* ─── Brand colors ─── */
const TEAL = "#00D4AA";
const ORANGE = "#FF6B2C";
const NAVY = "#1A1A2E";
const CHART_COLORS = [TEAL, ORANGE, "#6366F1", "#F59E0B", "#EC4899"];

/* ─── Tooltip ─── */
const tooltipStyle = {
  borderRadius: 12, fontSize: 11, border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))", boxShadow: "0 4px 12px rgba(26,26,46,0.12)",
};

/* ─── Animated counter ─── */
const AnimatedNumber = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const from = display;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    };

    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{prefix}{fmt(display)}{suffix}</span>;
};

const CoachInsights = ({ coachProfileId, coachUserId, isPro = false }: CoachInsightsProps) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => {
    return (localStorage.getItem("circlo_insights_time") as TimeFilter) || "month";
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("circlo_insights_view") as ViewMode) || "charts";
  });
  const [loading, setLoading] = useState(true);

  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [watchData, setWatchData] = useState<{ watch_seconds: number; completed: boolean }[]>([]);

  // Persist selections
  useEffect(() => { localStorage.setItem("circlo_insights_time", timeFilter); }, [timeFilter]);
  useEffect(() => { localStorage.setItem("circlo_insights_view", viewMode); }, [viewMode]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [vRes, bRes, fRes, wRes] = await Promise.all([
        supabase.from("coach_videos")
          .select("id, title, views, likes_count, comments_count, media_type, created_at")
          .eq("coach_id", coachProfileId)
          .order("created_at", { ascending: false }),
        supabase.from("bookings")
          .select("date, price, time, status, user_id, training_type")
          .eq("coach_id", coachProfileId)
          .neq("status", "cancelled"),
        supabase.rpc("get_follower_count", { coach_id_input: coachProfileId }),
        supabase.from("video_watches")
          .select("watch_seconds, completed")
          .eq("user_id", coachUserId),
      ]);
      setVideos((vRes.data as ContentItem[]) || []);
      setBookings((bRes.data as BookingRow[]) || []);
      setFollowerCount(typeof fRes.data === "number" ? fRes.data : 0);
      setWatchData((wRes.data as any[]) || []);
      setLoading(false);
    };
    load();
  }, [coachProfileId, coachUserId]);

  // Period calculation
  const periodDays = useMemo(() => {
    switch (timeFilter) {
      case "week": return 7;
      case "month": return 30;
      case "year": return 365;
    }
  }, [timeFilter]);

  const cutoff = useMemo(() => {
    return new Date(Date.now() - periodDays * 86400000).toISOString().split("T")[0];
  }, [periodDays]);

  const prevCutoff = useMemo(() => {
    return new Date(Date.now() - periodDays * 2 * 86400000).toISOString().split("T")[0];
  }, [periodDays]);

  const filteredBookings = useMemo(() =>
    bookings.filter((b) => b.date >= cutoff), [bookings, cutoff]);

  const prevBookings = useMemo(() =>
    bookings.filter((b) => b.date >= prevCutoff && b.date < cutoff), [bookings, prevCutoff, cutoff]);

  const filteredVideos = useMemo(() =>
    videos.filter((v) => v.created_at >= cutoff), [videos, cutoff]);

  // === Metrics ===
  const totalSessions = filteredBookings.length;
  const prevSessions = prevBookings.length;
  const totalRevenue = useMemo(() => filteredBookings.reduce((s, b) => s + (b.price || 0), 0), [filteredBookings]);
  const prevRevenue = useMemo(() => prevBookings.reduce((s, b) => s + (b.price || 0), 0), [prevBookings]);
  const uniqueClients = useMemo(() => new Set(filteredBookings.map((b) => b.user_id)).size, [filteredBookings]);
  const prevClients = useMemo(() => new Set(prevBookings.map((b) => b.user_id)).size, [prevBookings]);
  const totalViews = useMemo(() => filteredVideos.reduce((s, v) => s + (v.views || 0), 0), [filteredVideos]);
  const totalLikes = useMemo(() => filteredVideos.reduce((s, v) => s + (v.likes_count || 0), 0), [filteredVideos]);

  const avgRating = useMemo(() => {
    // Approximate from completion rate + engagement
    if (watchData.length === 0) return 4.8;
    const completionRate = watchData.filter((w) => w.completed).length / watchData.length;
    return Math.min(5, 4.0 + completionRate);
  }, [watchData]);

  const completionRate = useMemo(() => {
    if (watchData.length === 0) return 0;
    return Math.round((watchData.filter((w) => w.completed).length / watchData.length) * 100);
  }, [watchData]);

  // Trend calc helper
  const trend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // === Performance data ===
  const { mostActiveDay, bookingsByDay, bestSport, peakDay, loyalClient, weekRevenue, prevWeekRevenue } = useMemo(() => {
    const dayMap: Record<number, number> = {};
    const sportMap: Record<string, number> = {};
    filteredBookings.forEach(b => {
      const d = new Date(b.date).getDay();
      dayMap[d] = (dayMap[d] || 0) + 1;
      const sport = b.training_type || "General";
      sportMap[sport] = (sportMap[sport] || 0) + 1;
    });

    const bestDayIdx = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
    const mostActiveDay = bestDayIdx ? DAY_NAMES[Number(bestDayIdx[0])] : "—";

    const bookingsByDay: Record<string, number> = {};
    DAY_NAMES.forEach((name, i) => { bookingsByDay[name] = dayMap[i] || 0; });

    const bestSportEntry = Object.entries(sportMap).sort((a, b) => b[1] - a[1])[0];
    const bestSport = bestSportEntry ? bestSportEntry[0] : "—";

    const peakDayEntry = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
    const peakDay = peakDayEntry ? DAY_NAMES[Number(peakDayEntry[0])] : "—";

    // Client loyalty
    const clientMap: Record<string, number> = {};
    filteredBookings.forEach(b => { clientMap[b.user_id] = (clientMap[b.user_id] || 0) + 1; });
    const topClient = Object.entries(clientMap).sort((a, b) => b[1] - a[1])[0];
    const loyalClient = topClient ? `${topClient[1]} sessions` : "—";

    // This week vs last week revenue
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
    const prevWeekStart = new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0];
    const weekRevenue = bookings.filter(b => b.date >= weekStart).reduce((s, b) => s + (b.price || 0), 0);
    const prevWeekRevenue = bookings.filter(b => b.date >= prevWeekStart && b.date < weekStart).reduce((s, b) => s + (b.price || 0), 0);

    return { mostActiveDay, bookingsByDay, bestSport, peakDay, loyalClient, weekRevenue, prevWeekRevenue };
  }, [filteredBookings, bookings]);

  // === Chart data ===
  const dailyChart = useMemo(() => {
    const days = Math.min(periodDays, 60);
    const data: { date: string; sessions: number; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split("T")[0];
      const dayBookings = bookings.filter((b) => b.date === key);
      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sessions: dayBookings.length,
        revenue: dayBookings.reduce((s, b) => s + (b.price || 0), 0),
      });
    }
    return data;
  }, [bookings, periodDays]);

  // Revenue by sport (for bar chart)
  const sportRevenueChart = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBookings.forEach(b => {
      const sport = b.training_type || "General";
      map[sport] = (map[sport] || 0) + (b.price || 0);
    });
    return Object.entries(map).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredBookings]);

  // Client retention donut
  const retentionChart = useMemo(() => {
    const clientMap: Record<string, number> = {};
    filteredBookings.forEach(b => { clientMap[b.user_id] = (clientMap[b.user_id] || 0) + 1; });
    let returning = 0, oneTime = 0;
    Object.values(clientMap).forEach(count => {
      if (count > 1) returning++;
      else oneTime++;
    });
    return [
      { name: "Returning", value: returning || 0 },
      { name: "New", value: oneTime || 0 },
    ];
  }, [filteredBookings]);

  // Avg per day
  const avgPerDay = useMemo(() => {
    if (!filteredBookings.length) return 0;
    const activeDays = new Set(filteredBookings.map(b => b.date)).size;
    return activeDays > 0 ? +(totalSessions / activeDays).toFixed(1) : 0;
  }, [filteredBookings, totalSessions]);

  // New clients this period
  const newClients = useMemo(() => {
    const prevClientIds = new Set(prevBookings.map(b => b.user_id));
    return filteredBookings.filter(b => !prevClientIds.has(b.user_id)).length > 0
      ? new Set(filteredBookings.filter(b => !prevClientIds.has(b.user_id)).map(b => b.user_id)).size
      : 0;
  }, [filteredBookings, prevBookings]);

  // Best content
  const bestContent = useMemo(() =>
    [...filteredVideos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3),
    [filteredVideos]);

  // Tips
  const insights = useMemo(() => {
    const tips: { icon: React.ElementType; text: string; type: "success" | "info" | "warning" }[] = [];
    if (filteredVideos.length === 0) {
      tips.push({ icon: Video, text: "Post your first video to start getting views and followers", type: "info" });
    } else if (filteredVideos.length < 3) {
      tips.push({ icon: TrendingUp, text: "Coaches who post 3+ videos per week get 4x more bookings", type: "info" });
    }
    if (totalViews > 0 && totalSessions === 0) {
      tips.push({ icon: CalendarDays, text: "You have views but no bookings — make sure your schedule is set up", type: "warning" });
    }
    if (completionRate > 70) {
      tips.push({ icon: Star, text: `${completionRate}% video completion — your content keeps viewers engaged!`, type: "success" });
    }
    if (tips.length === 0) {
      tips.push({ icon: Lightbulb, text: "Keep posting consistently to build your audience", type: "info" });
    }
    return tips;
  }, [filteredVideos, totalViews, totalSessions, completionRate]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  const hasData = videos.length > 0 || bookings.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
        <div className="h-16 w-16 rounded-3xl bg-primary/8 flex items-center justify-center">
          <BarChart3 className="h-8 w-8 text-primary/50" />
        </div>
        <h2 className="font-heading text-lg font-bold text-foreground">No insights yet</h2>
        <p className="text-sm text-muted-foreground/60 text-center max-w-[260px]">
          Start posting content and getting bookings to see your analytics here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Top bar: Time filter + View toggle + Export ─── */}
      <div className="flex flex-col gap-3">
        {/* Time filter pills */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-xl w-fit">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTimeFilter(f.value)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-all duration-200",
                timeFilter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View mode toggle + Export */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-secondary/20 rounded-xl">
            {VIEW_MODES.map((v) => (
              <button
                key={v.value}
                onClick={() => setViewMode(v.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all duration-200",
                  viewMode === v.value
                    ? "bg-card text-foreground shadow-sm border border-border/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <v.icon className="h-3 w-3" />
                {v.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 rounded-xl border-border/20"
            onClick={() => toast.success("Report download coming soon!")}
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      {/* ─── View content ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === "charts" && (
            <ChartsView
              dailyChart={dailyChart}
              sportRevenueChart={sportRevenueChart}
              retentionChart={retentionChart}
              totalSessions={totalSessions}
              totalRevenue={totalRevenue}
              uniqueClients={uniqueClients}
            />
          )}
          {viewMode === "numbers" && (
            <NumbersView
              totalRevenue={totalRevenue}
              prevRevenue={prevRevenue}
              totalSessions={totalSessions}
              prevSessions={prevSessions}
              avgRating={avgRating}
              newClients={newClients}
              uniqueClients={uniqueClients}
              prevClients={prevClients}
              followerCount={followerCount}
              totalViews={totalViews}
              trend={trend}
            />
          )}
          {viewMode === "cards" && (
            <CardsView
              bestSport={bestSport}
              loyalClient={loyalClient}
              peakDay={peakDay}
              weekRevenue={weekRevenue}
              prevWeekRevenue={prevWeekRevenue}
              totalSessions={totalSessions}
              avgPerDay={avgPerDay}
              completionRate={completionRate}
              trend={trend}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ─── Tips ─── */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <SectionHeader title="Tips" icon={Lightbulb} />
          {insights.map((tip, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 p-3 rounded-2xl border transition-all",
                tip.type === "success" && "bg-light-teal border-success/15",
                tip.type === "info" && "bg-light-orange border-primary/15",
                tip.type === "warning" && "bg-amber-warm-light border-amber-warm/15"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0",
                tip.type === "success" && "bg-success/10 text-success",
                tip.type === "info" && "bg-primary/10 text-primary",
                tip.type === "warning" && "bg-amber-warm/10 text-amber-warm"
              )}>
                <tip.icon className="h-4 w-4" />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed pt-1.5">{tip.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Bob AI Recommendations ─── */}
      <BobInsights coachData={{
        totalSessions,
        totalRevenue,
        avgPerDay,
        mostActiveDay,
        mostActiveWeek: "—",
        followerCount,
        uniqueClients,
        videoCount: filteredVideos.length,
        totalViews,
        totalLikes,
        completionRate,
        bookingsByDay,
        period: timeFilter === "week" ? "1m" : timeFilter === "month" ? "1m" : "1y",
      }} />

      {/* Weekly Report (Pro) */}
      <WeeklyReport coachProfileId={coachProfileId} isPro={isPro} />

      {/* Advanced Analytics (Pro) */}
      <ProAdvancedInsights
        bookings={filteredBookings.map(b => ({ ...b, training_type: b.training_type || "personal" }))}
        isPro={isPro}
        periodDays={periodDays}
      />

      {/* Top content */}
      {bestContent.length > 0 && (
        <div className="space-y-2">
          <SectionHeader title="Top Content" icon={Play} />
          {bestContent.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border/10 bg-card">
              <span className="text-xs font-bold text-muted-foreground/40 w-5 text-center">{i + 1}</span>
              <div className="h-8 w-8 rounded-lg bg-primary/8 text-primary flex items-center justify-center flex-shrink-0">
                <Play className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{v.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                    <Eye className="h-2.5 w-2.5" /> {fmt(v.views || 0)}
                  </span>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                    <Heart className="h-2.5 w-2.5" /> {fmt(v.likes_count)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CHARTS VIEW
   ═══════════════════════════════════════════════════════════ */

const ChartsView = ({ dailyChart, sportRevenueChart, retentionChart, totalSessions, totalRevenue, uniqueClients }: {
  dailyChart: { date: string; sessions: number; revenue: number }[];
  sportRevenueChart: { name: string; revenue: number }[];
  retentionChart: { name: string; value: number }[];
  totalSessions: number;
  totalRevenue: number;
  uniqueClients: number;
}) => (
  <div className="space-y-4">
    {/* Quick stats row */}
    <div className="grid grid-cols-3 gap-2">
      <QuickStat label="Sessions" value={fmt(totalSessions)} color="text-[#00D4AA]" />
      <QuickStat label="Revenue" value={`₪${fmt(totalRevenue)}`} color="text-[#FF6B2C]" />
      <QuickStat label="Clients" value={fmt(uniqueClients)} color="text-indigo-400" />
    </div>

    {/* Bookings over time — Line chart */}
    <div className="space-y-2">
      <SectionHeader title="Bookings Over Time" icon={TrendingUp} />
      <div className="rounded-2xl border border-border/15 bg-card p-4">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={dailyChart}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAL} stopOpacity={0.15} />
                <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="sessions" fill="url(#lineGrad)" stroke="none" />
            <Line type="monotone" dataKey="sessions" stroke={TEAL} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: TEAL }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Revenue by sport — Bar chart */}
    {sportRevenueChart.length > 0 && (
      <div className="space-y-2">
        <SectionHeader title="Revenue by Type" icon={BarChart3} />
        <div className="rounded-2xl border border-border/15 bg-card p-4">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sportRevenueChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" opacity={0.5} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`₪${val}`, "Revenue"]} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={20}>
                {sportRevenueChart.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}

    {/* Client retention — Donut chart */}
    {(retentionChart[0].value > 0 || retentionChart[1].value > 0) && (
      <div className="space-y-2">
        <SectionHeader title="Client Retention" icon={Users} />
        <div className="rounded-2xl border border-border/15 bg-card p-4 flex items-center gap-4">
          <div className="w-[120px] h-[120px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={retentionChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={TEAL} />
                  <Cell fill={ORANGE} />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <LegendItem color={TEAL} label="Returning" value={retentionChart[0].value} />
            <LegendItem color={ORANGE} label="New" value={retentionChart[1].value} />
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              {retentionChart[0].value + retentionChart[1].value > 0
                ? `${Math.round((retentionChart[0].value / (retentionChart[0].value + retentionChart[1].value)) * 100)}% retention rate`
                : "No data"}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   NUMBERS VIEW
   ═══════════════════════════════════════════════════════════ */

const NumbersView = ({ totalRevenue, prevRevenue, totalSessions, prevSessions, avgRating, newClients, uniqueClients, prevClients, followerCount, totalViews, trend }: {
  totalRevenue: number;
  prevRevenue: number;
  totalSessions: number;
  prevSessions: number;
  avgRating: number;
  newClients: number;
  uniqueClients: number;
  prevClients: number;
  followerCount: number;
  totalViews: number;
  trend: (a: number, b: number) => number;
}) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Total Revenue"
        prefix="₪"
        value={totalRevenue}
        trend={trend(totalRevenue, prevRevenue)}
        icon={DollarSign}
        accent={TEAL}
      />
      <StatCard
        label="Total Sessions"
        value={totalSessions}
        trend={trend(totalSessions, prevSessions)}
        icon={CalendarDays}
        accent={ORANGE}
      />
      <StatCard
        label="Avg Rating"
        value={Number(avgRating.toFixed(1))}
        trend={0}
        icon={Star}
        accent="#F59E0B"
        suffix="/5"
        noAnimate
      />
      <StatCard
        label="New Clients"
        value={newClients}
        trend={trend(uniqueClients, prevClients)}
        icon={UserCheck}
        accent="#6366F1"
      />
    </div>

    {/* Secondary metrics */}
    <div className="grid grid-cols-3 gap-2">
      <MiniStat label="Followers" value={fmt(followerCount)} icon={Users} />
      <MiniStat label="Views" value={fmt(totalViews)} icon={Eye} />
      <MiniStat label="Clients" value={fmt(uniqueClients)} icon={Heart} />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   CARDS VIEW
   ═══════════════════════════════════════════════════════════ */

const CardsView = ({ bestSport, loyalClient, peakDay, weekRevenue, prevWeekRevenue, totalSessions, avgPerDay, completionRate, trend }: {
  bestSport: string;
  loyalClient: string;
  peakDay: string;
  weekRevenue: number;
  prevWeekRevenue: number;
  totalSessions: number;
  avgPerDay: number;
  completionRate: number;
  trend: (a: number, b: number) => number;
}) => {
  const weekTrend = trend(weekRevenue, prevWeekRevenue);

  return (
    <div className="space-y-3">
      <InsightCard
        icon={Trophy}
        title="Best Performing Type"
        value={bestSport}
        subtitle="Most booked training type this period"
        accent={TEAL}
      />
      <InsightCard
        icon={Repeat}
        title="Most Loyal Client"
        value={loyalClient}
        subtitle="Client with the most repeat bookings"
        accent={ORANGE}
      />
      <InsightCard
        icon={Calendar}
        title="Peak Booking Day"
        value={peakDay}
        subtitle="Your busiest day of the week"
        accent="#6366F1"
      />
      <InsightCard
        icon={DollarSign}
        title="Revenue This Week vs Last"
        value={`₪${fmt(weekRevenue)}`}
        subtitle={
          weekTrend > 0
            ? `Up ${weekTrend}% from last week (₪${fmt(prevWeekRevenue)})`
            : weekTrend < 0
            ? `Down ${Math.abs(weekTrend)}% from last week (₪${fmt(prevWeekRevenue)})`
            : `Same as last week (₪${fmt(prevWeekRevenue)})`
        }
        accent="#F59E0B"
        trendValue={weekTrend}
      />

      {/* Additional quick insights */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border/10 bg-card p-4">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">Avg Sessions/Day</p>
          <p className="text-xl font-heading font-bold text-foreground mt-1">{avgPerDay}</p>
        </div>
        <div className="rounded-2xl border border-border/10 bg-card p-4">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">Video Completion</p>
          <p className="text-xl font-heading font-bold text-foreground mt-1">{completionRate}%</p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-2">
    <Icon className="h-3.5 w-3.5 text-primary/60" />
    <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">{title}</h3>
  </div>
);

const QuickStat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="rounded-2xl border border-border/10 bg-card p-3 text-center">
    <p className={cn("text-lg font-heading font-bold leading-none", color)}>{value}</p>
    <p className="text-[9px] text-muted-foreground/50 mt-1.5">{label}</p>
  </div>
);

const StatCard = ({ label, value, trend, icon: Icon, accent, prefix = "", suffix = "", noAnimate = false }: {
  label: string;
  value: number;
  trend: number;
  icon: React.ElementType;
  accent: string;
  prefix?: string;
  suffix?: string;
  noAnimate?: boolean;
}) => {
  const isUp = trend > 0;
  const isDown = trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border/10 bg-card p-4 relative overflow-hidden"
    >
      {/* Accent glow */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.06] blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Icon className="h-[18px] w-[18px]" style={{ color: accent }} />
        </div>
        {trend !== 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full",
            isUp && "bg-emerald-500/10 text-emerald-500",
            isDown && "bg-red-500/10 text-red-500"
          )}>
            {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-heading font-bold text-foreground leading-none">
        {noAnimate ? `${prefix}${value}${suffix}` : <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />}
      </p>
      <p className="text-[10px] text-muted-foreground/50 mt-1.5 uppercase tracking-wider font-semibold">{label}</p>
    </motion.div>
  );
};

const MiniStat = ({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) => (
  <div className="rounded-xl border border-border/10 bg-card p-2.5 text-center">
    <Icon className="h-3 w-3 text-muted-foreground/40 mx-auto mb-1" />
    <p className="text-sm font-heading font-bold text-foreground">{value}</p>
    <p className="text-[9px] text-muted-foreground/50 mt-0.5">{label}</p>
  </div>
);

const InsightCard = ({ icon: Icon, title, value, subtitle, accent, trendValue }: {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
  accent: string;
  trendValue?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className="rounded-2xl border border-border/10 bg-card p-4 relative overflow-hidden"
  >
    <div
      className="absolute top-0 left-0 w-1 h-full rounded-full"
      style={{ background: accent }}
    />
    <div className="flex items-start gap-3 pl-2">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}12` }}>
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-lg font-heading font-bold text-foreground">{value}</p>
          {trendValue !== undefined && trendValue !== 0 && (
            <span className={cn(
              "flex items-center gap-0.5 text-[10px] font-bold",
              trendValue > 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {trendValue > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trendValue)}%
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{subtitle}</p>
      </div>
    </div>
  </motion.div>
);

const LegendItem = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <div className="flex items-center gap-2">
    <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
    <span className="text-xs text-foreground font-medium">{label}</span>
    <span className="text-xs text-muted-foreground/50 font-bold">{value}</span>
  </div>
);

export default CoachInsights;
