import { useState, useMemo } from "react";
import {
  DollarSign, CalendarDays, Users, Eye, TrendingUp, Play,
  ArrowUpRight, ArrowDownRight, BarChart3, Clock, CheckCircle,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookingRecord } from "./BookingsTab";
import type { VideoRecord } from "./ContentTab";

/* ─── Brand colors ─── */
const TEAL = "#00D4AA";
const ORANGE = "#FF6B2C";
const INDIGO = "#6366F1";
const AMBER = "#F59E0B";
const CHART_COLORS = [TEAL, ORANGE, INDIGO, AMBER, "#EC4899"];

const tooltipStyle = {
  borderRadius: 12, fontSize: 11, border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))", boxShadow: "0 4px 12px rgba(26,26,46,0.12)",
};

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

type TimePeriod = "week" | "month" | "year";

const TIME_PILLS: { value: TimePeriod; label: string }[] = [
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = ["6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p"];
const HOUR_RANGES = [6, 8, 10, 12, 14, 16, 18, 20];

interface AnalyticsTabProps {
  allBookings: BookingRecord[];
  videos: VideoRecord[];
  totalViews: number;
  loading: boolean;
}

const AnalyticsTab = ({ allBookings, videos, totalViews, loading }: AnalyticsTabProps) => {
  const [period, setPeriod] = useState<TimePeriod>("month");

  const periodDays = period === "week" ? 7 : period === "month" ? 30 : 365;

  const cutoff = useMemo(() =>
    new Date(Date.now() - periodDays * 86400000).toISOString().split("T")[0],
    [periodDays]);

  const prevCutoff = useMemo(() =>
    new Date(Date.now() - periodDays * 2 * 86400000).toISOString().split("T")[0],
    [periodDays]);

  const nonCancelled = useMemo(() =>
    allBookings.filter(b => b.status !== "cancelled"), [allBookings]);

  const filtered = useMemo(() =>
    nonCancelled.filter(b => b.date >= cutoff), [nonCancelled, cutoff]);

  const prevFiltered = useMemo(() =>
    nonCancelled.filter(b => b.date >= prevCutoff && b.date < cutoff), [nonCancelled, prevCutoff, cutoff]);

  /* ═══ 1. Revenue Chart (Line) ═══ */
  const revenueChart = useMemo(() => {
    const bucketCount = period === "week" ? 7 : period === "month" ? 30 : 12;
    if (period === "year") {
      // Monthly buckets for yearly
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        const key = d.toISOString().slice(0, 7);
        const label = d.toLocaleString("default", { month: "short" });
        const rev = nonCancelled
          .filter(b => b.date.startsWith(key))
          .reduce((s, b) => s + (b.price || 0), 0);
        return { label, revenue: rev };
      });
    }
    return Array.from({ length: bucketCount }, (_, i) => {
      const d = new Date(Date.now() - (bucketCount - 1 - i) * 86400000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const rev = nonCancelled
        .filter(b => b.date === key)
        .reduce((s, b) => s + (b.price || 0), 0);
      return { label, revenue: rev };
    });
  }, [nonCancelled, period]);

  /* ═══ 2. Bookings Trend (Bar) — sessions per week ═══ */
  const bookingsTrend = useMemo(() => {
    const weeks = period === "week" ? 4 : period === "month" ? 8 : 12;
    return Array.from({ length: weeks }, (_, i) => {
      const weekEnd = new Date(Date.now() - (weeks - 1 - i) * 7 * 86400000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 86400000);
      const startStr = weekStart.toISOString().split("T")[0];
      const endStr = weekEnd.toISOString().split("T")[0];
      const count = nonCancelled.filter(b => b.date >= startStr && b.date < endStr).length;
      return {
        week: `${weekStart.toLocaleString("default", { month: "short" })} ${weekStart.getDate()}`,
        sessions: count,
      };
    });
  }, [nonCancelled, period]);

  /* ═══ 3. Revenue by Session Type (Donut) ═══ */
  const revenueByType = useMemo(() => {
    const map: Record<string, number> = { "1-on-1": 0, "Group": 0, "Online": 0 };
    filtered.forEach(b => {
      const type = b.training_type?.toLowerCase() || "";
      if (b.is_group || type.includes("group")) {
        map["Group"] += b.price || 0;
      } else if (type.includes("online") || type.includes("virtual")) {
        map["Online"] += b.price || 0;
      } else {
        map["1-on-1"] += b.price || 0;
      }
    });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  /* ═══ 4. Client Retention ═══ */
  const retention = useMemo(() => {
    const clientMap: Record<string, number> = {};
    filtered.forEach(b => { clientMap[b.user_id] = (clientMap[b.user_id] || 0) + 1; });
    const total = Object.keys(clientMap).length;
    const returning = Object.values(clientMap).filter(c => c > 1).length;
    const pct = total > 0 ? Math.round((returning / total) * 100) : 0;

    // Prev period for trend
    const prevClientMap: Record<string, number> = {};
    prevFiltered.forEach(b => { prevClientMap[b.user_id] = (prevClientMap[b.user_id] || 0) + 1; });
    const prevTotal = Object.keys(prevClientMap).length;
    const prevReturning = Object.values(prevClientMap).filter(c => c > 1).length;
    const prevPct = prevTotal > 0 ? Math.round((prevReturning / prevTotal) * 100) : 0;

    return { pct, prevPct, returning, total };
  }, [filtered, prevFiltered]);

  /* ═══ 5. Profile Views (this week vs last) ═══ */
  const profileViews = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const thisWeek = videos
      .filter(v => v.created_at >= weekAgo)
      .reduce((s, v) => s + v.views, 0);
    const lastWeek = videos
      .filter(v => v.created_at >= twoWeeksAgo && v.created_at < weekAgo)
      .reduce((s, v) => s + v.views, 0);
    const change = lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : thisWeek > 0 ? 100 : 0;
    return { thisWeek, lastWeek, change };
  }, [videos]);

  /* ═══ 5b. Booking Conversion Rate ═══ */
  const conversionData = useMemo(() => {
    const periodBookings = allBookings.filter(b => b.date >= cutoff);
    const total = periodBookings.length;
    const confirmed = periodBookings.filter(b => b.status === "confirmed" || b.status === "upcoming").length;
    const completed = periodBookings.filter(b => b.status === "completed").length;
    const cancelled = periodBookings.filter(b => b.status === "cancelled").length;
    const noShow = periodBookings.filter(b => b.status === "no_show").length;
    const pending = periodBookings.filter(b => b.status === "pending").length;
    const converted = confirmed + completed;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    // Previous period for trend
    const prevPeriodBookings = allBookings.filter(b => b.date >= prevCutoff && b.date < cutoff);
    const prevTotal = prevPeriodBookings.length;
    const prevConverted = prevPeriodBookings.filter(b =>
      b.status === "confirmed" || b.status === "upcoming" || b.status === "completed"
    ).length;
    const prevRate = prevTotal > 0 ? Math.round((prevConverted / prevTotal) * 100) : 0;

    // Funnel breakdown
    const funnel = [
      { name: "Completed", value: completed, color: TEAL },
      { name: "Confirmed", value: confirmed, color: INDIGO },
      { name: "Pending", value: pending, color: AMBER },
      { name: "Cancelled", value: cancelled, color: ORANGE },
      ...(noShow > 0 ? [{ name: "No-show", value: noShow, color: "#EC4899" }] : []),
    ].filter(s => s.value > 0);

    return { conversionRate, prevRate, total, converted, cancelled, noShow, pending, completed, confirmed, funnel };
  }, [allBookings, cutoff, prevCutoff]);

  /* ═══ 6. Top Performing Content ═══ */
  const topContent = useMemo(() =>
    [...videos].sort((a, b) => b.views - a.views).slice(0, 5),
    [videos]);

  /* ═══ 7. Booking Heatmap (day x time) ═══ */
  const heatmapData = useMemo(() => {
    const grid: Record<string, Record<number, number>> = {};
    DAY_NAMES.forEach(d => { grid[d] = {}; HOUR_RANGES.forEach(h => { grid[d][h] = 0; }); });

    nonCancelled.forEach(b => {
      if (!b.time) return;
      const dayIdx = new Date(b.date + "T00:00:00").getDay();
      const day = DAY_NAMES[dayIdx];
      const hour = parseInt(b.time.split(":")[0], 10);
      // bucket into nearest 2-hour block
      const bucket = HOUR_RANGES.reduce((prev, curr) =>
        Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev
      );
      if (grid[day]) grid[day][bucket] = (grid[day][bucket] || 0) + 1;
    });

    // Find max for intensity scaling
    let max = 0;
    DAY_NAMES.forEach(d => HOUR_RANGES.forEach(h => { if (grid[d][h] > max) max = grid[d][h]; }));
    return { grid, max };
  }, [nonCancelled]);

  /* ═══ Summary metrics ═══ */
  const totalRevenue = useMemo(() =>
    filtered.reduce((s, b) => s + (b.price || 0), 0), [filtered]);
  const prevRevenue = useMemo(() =>
    prevFiltered.reduce((s, b) => s + (b.price || 0), 0), [prevFiltered]);
  const revenueTrend = prevRevenue > 0
    ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
    : totalRevenue > 0 ? 100 : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Period toggle */}
      <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-xl w-fit">
        {TIME_PILLS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-all duration-200",
              period === p.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiCard
          label="Revenue"
          value={`₪${fmt(totalRevenue)}`}
          trend={revenueTrend}
          icon={DollarSign}
          color={TEAL}
        />
        <KpiCard
          label="Conversion"
          value={`${conversionData.conversionRate}%`}
          trend={conversionData.conversionRate - conversionData.prevRate}
          icon={CheckCircle}
          color={INDIGO}
        />
        <KpiCard
          label="Sessions"
          value={fmt(filtered.length)}
          trend={prevFiltered.length > 0
            ? Math.round(((filtered.length - prevFiltered.length) / prevFiltered.length) * 100)
            : filtered.length > 0 ? 100 : 0}
          icon={CalendarDays}
          color={ORANGE}
        />
        <KpiCard
          label="Clients"
          value={fmt(retention.total)}
          trend={0}
          icon={Users}
          color={AMBER}
        />
      </div>

      {/* 1. Revenue Chart */}
      <Section title="Revenue Trend" icon={DollarSign}>
        <div className="rounded-2xl border border-border/15 bg-card p-4">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revenueChart}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TEAL} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`₪${val}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" fill="url(#revGrad)" stroke="none" />
              <Line type="monotone" dataKey="revenue" stroke={TEAL} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: TEAL }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 2. Bookings Trend */}
      <Section title="Bookings Trend" icon={BarChart3}>
        <div className="rounded-2xl border border-border/15 bg-card p-4">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={bookingsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis dataKey="week" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sessions" fill={ORANGE} radius={[6, 6, 0, 0]} barSize={24} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 2b. Booking Conversion Funnel */}
      {conversionData.total > 0 && (
        <Section title="Booking Conversion" icon={CheckCircle}>
          <div className="rounded-2xl border border-border/15 bg-card p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <p className="text-3xl font-heading font-bold text-foreground">
                  {conversionData.conversionRate}%
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {conversionData.converted} of {conversionData.total} bookings converted
                </p>
              </div>
              <TrendBadge value={conversionData.conversionRate - conversionData.prevRate} suffix="pp" />
            </div>
            {/* Stacked bar */}
            <div className="h-4 rounded-full overflow-hidden flex bg-secondary/30">
              {conversionData.funnel.map((seg) => {
                const pct = conversionData.total > 0 ? (seg.value / conversionData.total) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={seg.name}
                    className="h-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: seg.color }}
                    title={`${seg.name}: ${seg.value} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              {conversionData.funnel.map((seg) => (
                <div key={seg.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                  <span className="text-[10px] text-muted-foreground/70 font-medium">
                    {seg.name} <span className="font-bold text-foreground">{seg.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* 3. Revenue by Session Type (Donut) */}
      {revenueByType.length > 0 && (
        <Section title="Revenue by Session Type" icon={DollarSign}>
          <div className="rounded-2xl border border-border/15 bg-card p-4 flex items-center gap-4">
            <div className="w-[120px] h-[120px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {revenueByType.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`₪${val}`, "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {revenueByType.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="text-xs text-foreground font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground/50 font-bold">₪{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* 4. Client Retention */}
      <Section title="Client Retention" icon={Users}>
        <div className="rounded-2xl border border-border/15 bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-3xl font-heading font-bold text-foreground">
                {retention.pct}%
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">returning clients</p>
            </div>
            <TrendBadge value={retention.pct - retention.prevPct} suffix="pp" />
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/10">
            <MiniStat label="Returning" value={retention.returning} />
            <MiniStat label="Total Clients" value={retention.total} />
            <MiniStat label="Prev Period" value={`${retention.prevPct}%`} />
          </div>
        </div>
      </Section>

      {/* 5. Profile Views */}
      <Section title="Content Views" icon={Eye}>
        <div className="rounded-2xl border border-border/15 bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-3xl font-heading font-bold text-foreground">
                {fmt(profileViews.thisWeek)}
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">views this week</p>
            </div>
            <TrendBadge value={profileViews.change} />
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/10">
            <MiniStat label="This Week" value={fmt(profileViews.thisWeek)} />
            <MiniStat label="Last Week" value={fmt(profileViews.lastWeek)} />
            <MiniStat label="All Time" value={fmt(totalViews)} />
          </div>
        </div>
      </Section>

      {/* 6. Top Performing Content */}
      {topContent.length > 0 && (
        <Section title="Top Performing Content" icon={Play}>
          <div className="space-y-2">
            {topContent.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border/10 bg-card">
                <span className="text-xs font-bold text-muted-foreground/40 w-5 text-center">{i + 1}</span>
                <div className="h-8 w-8 rounded-lg bg-primary/8 text-primary flex items-center justify-center flex-shrink-0">
                  <Play className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{v.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" /> {fmt(v.views)}
                    </span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      ❤ {fmt(v.likes_count)}
                    </span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      💬 {fmt(v.comments_count)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 7. Booking Heatmap */}
      <Section title="Best Booking Days & Times" icon={Clock}>
        <div className="rounded-2xl border border-border/15 bg-card p-4 overflow-x-auto">
          <div className="min-w-[300px]">
            {/* Header row */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `48px repeat(${HOUR_RANGES.length}, 1fr)` }}>
              <div />
              {HOUR_LABELS.map(h => (
                <div key={h} className="text-[9px] text-muted-foreground/50 text-center font-semibold">{h}</div>
              ))}
            </div>
            {/* Day rows */}
            {DAY_NAMES.map(day => (
              <div
                key={day}
                className="grid gap-1 mt-1"
                style={{ gridTemplateColumns: `48px repeat(${HOUR_RANGES.length}, 1fr)` }}
              >
                <div className="text-[10px] text-muted-foreground/60 font-semibold flex items-center">{day}</div>
                {HOUR_RANGES.map(hour => {
                  const count = heatmapData.grid[day]?.[hour] || 0;
                  const intensity = heatmapData.max > 0 ? count / heatmapData.max : 0;
                  return (
                    <div
                      key={hour}
                      className="aspect-square rounded-md flex items-center justify-center text-[8px] font-bold transition-colors"
                      style={{
                        background: intensity > 0
                          ? `rgba(0, 212, 170, ${0.1 + intensity * 0.7})`
                          : "hsl(var(--secondary))",
                        color: intensity > 0.5 ? "white" : "hsl(var(--muted-foreground))",
                      }}
                      title={`${day} ${hour}:00 — ${count} bookings`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground/40 mt-2 text-center">
            Darker = more bookings at that time
          </p>
        </div>
      </Section>
    </div>
  );
};

/* ═══ Sub-components ═══ */

const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-primary/60" />
      <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

const KpiCard = ({ label, value, trend, icon: Icon, color }: {
  label: string; value: string; trend: number; icon: React.ElementType; color: string;
}) => (
  <div className="rounded-2xl border border-border/10 bg-card p-3 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-[0.06] blur-xl" style={{ background: color }} />
    <div className="h-7 w-7 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}15` }}>
      <Icon className="h-3.5 w-3.5" style={{ color }} />
    </div>
    <p className={cn("text-base font-heading font-bold leading-none")} style={{ color }}>{value}</p>
    <div className="flex items-center gap-1 mt-1">
      <p className="text-[9px] text-muted-foreground/50">{label}</p>
      {trend !== 0 && (
        <span className={cn(
          "text-[8px] font-bold flex items-center",
          trend > 0 ? "text-emerald-500" : "text-red-500"
        )}>
          {trend > 0 ? <ArrowUpRight className="h-2 w-2" /> : <ArrowDownRight className="h-2 w-2" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  </div>
);

const TrendBadge = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
  if (value === 0) return null;
  const isUp = value > 0;
  return (
    <div className={cn(
      "flex items-center gap-0.5 text-xs font-bold px-2.5 py-1 rounded-full",
      isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
    )}>
      {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(value)}{suffix}
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex-1">
    <p className="text-sm font-heading font-bold text-foreground">{value}</p>
    <p className="text-[9px] text-muted-foreground/50">{label}</p>
  </div>
);

export default AnalyticsTab;
