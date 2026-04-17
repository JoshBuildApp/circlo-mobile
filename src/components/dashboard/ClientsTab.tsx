import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Crown, UserPlus, UserCheck, TrendingUp,
  Star,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const BRAND_TEAL = "#00D4AA";
const BRAND_ORANGE = "#FF6B2C";

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

export interface ClientRecord {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_bookings: number;
  total_spent: number;
  last_booking: string;
  first_booking: string;
  last_training_type?: string | null;
}

export interface ClientsTabProps {
  clients: ClientRecord[];
  retentionData: { month: string; retained: number; churned: number }[];
  loading: boolean;
}

const getLoyaltyBadge = (totalBookings: number) => {
  if (totalBookings >= 20) return { label: "Diamond", color: "bg-blue-500/10 text-blue-500", icon: Crown };
  if (totalBookings >= 10) return { label: "Gold", color: "bg-yellow-500/10 text-yellow-600", icon: Star };
  if (totalBookings >= 5) return { label: "Silver", color: "bg-gray-400/10 text-gray-500", icon: Star };
  return null;
};

const ClientsTab = ({ clients, retentionData, loading }: ClientsTabProps) => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];

    const newClients = clients.filter(c => c.first_booking >= thirtyDaysAgo).length;
    const returningClients = clients.filter(c => c.first_booking < thirtyDaysAgo && c.last_booking >= thirtyDaysAgo).length;
    const vipClients = clients.filter(c => c.total_bookings >= 10);

    return { newClients, returningClients, vipClients, totalClients: clients.length };
  }, [clients]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-border/30 bg-card p-3 text-center">
          <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold text-foreground">{stats.totalClients}</p>
          <p className="text-[9px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-2xl border border-border/30 bg-light-teal p-3 text-center">
          <UserPlus className="h-4 w-4 mx-auto mb-1 text-success" />
          <p className="text-lg font-bold text-foreground">{stats.newClients}</p>
          <p className="text-[9px] text-muted-foreground">New (30d)</p>
        </div>
        <div className="rounded-2xl border border-border/30 bg-light-orange p-3 text-center">
          <UserCheck className="h-4 w-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold text-foreground">{stats.returningClients}</p>
          <p className="text-[9px] text-muted-foreground">Returning</p>
        </div>
      </div>

      {/* Retention Chart */}
      {retentionData.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Client Retention</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={retentionData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Bar dataKey="retained" stackId="a" fill={BRAND_TEAL} radius={[0, 0, 0, 0]} name="Retained" />
              <Bar dataKey="churned" stackId="a" fill={BRAND_ORANGE} radius={[4, 4, 0, 0]} name="Churned" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BRAND_TEAL }} />
              <span className="text-[10px] text-muted-foreground">Retained</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BRAND_ORANGE }} />
              <span className="text-[10px] text-muted-foreground">Churned</span>
            </div>
          </div>
        </div>
      )}

      {/* VIP Section */}
      {stats.vipClients.length > 0 && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-bold text-foreground">VIP Clients</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {stats.vipClients.slice(0, 6).map(c => (
              <button
                key={c.user_id}
                onClick={() => navigate(`/chat/${c.user_id}`)}
                className="flex flex-col items-center gap-1.5 min-w-[64px] active:scale-95 transition-transform"
              >
                <div className="h-12 w-12 rounded-2xl bg-secondary overflow-hidden border-2 border-yellow-500/30">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm font-bold">
                      {c.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-semibold text-foreground truncate max-w-[64px]">{c.username}</p>
                <p className="text-[8px] text-yellow-600 font-bold">{c.total_bookings} sessions</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Client List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">All Clients</h2>
          <span className="text-[10px] text-muted-foreground">{clients.length} total</span>
        </div>

        {clients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">No clients yet</p>
            <p className="text-xs text-muted-foreground">When trainees book sessions, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="flex items-center px-3 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              <span className="flex-1">Client</span>
              <span className="w-16 text-center">Sessions</span>
              <span className="w-16 text-center">Paid</span>
              <span className="w-20 text-right">Last Session</span>
            </div>
            {clients.map((c) => {
              const badge = getLoyaltyBadge(c.total_bookings);
              const lastDate = new Date(c.last_booking + "T00:00:00");
              const lastLabel = lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <button
                  key={c.user_id}
                  onClick={() => navigate(`/chat/${c.user_id}`)}
                  className="w-full flex items-center gap-2 p-3 rounded-xl bg-card border border-border/30 active:scale-[0.98] transition-transform text-left"
                >
                  <div className="h-10 w-10 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm font-bold">
                        {c.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{c.username}</p>
                      {badge && (
                        <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-full", badge.color)}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    {c.last_training_type && (
                      <p className="text-[9px] text-muted-foreground capitalize">{c.last_training_type}</p>
                    )}
                  </div>
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">{c.total_bookings}</p>
                  </div>
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">${fmt(c.total_spent)}</p>
                  </div>
                  <div className="w-20 text-right flex-shrink-0">
                    <p className="text-[11px] font-medium text-foreground">{lastLabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsTab;
