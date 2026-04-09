import { useState, useMemo } from "react";
import {
  CalendarDays, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight, Users, TrendingDown, RotateCcw, Timer,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BRAND_TEAL = "#00D4AA";
const BRAND_ORANGE = "#FF6B2C";

export interface BookingRecord {
  id: string;
  user_id: string;
  date: string;
  time: string;
  time_label: string;
  status: string;
  price: number;
  training_type?: string | null;
  is_group?: boolean;
  user_name?: string;
  avatar_url?: string | null;
}

export interface BookingsTabProps {
  allBookings: BookingRecord[];
  pendingBookings: BookingRecord[];
  loading: boolean;
  coachProfileId: string;
  onRefresh: () => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const BookingsTab = ({ allBookings, pendingBookings, loading, coachProfileId, onRefresh }: BookingsTabProps) => {
  const [calendarView, setCalendarView] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);

  // Stats
  const stats = useMemo(() => {
    const total = allBookings.length;
    const cancelled = allBookings.filter(b => b.status === "cancelled").length;
    const noShow = allBookings.filter(b => b.status === "no_show").length;
    const completed = allBookings.filter(b => b.status === "completed" || b.status === "confirmed").length;

    // Rebooking rate: users who booked more than once
    const userBookings: Record<string, number> = {};
    allBookings.filter(b => b.status !== "cancelled").forEach(b => {
      userBookings[b.user_id] = (userBookings[b.user_id] || 0) + 1;
    });
    const uniqueUsers = Object.keys(userBookings).length;
    const returningUsers = Object.values(userBookings).filter(c => c > 1).length;
    const rebookingRate = uniqueUsers > 0 ? Math.round((returningUsers / uniqueUsers) * 100) : 0;

    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;

    return { total, cancelled, noShow, completed, rebookingRate, cancellationRate, noShowRate, uniqueUsers, returningUsers };
  }, [allBookings]);

  // Upcoming sessions
  const upcoming = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    return allBookings
      .filter(b => b.date >= todayStr && b.status !== "cancelled" && b.status !== "no_show")
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5);
  }, [allBookings]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    if (calendarView === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const dayBookings = allBookings.filter(b => b.date === dateStr && b.status !== "cancelled");
        return { date: d, dateStr, dayBookings, isToday: dateStr === today.toISOString().split("T")[0] };
      });
    }

    // Month view
    const firstDay = new Date(today.getFullYear(), today.getMonth() + weekOffset, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + weekOffset + 1, 0);
    const startPad = firstDay.getDay();
    const days: { date: Date; dateStr: string; dayBookings: BookingRecord[]; isToday: boolean; isCurrentMonth: boolean }[] = [];

    for (let i = -startPad; i <= lastDay.getDate() + (6 - lastDay.getDay()); i++) {
      const d = new Date(firstDay);
      d.setDate(1 + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayBookings = allBookings.filter(b => b.date === dateStr && b.status !== "cancelled");
      days.push({
        date: d,
        dateStr,
        dayBookings,
        isToday: dateStr === today.toISOString().split("T")[0],
        isCurrentMonth: d.getMonth() === firstDay.getMonth(),
      });
    }
    return days;
  }, [allBookings, calendarView, weekOffset]);

  // Bookings by day of week chart
  const bookingsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    DAYS.forEach(d => { counts[d] = 0; });
    allBookings.filter(b => b.status !== "cancelled").forEach(b => {
      const day = DAYS[new Date(b.date + "T00:00:00").getDay()];
      counts[day]++;
    });
    return DAYS.map(d => ({ day: d, bookings: counts[d] }));
  }, [allBookings]);

  const handleAccept = async (bookingId: string) => {
    const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    if (error) { toast.error("Failed to confirm"); return; }
    toast.success("Booking confirmed!");
    onRefresh();
  };

  const handleReject = async (bookingId: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    if (error) { toast.error("Failed to cancel"); return; }
    toast.success("Booking rejected");
    onRefresh();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  const calendarLabel = calendarView === "week"
    ? (() => {
        const start = calendarDays[0]?.date;
        const end = calendarDays[calendarDays.length - 1]?.date;
        if (!start || !end) return "";
        return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
      })()
    : (() => {
        const d = calendarDays.find(c => (c as { isCurrentMonth?: boolean }).isCurrentMonth)?.date || new Date();
        return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      })();

  return (
    <div className="space-y-5">
      {/* Rate Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-border/30 bg-card p-3 text-center">
          <RotateCcw className="h-4 w-4 mx-auto mb-1 text-success" />
          <p className="text-lg font-bold text-foreground">{stats.rebookingRate}%</p>
          <p className="text-[9px] text-muted-foreground">Rebooking</p>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card p-3 text-center">
          <TrendingDown className="h-4 w-4 mx-auto mb-1 text-destructive" />
          <p className="text-lg font-bold text-foreground">{stats.cancellationRate}%</p>
          <p className="text-[9px] text-muted-foreground">Cancellation</p>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card p-3 text-center">
          <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
          <p className="text-lg font-bold text-foreground">{stats.noShowRate}%</p>
          <p className="text-[9px] text-muted-foreground">No-show</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-border/30 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Calendar</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCalendarView(calendarView === "week" ? "month" : "week")}
              className="text-[10px] font-semibold text-primary px-2 py-1 rounded-lg bg-primary/10"
            >
              {calendarView === "week" ? "Month" : "Week"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setWeekOffset(o => o - 1)} className="p-1 rounded-lg hover:bg-secondary">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-xs font-semibold text-foreground">{calendarLabel}</span>
          <button onClick={() => setWeekOffset(o => o + 1)} className="p-1 rounded-lg hover:bg-secondary">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {calendarView === "week" ? (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d) => (
              <div
                key={d.dateStr}
                className={cn(
                  "rounded-xl p-2 text-center min-h-[64px]",
                  d.isToday ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
                )}
              >
                <p className="text-[9px] text-muted-foreground font-medium">{DAYS[d.date.getDay()]}</p>
                <p className={cn("text-xs font-bold", d.isToday ? "text-primary" : "text-foreground")}>{d.date.getDate()}</p>
                {d.dayBookings.length > 0 && (
                  <div className="mt-1 flex justify-center gap-0.5">
                    {d.dayBookings.slice(0, 3).map((_, i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />
                    ))}
                    {d.dayBookings.length > 3 && (
                      <span className="text-[7px] text-primary font-bold">+{d.dayBookings.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[9px] text-muted-foreground font-medium py-1">{d}</div>
            ))}
            {calendarDays.map((d) => {
              const cd = d as { isCurrentMonth?: boolean; date: Date; dateStr: string; dayBookings: BookingRecord[]; isToday: boolean };
              return (
                <div
                  key={cd.dateStr}
                  className={cn(
                    "rounded-lg p-1.5 text-center min-h-[36px]",
                    cd.isToday ? "bg-primary/10 border border-primary/30" : "",
                    cd.isCurrentMonth === false ? "opacity-30" : ""
                  )}
                >
                  <p className={cn("text-[10px]", cd.isToday ? "text-primary font-bold" : "text-foreground")}>{cd.date.getDate()}</p>
                  {cd.dayBookings.length > 0 && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mx-auto mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="rounded-2xl border border-border/30 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Upcoming Sessions</h3>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No upcoming sessions.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(b => {
              const sessionDate = new Date(b.date + "T" + (b.time || "00:00"));
              const now = new Date();
              const diffMs = sessionDate.getTime() - now.getTime();
              const diffHrs = Math.max(0, Math.floor(diffMs / 3600000));
              const diffDays = Math.floor(diffHrs / 24);
              const countdown = diffDays > 0 ? `${diffDays}d ${diffHrs % 24}h` : diffHrs > 0 ? `${diffHrs}h` : "Now";

              return (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/50">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{b.user_name || "Trainee"}</p>
                    <p className="text-[10px] text-muted-foreground">{b.date} · {b.time_label} · ${b.price}</p>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{countdown}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Pending Requests</h3>
            <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {pendingBookings.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingBookings.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <div className="h-9 w-9 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                  {b.avatar_url ? (
                    <img src={b.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm font-bold">
                      {(b.user_name || "T")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{b.user_name || "Trainee"}</p>
                  <p className="text-[10px] text-muted-foreground">{b.date} · {b.time_label} · ${b.price}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAccept(b.id)}
                    className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center hover:bg-success/20 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 text-success" />
                  </button>
                  <button
                    onClick={() => handleReject(b.id)}
                    className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings by Day */}
      <div className="rounded-2xl border border-border/30 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Bookings by Day</span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={bookingsByDay} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
            <Bar dataKey="bookings" fill={BRAND_TEAL} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BookingsTab;
