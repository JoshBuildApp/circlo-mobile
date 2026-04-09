import { useMemo } from "react";
import {
  BarChart3, DollarSign, TrendingUp, Users, Clock,
  Crown, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";

interface BookingRow {
  date: string;
  price: number;
  time: string;
  training_type: string;
  status: string;
}

interface ProAdvancedInsightsProps {
  bookings: BookingRow[];
  isPro: boolean;
  periodDays: number;
}

const COLORS = [
  "#FF6B2C", // Primary Orange
  "#00C9A7", // Teal
  "#4F46E5", // Indigo
  "#F59E0B", // Amber
  "#FF8A80", // Coral
  "#64748B", // Slate Blue
];

const tooltipStyle = {
  borderRadius: 12, fontSize: 11, border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))", boxShadow: "0 4px 12px rgba(26,26,46,0.08)",
};

const fmt = (n: number) => {
  if (n >= 1000) return `₪${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `₪${n}`;
};

const ProAdvancedInsights = ({ bookings, isPro, periodDays }: ProAdvancedInsightsProps) => {
  const navigate = useNavigate();

  // Revenue by training type
  const revenueByType = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => {
      const t = b.training_type || "personal";
      const label = t === "personal" ? "Personal" : t === "small_group" ? "Small Group" : t === "group" ? "Group" : t;
      map[label] = (map[label] || 0) + (b.price || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  // Sessions by training type
  const sessionsByType = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => {
      const t = b.training_type || "personal";
      const label = t === "personal" ? "Personal" : t === "small_group" ? "Small Group" : t === "group" ? "Group" : t;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [bookings]);

  // Revenue by hour
  const revenueByHour = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => {
      const h = (b.time || "").split(":")[0];
      if (h) {
        const label = `${h}:00`;
        map[label] = (map[label] || 0) + (b.price || 0);
      }
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, revenue]) => ({ hour, revenue }));
  }, [bookings]);

  // Avg revenue per session
  const avgRevenue = useMemo(() => {
    if (bookings.length === 0) return 0;
    return Math.round(bookings.reduce((s, b) => s + (b.price || 0), 0) / bookings.length);
  }, [bookings]);

  // Best hour
  const bestHour = useMemo(() => {
    if (revenueByHour.length === 0) return "—";
    return revenueByHour.sort((a, b) => b.revenue - a.revenue)[0]?.hour || "—";
  }, [revenueByHour]);

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
          <p className="text-sm font-heading font-bold text-foreground">Advanced Analytics</p>
          <p className="text-[10px] text-muted-foreground/60">Revenue breakdowns, performance per training type, and more</p>
        </div>
        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">PRO</span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border/10 bg-card p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500/60" />
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">Avg / Session</p>
          </div>
          <p className="text-sm font-heading font-bold text-foreground">₪{avgRevenue}</p>
        </div>
        <div className="rounded-2xl border border-border/10 bg-card p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-500/60" />
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">Best Hour</p>
          </div>
          <p className="text-sm font-heading font-bold text-foreground">{bestHour}</p>
        </div>
      </div>

      {/* Revenue by training type (pie) */}
      {revenueByType.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary/60" />
            <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Revenue by Type</h3>
          </div>
          <div className="rounded-2xl border border-border/15 bg-card p-4">
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={120}>
                <PieChart>
                  <Pie
                    data={revenueByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                    stroke="none"
                  >
                    {revenueByType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₪${v}`, "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {revenueByType.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] text-foreground/70 flex-1">{entry.name}</span>
                    <span className="text-[10px] font-bold text-foreground">{fmt(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions by type (bar) */}
      {sessionsByType.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary/60" />
            <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Sessions by Type</h3>
          </div>
          <div className="rounded-2xl border border-border/15 bg-card p-4">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={sessionsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Revenue by hour */}
      {revenueByHour.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary/60" />
            <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Revenue by Hour</h3>
          </div>
          <div className="rounded-2xl border border-border/15 bg-card p-4">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={revenueByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" opacity={0.4} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₪${v}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProAdvancedInsights;
