import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface TopCoach {
  coach_id: string;
  coach_name: string;
  sport: string;
  total_earned: number;
  booking_count: number;
  avg_price: number;
}

interface RecentTransaction {
  id: string;
  athlete_name: string;
  coach_name: string;
  amount: number;
  date: string;
  payment_method: string;
}

interface KeyMetrics {
  totalRevenue: number;
  revenueThisMonth: number;
  avgBookingValue: number;
  totalPaidBookings: number;
}

const PAID_STATUSES = ["confirmed", "completed"];

const RevenueTab = () => {
  const [metrics, setMetrics] = useState<KeyMetrics>({
    totalRevenue: 0,
    revenueThisMonth: 0,
    avgBookingValue: 0,
    totalPaidBookings: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [topCoaches, setTopCoaches] = useState<TopCoach[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMetrics(), fetchMonthlyRevenue(), fetchTopCoaches(), fetchRecentTransactions()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("price, created_at")
      .in("status", PAID_STATUSES);

    if (!bookings) return;

    const now = new Date();
    const monthStart = startOfMonth(now).toISOString();
    const monthEnd = endOfMonth(now).toISOString();

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const thisMonthBookings = bookings.filter(
      (b) => b.created_at >= monthStart && b.created_at <= monthEnd
    );
    const revenueThisMonth = thisMonthBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

    setMetrics({
      totalRevenue,
      revenueThisMonth,
      avgBookingValue,
      totalPaidBookings: bookings.length,
    });
  };

  const fetchMonthlyRevenue = async () => {
    const months: MonthlyRevenue[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate).toISOString();
      const end = endOfMonth(monthDate).toISOString();

      const { data } = await supabase
        .from("bookings")
        .select("price")
        .in("status", PAID_STATUSES)
        .gte("created_at", start)
        .lte("created_at", end);

      const revenue = (data || []).reduce((sum, b) => sum + (b.price || 0), 0);
      months.push({
        month: format(monthDate, "MMM"),
        revenue,
      });
    }

    setMonthlyData(months);
  };

  const fetchTopCoaches = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("coach_id, coach_name, price")
      .in("status", PAID_STATUSES);

    if (!bookings) return;

    // Group by coach
    const coachMap = new Map<string, { coach_name: string; total: number; count: number }>();
    for (const b of bookings) {
      const existing = coachMap.get(b.coach_id);
      if (existing) {
        existing.total += b.price || 0;
        existing.count += 1;
      } else {
        coachMap.set(b.coach_id, { coach_name: b.coach_name, total: b.price || 0, count: 1 });
      }
    }

    // Get sport from coach_profiles
    const coachIds = Array.from(coachMap.keys());
    const { data: profiles } = await supabase
      .from("coach_profiles")
      .select("id, sport")
      .in("id", coachIds);

    const sportMap = new Map((profiles || []).map((p) => [p.id, p.sport]));

    const coaches: TopCoach[] = Array.from(coachMap.entries())
      .map(([coach_id, info]) => ({
        coach_id,
        coach_name: info.coach_name,
        sport: sportMap.get(coach_id) || "—",
        total_earned: info.total,
        booking_count: info.count,
        avg_price: info.count > 0 ? info.total / info.count : 0,
      }))
      .sort((a, b) => b.total_earned - a.total_earned)
      .slice(0, 8);

    setTopCoaches(coaches);
  };

  const fetchRecentTransactions = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, user_id, coach_name, price, date, payment_method, created_at")
      .in("status", PAID_STATUSES)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!bookings || bookings.length === 0) return;

    // Get athlete names from profiles
    const userIds = bookings.map((b) => b.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username")
      .in("user_id", userIds);

    const userMap = new Map((profiles || []).map((p) => [p.user_id, p.username]));

    const transactions: RecentTransaction[] = bookings.map((b) => ({
      id: b.id,
      athlete_name: userMap.get(b.user_id) || "Unknown",
      coach_name: b.coach_name,
      amount: b.price || 0,
      date: b.date,
      payment_method: b.payment_method,
    }));

    setRecentTransactions(transactions);
  };

  const formatCurrency = (amount: number) => `₪${amount.toLocaleString("en-IL", { maximumFractionDigits: 0 })}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/20 rounded-xl px-3 py-2 text-xs shadow-lg">
          <p className="text-muted-foreground mb-0.5">{label}</p>
          <p className="font-bold text-primary">{formatCurrency(payload[0].value)}</p>
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

  return (
    <div className="space-y-5">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl border border-border/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total Revenue</span>
          </div>
          <p className="font-heading text-xl font-bold text-foreground">{formatCurrency(metrics.totalRevenue)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">All time</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">This Month</span>
          </div>
          <p className="font-heading text-xl font-bold text-foreground">{formatCurrency(metrics.revenueThisMonth)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Current month</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <CreditCard className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Avg Booking</span>
          </div>
          <p className="font-heading text-xl font-bold text-foreground">{formatCurrency(metrics.avgBookingValue)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Per booking</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Paid Bookings</span>
          </div>
          <p className="font-heading text-xl font-bold text-foreground">{metrics.totalPaidBookings}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total confirmed</p>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-card rounded-2xl border border-border/10 p-4">
        <h3 className="font-heading font-bold text-foreground text-sm mb-4">Monthly Revenue — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} barSize={28}>
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
              tickFormatter={(v) => `₪${v}`}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Earning Coaches */}
      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
        <div className="p-4 border-b border-border/10">
          <h3 className="font-heading font-bold text-foreground text-sm">Top Earning Coaches</h3>
        </div>
        {topCoaches.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">No data yet</p>
        ) : (
          <div className="divide-y divide-border/10">
            <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              <span className="col-span-2">Coach</span>
              <span>Sport</span>
              <span className="text-right">Earned</span>
              <span className="text-right">Sessions</span>
            </div>
            {topCoaches.map((coach, i) => (
              <div key={coach.coach_id} className="grid grid-cols-5 gap-2 px-4 py-3 items-center">
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-4">#{i + 1}</span>
                  <p className="text-xs font-medium text-foreground truncate">{coach.coach_name}</p>
                </div>
                <span className="text-[11px] text-muted-foreground truncate">{coach.sport}</span>
                <span className="text-xs font-semibold text-primary text-right">{formatCurrency(coach.total_earned)}</span>
                <span className="text-xs text-muted-foreground text-right">{coach.booking_count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
        <div className="p-4 border-b border-border/10">
          <h3 className="font-heading font-bold text-foreground text-sm">Recent Transactions</h3>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">No transactions yet</p>
        ) : (
          <div className="divide-y divide-border/10">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {tx.athlete_name} → {tx.coach_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {tx.date} · {tx.payment_method}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">{formatCurrency(tx.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueTab;
