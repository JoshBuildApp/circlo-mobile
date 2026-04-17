import { useEffect, useState } from "react";
import { TrendingDown, AlertCircle, Bell, MessageSquare } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface AtRiskAthlete {
  user_id: string;
  username: string;
  email: string;
  last_booking_date: string;
  session_count: number;
  days_inactive: number;
}

interface AtRiskCoach {
  coach_id: string;
  coach_name: string;
  sport: string;
  last_booking_date: string;
  days_inactive: number;
}

interface RetentionPoint {
  month: string;
  new_users: number;
  returning_users: number;
}

const PAID_STATUSES = ["confirmed", "completed"];

const ChurnTab = () => {
  const [churnRate, setChurnRate] = useState<number>(0);
  const [atRiskAthletes, setAtRiskAthletes] = useState<AtRiskAthlete[]>([]);
  const [atRiskCoaches, setAtRiskCoaches] = useState<AtRiskCoach[]>([]);
  const [retentionData, setRetentionData] = useState<RetentionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchChurnRate(),
        fetchAtRiskAthletes(),
        fetchAtRiskCoaches(),
        fetchRetentionData(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurnRate = async () => {
    const now = new Date();
    const day60 = subDays(now, 60).toISOString();
    const day30 = subDays(now, 30).toISOString();

    // Users with a booking in last 60 days
    const { data: last60 } = await supabase
      .from("bookings")
      .select("user_id")
      .gte("created_at", day60);

    // Users with a booking in last 30 days
    const { data: last30 } = await supabase
      .from("bookings")
      .select("user_id")
      .gte("created_at", day30);

    if (!last60 || !last30) return;

    const active60 = new Set(last60.map((b) => b.user_id));
    const active30 = new Set(last30.map((b) => b.user_id));

    // Churned = were active in 60 days but not in last 30
    let churned = 0;
    active60.forEach((uid) => {
      if (!active30.has(uid)) churned++;
    });

    const rate = active60.size > 0 ? (churned / active60.size) * 100 : 0;
    setChurnRate(Math.round(rate * 10) / 10);
  };

  const fetchAtRiskAthletes = async () => {
    const cutoff45 = subDays(new Date(), 45).toISOString();

    // Get all bookings grouped by athlete
    const { data: bookings } = await supabase
      .from("bookings")
      .select("user_id, created_at")
      .order("created_at", { ascending: false });

    if (!bookings) return;

    // Map user -> all bookings
    const userMap = new Map<string, string[]>();
    for (const b of bookings) {
      const existing = userMap.get(b.user_id) || [];
      existing.push(b.created_at);
      userMap.set(b.user_id, existing);
    }

    // At risk: >2 sessions AND last booking was 45+ days ago
    const atRisk: Array<{ user_id: string; last_booking: string; count: number }> = [];
    userMap.forEach((dates, user_id) => {
      const sorted = dates.sort((a, b) => b.localeCompare(a));
      const lastBooking = sorted[0];
      if (dates.length > 2 && lastBooking < cutoff45) {
        atRisk.push({ user_id, last_booking: lastBooking, count: dates.length });
      }
    });

    if (atRisk.length === 0) return;

    // Get profile info
    const userIds = atRisk.map((a) => a.user_id).slice(0, 20);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, email")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const now = new Date();

    const athletes: AtRiskAthlete[] = atRisk
      .slice(0, 20)
      .map((a) => {
        const profile = profileMap.get(a.user_id);
        const lastDate = new Date(a.last_booking);
        const daysInactive = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          user_id: a.user_id,
          username: profile?.username || "Unknown",
          email: profile?.email || "—",
          last_booking_date: format(lastDate, "MMM d, yyyy"),
          session_count: a.count,
          days_inactive: daysInactive,
        };
      })
      .sort((a, b) => b.days_inactive - a.days_inactive);

    setAtRiskAthletes(athletes);
  };

  const fetchAtRiskCoaches = async () => {
    const day30 = subDays(new Date(), 30).toISOString();

    // All bookings
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("coach_id, coach_name, created_at")
      .order("created_at", { ascending: false });

    if (!allBookings || allBookings.length === 0) return;

    // Coaches with any booking ever
    const coachMap = new Map<string, { name: string; lastBooking: string }>();
    for (const b of allBookings) {
      if (!coachMap.has(b.coach_id)) {
        coachMap.set(b.coach_id, { name: b.coach_name, lastBooking: b.created_at });
      }
    }

    // Coaches with booking in last 30 days
    const active30 = new Set(
      allBookings.filter((b) => b.created_at >= day30).map((b) => b.coach_id)
    );

    // At risk = had bookings before but none in last 30 days
    const atRisk: Array<{ coach_id: string; name: string; lastBooking: string }> = [];
    coachMap.forEach((info, coach_id) => {
      if (!active30.has(coach_id)) {
        atRisk.push({ coach_id, name: info.name, lastBooking: info.lastBooking });
      }
    });

    if (atRisk.length === 0) return;

    // Get sport from coach_profiles
    const coachIds = atRisk.map((c) => c.coach_id).slice(0, 15);
    const { data: profiles } = await supabase
      .from("coach_profiles")
      .select("id, sport")
      .in("id", coachIds);

    const sportMap = new Map((profiles || []).map((p) => [p.id, p.sport]));
    const now = new Date();

    const coaches: AtRiskCoach[] = atRisk
      .slice(0, 15)
      .map((c) => {
        const lastDate = new Date(c.lastBooking);
        const daysInactive = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          coach_id: c.coach_id,
          coach_name: c.name,
          sport: sportMap.get(c.coach_id) || "—",
          last_booking_date: format(lastDate, "MMM d, yyyy"),
          days_inactive: daysInactive,
        };
      })
      .sort((a, b) => b.days_inactive - a.days_inactive);

    setAtRiskCoaches(coaches);
  };

  const fetchRetentionData = async () => {
    const now = new Date();
    const points: RetentionPoint[] = [];

    // Get all profiles with their creation date
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, created_at");

    const profileCreatedAt = new Map((profiles || []).map((p) => [p.user_id, p.created_at]));

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate).toISOString();
      const end = endOfMonth(monthDate).toISOString();

      // All unique users who booked in this month
      const { data: monthBookings } = await supabase
        .from("bookings")
        .select("user_id")
        .gte("created_at", start)
        .lte("created_at", end);

      const uniqueUsers = new Set((monthBookings || []).map((b) => b.user_id));

      let newUsers = 0;
      let returningUsers = 0;

      uniqueUsers.forEach((uid) => {
        const createdAt = profileCreatedAt.get(uid);
        if (createdAt && createdAt >= start && createdAt <= end) {
          newUsers++;
        } else {
          returningUsers++;
        }
      });

      points.push({
        month: format(monthDate, "MMM"),
        new_users: newUsers,
        returning_users: returningUsers,
      });
    }

    setRetentionData(points);
  };

  const handleSendReminder = (name: string) => {
    toast.success(`Reminder queued for ${name}`);
  };

  const handleReachOut = (name: string) => {
    toast.success(`Outreach queued for ${name}`);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/20 rounded-xl px-3 py-2 text-xs shadow-lg">
          <p className="text-muted-foreground mb-1 font-medium">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>
              {p.name === "new_users" ? "New" : "Returning"}: {p.value}
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

  return (
    <div className="space-y-5">
      {/* Churn Rate Card */}
      <div className="bg-card rounded-2xl border border-border/10 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
            <TrendingDown className="h-[18px] w-[18px] text-destructive" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-sm">Churn Rate</h3>
            <p className="text-[10px] text-muted-foreground">Active in 60 days who dropped off in last 30</p>
          </div>
        </div>
        <p className="font-heading text-4xl font-black mt-3">
          <span className={churnRate > 30 ? "text-destructive" : churnRate > 15 ? "text-yellow-500" : "text-green-500"}>
            {churnRate}%
          </span>
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {churnRate < 15
            ? "Healthy — users are staying"
            : churnRate < 30
            ? "Watch this — re-engagement may help"
            : "High churn — action needed"}
        </p>
      </div>

      {/* Retention Chart */}
      <div className="bg-card rounded-2xl border border-border/10 p-4">
        <h3 className="font-heading font-bold text-foreground text-sm mb-4">New vs Returning Users — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={retentionData}>
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-[10px] text-muted-foreground">
                  {value === "new_users" ? "New Users" : "Returning Users"}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="new_users"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--primary))" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="returning_users"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--accent))" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* At-Risk Athletes */}
      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
        <div className="p-4 border-b border-border/10 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <h3 className="font-heading font-bold text-foreground text-sm">At-Risk Athletes</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">&gt;2 sessions · 45+ days inactive</span>
        </div>
        {atRiskAthletes.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">No at-risk athletes — great retention!</p>
        ) : (
          <div className="divide-y divide-border/10">
            {atRiskAthletes.map((athlete) => (
              <div key={athlete.user_id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-foreground font-heading font-bold text-xs flex-shrink-0">
                  {athlete.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{athlete.username}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {athlete.email} · {athlete.session_count} sessions · last: {athlete.last_booking_date}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-yellow-500 font-semibold">{athlete.days_inactive}d ago</span>
                  <button
                    onClick={() => handleSendReminder(athlete.username)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Bell className="h-3 w-3" />
                    Remind
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* At-Risk Coaches */}
      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
        <div className="p-4 border-b border-border/10 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <h3 className="font-heading font-bold text-foreground text-sm">At-Risk Coaches</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">No bookings in 30+ days</span>
        </div>
        {atRiskCoaches.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">All coaches are active!</p>
        ) : (
          <div className="divide-y divide-border/10">
            {atRiskCoaches.map((coach) => (
              <div key={coach.coach_id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-foreground font-heading font-bold text-xs flex-shrink-0">
                  {coach.coach_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{coach.coach_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {coach.sport} · last booking: {coach.last_booking_date}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-orange-500 font-semibold">{coach.days_inactive}d ago</span>
                  <button
                    onClick={() => handleReachOut(coach.coach_name)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent text-[10px] font-medium hover:bg-accent/20 transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Reach out
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChurnTab;
