import { useEffect, useState } from "react";
import { TrendingUp, Users, UserCheck, Calendar, ArrowDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface FunnelStage {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface MonthlyFunnelPoint {
  month: string;
  signups: number;
  onboarded: number;
  first_bookings: number;
}

interface FunnelMetrics {
  totalSignups: number;
  totalOnboarded: number;
  totalFirstBookings: number;
  signupToOnboard: number;
  onboardToBooking: number;
  overallConversion: number;
}

const FunnelTab = () => {
  const [metrics, setMetrics] = useState<FunnelMetrics>({
    totalSignups: 0,
    totalOnboarded: 0,
    totalFirstBookings: 0,
    signupToOnboard: 0,
    onboardToBooking: 0,
    overallConversion: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyFunnelPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMetrics(), fetchMonthlyFunnel()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    const [profilesRes, onboardedRes, bookingsRes] = await Promise.all([
      supabase.from("profiles").select("user_id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .not("status", "is", null),
      supabase
        .from("bookings")
        .select("user_id")
        .not("status", "eq", "cancelled"),
    ]);

    const totalSignups = profilesRes.count || 0;
    const totalOnboarded = onboardedRes.count || 0;

    // Unique users who made at least one booking
    const uniqueBookers = new Set((bookingsRes.data || []).map((b) => b.user_id));
    const totalFirstBookings = uniqueBookers.size;

    const signupToOnboard =
      totalSignups > 0 ? Math.round((totalOnboarded / totalSignups) * 100) : 0;
    const onboardToBooking =
      totalOnboarded > 0 ? Math.round((totalFirstBookings / totalOnboarded) * 100) : 0;
    const overallConversion =
      totalSignups > 0 ? Math.round((totalFirstBookings / totalSignups) * 100) : 0;

    setMetrics({
      totalSignups,
      totalOnboarded,
      totalFirstBookings,
      signupToOnboard,
      onboardToBooking,
      overallConversion,
    });
  };

  const fetchMonthlyFunnel = async () => {
    const now = new Date();
    const points: MonthlyFunnelPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate).toISOString();
      const end = endOfMonth(monthDate).toISOString();

      const [signupsRes, onboardedRes, bookingsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .gte("created_at", start)
          .lte("created_at", end),
        supabase
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .not("status", "is", null)
          .gte("created_at", start)
          .lte("created_at", end),
        supabase
          .from("bookings")
          .select("user_id")
          .not("status", "eq", "cancelled")
          .gte("created_at", start)
          .lte("created_at", end),
      ]);

      const uniqueBookers = new Set((bookingsRes.data || []).map((b) => b.user_id));

      points.push({
        month: format(monthDate, "MMM"),
        signups: signupsRes.count || 0,
        onboarded: onboardedRes.count || 0,
        first_bookings: uniqueBookers.size,
      });
    }

    setMonthlyData(points);
  };

  const pct = (n: number) => `${n}%`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/20 rounded-xl px-3 py-2 text-xs shadow-lg">
          <p className="text-muted-foreground mb-1 font-medium">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.fill }} className="font-medium">
              {p.name === "signups"
                ? "Signups"
                : p.name === "onboarded"
                ? "Onboarded"
                : "First Bookings"}
              : {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stages: FunnelStage[] = [
    {
      label: "Signups",
      count: metrics.totalSignups,
      icon: <Users className="h-4 w-4" />,
      color: "text-primary",
      description: "Registered accounts",
    },
    {
      label: "Onboarded",
      count: metrics.totalOnboarded,
      icon: <UserCheck className="h-4 w-4" />,
      color: "text-accent",
      description: "Completed onboarding flow",
    },
    {
      label: "First Booking",
      count: metrics.totalFirstBookings,
      icon: <Calendar className="h-4 w-4" />,
      color: "text-green-500",
      description: "Made at least one booking",
    },
  ];

  const dropOffs = [
    {
      from: "Signup → Onboarding",
      dropped: metrics.totalSignups - metrics.totalOnboarded,
      rate: 100 - metrics.signupToOnboard,
      tip: "Reduce steps in the onboarding wizard or make it skippable",
    },
    {
      from: "Onboarding → First Booking",
      dropped: metrics.totalOnboarded - metrics.totalFirstBookings,
      rate: 100 - metrics.onboardToBooking,
      tip: "Prompt users to book directly after onboarding completes",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Overall Conversion */}
      <div className="bg-card rounded-2xl border border-border/10 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-[18px] w-[18px] text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-sm">Overall Conversion</h3>
            <p className="text-[10px] text-muted-foreground">Signup → First Booking</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-heading text-3xl font-black text-primary">{pct(metrics.overallConversion)}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Signup → Onboard</p>
            <p className="font-heading font-bold text-foreground text-base">{pct(metrics.signupToOnboard)}</p>
          </div>
          <div className="flex-1 bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Onboard → Booking</p>
            <p className="font-heading font-bold text-foreground text-base">{pct(metrics.onboardToBooking)}</p>
          </div>
        </div>
      </div>

      {/* Funnel Stages */}
      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
        <div className="p-4 border-b border-border/10">
          <h3 className="font-heading font-bold text-foreground text-sm">Conversion Funnel</h3>
        </div>
        <div className="p-4 space-y-1">
          {stages.map((stage, i) => {
            const widthPct =
              metrics.totalSignups > 0
                ? Math.max(10, Math.round((stage.count / metrics.totalSignups) * 100))
                : 0;
            return (
              <div key={stage.label}>
                <div className="flex items-center gap-3 py-2">
                  <div className={`h-7 w-7 rounded-lg bg-secondary flex items-center justify-center ${stage.color} flex-shrink-0`}>
                    {stage.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div>
                        <span className="text-xs font-semibold text-foreground">{stage.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{stage.description}</span>
                      </div>
                      <span className="font-heading font-bold text-sm text-foreground ml-2 flex-shrink-0">{stage.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          i === 0 ? "bg-primary" : i === 1 ? "bg-accent" : "bg-green-500"
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div className="flex items-center gap-2 pl-3 py-0.5">
                    <ArrowDown className="h-3 w-3 text-muted-foreground/50 ml-2" />
                    <span className="text-[10px] text-muted-foreground">
                      {i === 0
                        ? `${metrics.signupToOnboard}% converted`
                        : `${metrics.onboardToBooking}% converted`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-card rounded-2xl border border-border/10 p-4">
        <h3 className="font-heading font-bold text-foreground text-sm mb-4">Monthly Funnel — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} barSize={14} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }} />
            <Legend
              formatter={(value) => (
                <span className="text-[10px] text-muted-foreground capitalize">
                  {value === "signups" ? "Signups" : value === "onboarded" ? "Onboarded" : "First Bookings"}
                </span>
              )}
            />
            <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="onboarded" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="first_bookings" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Drop-off Analysis */}
      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
        <div className="p-4 border-b border-border/10">
          <h3 className="font-heading font-bold text-foreground text-sm">Drop-off Analysis</h3>
        </div>
        <div className="divide-y divide-border/10">
          {dropOffs.map((d) => (
            <div key={d.from} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-foreground">{d.from}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold ${
                      d.rate > 60 ? "text-destructive" : d.rate > 30 ? "text-yellow-500" : "text-green-500"
                    }`}
                  >
                    {d.rate}% dropped
                  </span>
                  <span className="text-[10px] text-muted-foreground">({d.dropped.toLocaleString()} users)</span>
                </div>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${
                    d.rate > 60 ? "bg-destructive" : d.rate > 30 ? "bg-yellow-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(d.rate, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium text-foreground/70">Tip:</span> {d.tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FunnelTab;
