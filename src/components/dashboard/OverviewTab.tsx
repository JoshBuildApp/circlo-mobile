import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  DollarSign, TrendingUp, CalendarDays, Clock, ChevronRight, Plus,
  Upload, MessageSquare, Eye, Heart, Users, UserCheck, Sparkles, Tag,
  CheckCircle, XCircle, Shield, ArrowUpRight, ArrowDownRight, Percent,
  Star, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

const BRAND_TEAL = "#00D4AA";
const BRAND_ORANGE = "#FF6B2C";
const BRAND_NAVY = "#1A1A2E";
const CHART_COLORS = [BRAND_TEAL, BRAND_ORANGE, "#6366f1", "#f59e0b", "#ec4899"];

interface TodayBooking {
  id: string;
  user_id: string;
  date: string;
  time: string;
  time_label: string;
  status: string;
  price: number;
  user_name?: string;
}

interface EarningsChartPoint {
  week: string;
  earnings: number;
}

interface RevenueByType {
  type: string;
  amount: number;
}

interface PayoutRecord {
  date: string;
  amount: number;
  status: "received" | "pending";
  sessions: number;
}

interface UpcomingBooking {
  id: string;
  user_id: string;
  date: string;
  time: string;
  time_label: string;
  status: string;
  price: number;
  user_name?: string;
}

export interface RecentReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_username: string;
  reviewer_avatar: string | null;
}

export interface OverviewTabProps {
  totalEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  pendingEarnings: number;
  receivedEarnings: number;
  earningsChart: EarningsChartPoint[];
  revenueByType: RevenueByType[];
  payoutHistory: PayoutRecord[];
  todayBookings: TodayBooking[];
  upcomingBookings?: UpcomingBooking[];
  newFollowersCount?: number;
  recentReviews?: RecentReview[];
  totalViews: number;
  totalLikes: number;
  followers: number;
  clientsCount: number;
  videosCount: number;
  weeklyGrowthPct: number;
  loading: boolean;
  isPro: boolean;
  isVerified: boolean;
  verificationStatus: string | null;
  onUpload: () => void;
  onVerify: () => void;
  onSetTab: (t: string) => void;
}

const OverviewTab = ({
  totalEarnings, weeklyEarnings, monthlyEarnings, yearlyEarnings,
  pendingEarnings, receivedEarnings, earningsChart, revenueByType,
  payoutHistory, todayBookings, upcomingBookings = [], newFollowersCount = 0,
  recentReviews = [], totalViews, totalLikes, followers,
  clientsCount, videosCount, weeklyGrowthPct, loading, isPro, isVerified,
  verificationStatus, onUpload, onVerify, onSetTab,
}: OverviewTabProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Verification Banner */}
      {!isVerified && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          {verificationStatus === "pending" ? (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Verification Under Review</p>
                <p className="text-[10px] text-muted-foreground">We'll notify you soon.</p>
              </div>
            </div>
          ) : verificationStatus === "rejected" ? (
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Not Approved</p>
                <p className="text-[10px] text-muted-foreground">You can resubmit.</p>
              </div>
              <button onClick={onVerify} className="text-[11px] text-primary font-semibold">Resubmit</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Get Verified</p>
                <p className="text-[10px] text-muted-foreground">Build trust & unlock features</p>
              </div>
              <button onClick={onVerify} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold">
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-border/30 bg-card p-3">
          <div className="flex items-center gap-1 mb-1.5">
            <DollarSign className="h-3 w-3 text-primary" />
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">This Week</span>
          </div>
          <p className="text-lg font-bold text-foreground">${fmt(weeklyEarnings)}</p>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card p-3">
          <div className="flex items-center gap-1 mb-1.5">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">This Month</span>
          </div>
          <p className="text-lg font-bold text-foreground">${fmt(monthlyEarnings)}</p>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card p-3">
          <div className="flex items-center gap-1 mb-1.5">
            <Sparkles className="h-3 w-3 text-accent" />
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">This Year</span>
          </div>
          <p className="text-lg font-bold text-foreground">${fmt(yearlyEarnings)}</p>
        </div>
      </div>

      {/* Pending vs Received */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/30 bg-light-teal p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
            <span className="text-[10px] text-slate-blue font-medium">Received</span>
          </div>
          <p className="text-xl font-bold text-foreground">${fmt(receivedEarnings)}</p>
        </div>
        <div className="rounded-2xl border border-border/30 bg-light-orange p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-slate-blue font-medium">Pending</span>
          </div>
          <p className="text-xl font-bold text-foreground">${fmt(pendingEarnings)}</p>
        </div>
      </div>

      {/* Revenue Line Chart */}
      {earningsChart.length > 0 && earningsChart.some(d => d.earnings > 0) && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Revenue Trend</span>
            {weeklyGrowthPct !== 0 && (
              <span className={cn(
                "ml-auto text-[10px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full",
                weeklyGrowthPct > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {weeklyGrowthPct > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(weeklyGrowthPct)}%
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={earningsChart} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="overviewEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_TEAL} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND_TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(v: number) => [`$${v}`, 'Revenue']}
                contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
              />
              <Area type="monotone" dataKey="earnings" stroke={BRAND_TEAL} strokeWidth={2} fill="url(#overviewEarningsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue by Session Type */}
      {revenueByType.length > 0 && revenueByType.some(r => r.amount > 0) && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Revenue by Type</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByType.filter(r => r.amount > 0)}
                    dataKey="amount"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={40}
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                  >
                    {revenueByType.filter(r => r.amount > 0).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {revenueByType.filter(r => r.amount > 0).map((r, i) => (
                <div key={r.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-[11px] text-foreground capitalize">{r.type}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-foreground">${fmt(r.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="rounded-2xl border border-border/30 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Today's Schedule</h3>
          </div>
          <button onClick={() => onSetTab("bookings")} className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {todayBookings.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No sessions today.</p>
        ) : (
          <div className="space-y-2">
            {todayBookings.slice(0, 4).map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/50">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{b.user_name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.time_label} · ${b.price}</p>
                </div>
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-md capitalize",
                  b.status === "confirmed" ? "bg-light-teal text-success" : "bg-light-orange text-primary"
                )}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Sessions (next 7 days) */}
      {upcomingBookings.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-success" />
              <h3 className="text-sm font-bold text-foreground">Upcoming Sessions</h3>
              <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {upcomingBookings.length}
              </span>
            </div>
            <button onClick={() => onSetTab("bookings")} className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingBookings.slice(0, 5).map((b) => {
              const bookingDate = new Date(b.date + "T00:00:00");
              const dayLabel = bookingDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              return (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/50">
                  <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{b.user_name}</p>
                    <p className="text-[10px] text-muted-foreground">{dayLabel} · {b.time_label} · ${b.price}</p>
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded-md capitalize",
                    b.status === "confirmed" ? "bg-light-teal text-success" : "bg-light-orange text-primary"
                  )}>
                    {b.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Eye, label: "Views", value: fmt(totalViews), color: "text-indigo-depth", bg: "bg-indigo-light" },
          { icon: Heart, label: "Likes", value: fmt(totalLikes), color: "text-accent", bg: "bg-light-orange" },
          { icon: Users, label: "Followers", value: fmt(followers), color: "text-success", bg: "bg-light-teal", badge: newFollowersCount > 0 ? `+${newFollowersCount}` : undefined },
          { icon: UserCheck, label: "Clients", value: clientsCount.toString(), color: "text-amber-warm", bg: "bg-amber-warm-light" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl p-3 text-center relative", s.bg)}>
            {"badge" in s && s.badge && (
              <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-success text-white px-1.5 py-0.5 rounded-full">
                {s.badge}
              </span>
            )}
            <s.icon className={cn("h-4 w-4 mx-auto mb-1", s.color)} />
            <p className="text-sm font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-slate-blue">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New Followers */}
      {newFollowersCount > 0 && (
        <div className="rounded-2xl border border-border/30 bg-gradient-to-r from-success/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground">+{newFollowersCount} New Follower{newFollowersCount !== 1 ? "s" : ""}</p>
              <p className="text-[10px] text-muted-foreground">In the last 7 days</p>
            </div>
            <span className="text-lg font-bold text-success">{fmt(followers)}</span>
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">Recent Reviews</h3>
              <span className="text-[9px] font-bold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">
                {recentReviews.length} new
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {recentReviews.slice(0, 3).map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-7 w-7 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                    {r.reviewer_avatar ? (
                      <img src={r.reviewer_avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {r.reviewer_username[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">{r.reviewer_username}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout History */}
      {payoutHistory.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Payout History</span>
          </div>
          <div className="space-y-2">
            {payoutHistory.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-foreground">{p.date}</p>
                  <p className="text-[10px] text-muted-foreground">{p.sessions} session{p.sessions !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-foreground">${fmt(p.amount)}</p>
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded",
                    p.status === "received" ? "bg-success/10 text-success" : "bg-yellow-500/10 text-yellow-600"
                  )}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border/30 bg-card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Plus, label: "Add Availability", action: () => onSetTab("bookings"), color: "bg-primary/10 text-primary" },
            { icon: Upload, label: "Upload Content", action: onUpload, color: "bg-accent/10 text-accent" },
            { icon: MessageSquare, label: "Messages", action: () => navigate("/inbox"), color: "bg-violet-500/10 text-violet-500" },
            { icon: Eye, label: "View Profile", action: () => navigate("/profile"), color: "bg-blue-500/10 text-blue-500" },
            { icon: Tag, label: "Offer Promo", action: () => onSetTab("bookings"), color: "bg-emerald-500/10 text-emerald-500" },
            { icon: Users, label: "All Clients", action: () => onSetTab("clients"), color: "bg-amber-500/10 text-amber-500" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/30 active:scale-95 transition-transform"
            >
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", a.color)}>
                <a.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pro Upgrade CTA */}
      {!isPro && (
        <button
          onClick={() => navigate("/pro")}
          className="w-full rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/3 p-4 flex items-center gap-3 active:scale-[0.98] transition-all"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-foreground">Upgrade to CIRCLO Pro</p>
            <p className="text-[10px] text-muted-foreground">AI reports, advanced analytics & Discover boost</p>
          </div>
          <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">&#8362;99/mo</span>
        </button>
      )}
    </div>
  );
};

export default OverviewTab;
