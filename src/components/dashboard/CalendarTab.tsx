import { useState, useMemo, useCallback, useRef } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, User, Users,
  X, Ban, MapPin, DollarSign, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAvailability, useBlockedSlots, formatHour } from "@/hooks/use-availability";
import type { BookingRecord } from "@/components/dashboard/BookingsTab";

interface CalendarTabProps {
  allBookings: BookingRecord[];
  coachProfileId: string;
  onRefresh: () => void;
}

interface BookingDetail extends BookingRecord {
  training_type?: string | null;
  is_group?: boolean;
}

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

function getWeekDates(offset: number): Date[] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDates(offset: number): { date: Date; isCurrentMonth: boolean }[] {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const last = new Date(today.getFullYear(), today.getMonth() + offset + 1, 0);
  const startPad = first.getDay();
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = -startPad; i <= last.getDate() + (6 - last.getDay()) - 1; i++) {
    const d = new Date(first);
    d.setDate(1 + i);
    days.push({ date: d, isCurrentMonth: d.getMonth() === first.getMonth() });
  }
  return days;
}

function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CalendarTab = ({ allBookings, coachProfileId, onRefresh }: CalendarTabProps) => {
  const [view, setView] = useState<"week" | "month">("week");
  const [offset, setOffset] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Drag-to-block state
  const [dragStart, setDragStart] = useState<{ day: string; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: string; hour: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [blockingInProgress, setBlockingInProgress] = useState(false);

  const { availability, refresh: refreshAvailability } = useAvailability(coachProfileId);
  const { blocked } = useBlockedSlots(coachProfileId);
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;

  const todayStr = dateStr(new Date());

  // Build lookup maps
  const bookingsByDateHour = useMemo(() => {
    const map: Record<string, BookingRecord[]> = {};
    for (const b of allBookings) {
      if (b.status === "cancelled") continue;
      const key = `${b.date}_${b.time}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [allBookings]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingRecord[]> = {};
    for (const b of allBookings) {
      if (b.status === "cancelled") continue;
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, [allBookings]);

  const blockedSet = useMemo(() => {
    const set = new Set<string>();
    for (const b of blocked) {
      set.add(`${b.date}_${b.time}`);
    }
    return set;
  }, [blocked]);

  const availabilityByDay = useMemo(() => {
    const map: Record<number, { start: number; end: number }[]> = {};
    for (const slot of availability) {
      if (!slot.is_active) continue;
      const day = slot.day_of_week;
      if (!map[day]) map[day] = [];
      const [sh] = slot.start_time.split(":").map(Number);
      const [eh] = slot.end_time.split(":").map(Number);
      map[day].push({ start: sh, end: eh });
    }
    return map;
  }, [availability]);

  const isAvailable = useCallback((dayOfWeek: number, hour: number) => {
    const ranges = availabilityByDay[dayOfWeek];
    if (!ranges) return false;
    return ranges.some(r => hour >= r.start && hour < r.end);
  }, [availabilityByDay]);

  // Drag-to-block handlers
  const getDragRange = useCallback(() => {
    if (!dragStart || !dragEnd || dragStart.day !== dragEnd.day) return null;
    const minH = Math.min(dragStart.hour, dragEnd.hour);
    const maxH = Math.max(dragStart.hour, dragEnd.hour);
    return { day: dragStart.day, startHour: minH, endHour: maxH };
  }, [dragStart, dragEnd]);

  const handleMouseDown = useCallback((day: string, hour: number) => {
    const key = `${day}_${hour.toString().padStart(2, "0")}:00`;
    // Don't start drag on booked slots
    if (bookingsByDateHour[key]?.length) return;
    setDragStart({ day, hour });
    setDragEnd({ day, hour });
    setIsDragging(true);
  }, [bookingsByDateHour]);

  const handleMouseEnter = useCallback((day: string, hour: number) => {
    if (!isDragging || !dragStart) return;
    if (day === dragStart.day) {
      setDragEnd({ day, hour });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(async () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }
    setIsDragging(false);

    const range = getDragRange();
    if (!range) return;

    setBlockingInProgress(true);
    const rows: { coach_id: string; date: string; time: string; reason: string }[] = [];
    for (let h = range.startHour; h <= range.endHour; h++) {
      const time = `${h.toString().padStart(2, "0")}:00`;
      const key = `${range.day}_${time}`;
      if (!blockedRef.current.some(b => b.date === range.day && b.time === time)) {
        rows.push({
          coach_id: coachProfileId,
          date: range.day,
          time,
          reason: "Blocked from calendar",
        });
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("blocked_slots").insert(rows);
      if (error) {
        toast.error("Failed to block time slots");
      } else {
        toast.success(`Blocked ${rows.length} slot${rows.length > 1 ? "s" : ""}`);
        refreshAvailability();
        onRefresh();
      }
    }

    setDragStart(null);
    setDragEnd(null);
    setBlockingInProgress(false);
  }, [isDragging, dragStart, dragEnd, getDragRange, coachProfileId, refreshAvailability, onRefresh]);

  const handleUnblock = useCallback(async (date: string, time: string) => {
    const { error } = await supabase
      .from("blocked_slots")
      .delete()
      .eq("coach_id", coachProfileId)
      .eq("date", date)
      .eq("time", time);
    if (error) {
      toast.error("Failed to unblock");
    } else {
      toast.success("Slot unblocked");
      refreshAvailability();
      onRefresh();
    }
  }, [coachProfileId, refreshAvailability, onRefresh]);

  const isInDragRange = useCallback((day: string, hour: number) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    const range = getDragRange();
    if (!range || range.day !== day) return false;
    return hour >= range.startHour && hour <= range.endHour;
  }, [isDragging, dragStart, dragEnd, getDragRange]);

  // Navigation
  const weekDates = useMemo(() => getWeekDates(offset), [offset]);
  const monthDates = useMemo(() => getMonthDates(offset), [offset]);

  const weekLabel = useMemo(() => {
    if (view === "week") {
      const s = weekDates[0];
      const e = weekDates[6];
      return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}`;
    }
    const d = monthDates.find(m => m.isCurrentMonth)?.date || new Date();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }, [view, weekDates, monthDates]);

  const goToday = () => setOffset(0);

  // ── WEEK VIEW ──
  const renderWeekView = () => (
    <div
      className="overflow-x-auto -mx-1"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { if (isDragging) handleMouseUp(); }}
    >
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] sticky top-0 z-10 bg-card">
          <div className="p-1" />
          {weekDates.map((d) => {
            const ds = dateStr(d);
            const isToday = ds === todayStr;
            return (
              <div key={ds} className={cn("text-center py-2 border-l border-border/20", isToday && "bg-primary/5")}>
                <p className="text-[9px] text-muted-foreground font-medium">{DAYS_SHORT[d.getDay()]}</p>
                <p className={cn(
                  "text-sm font-bold",
                  isToday ? "text-primary" : "text-foreground"
                )}>{d.getDate()}</p>
              </div>
            );
          })}
        </div>

        {/* Hour rows */}
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[48px_repeat(7,1fr)] border-t border-border/10">
            <div className="py-2 pr-2 text-right">
              <span className="text-[10px] text-muted-foreground font-medium">
                {formatHour(`${hour.toString().padStart(2, "0")}:00`)}
              </span>
            </div>
            {weekDates.map((d) => {
              const ds = dateStr(d);
              const time = `${hour.toString().padStart(2, "0")}:00`;
              const key = `${ds}_${time}`;
              const bookings = bookingsByDateHour[key] || [];
              const isBlocked = blockedSet.has(key);
              const hasAvail = isAvailable(d.getDay(), hour);
              const isToday = ds === todayStr;
              const inDrag = isInDragRange(ds, hour);

              return (
                <div
                  key={key}
                  className={cn(
                    "border-l border-border/10 min-h-[44px] p-0.5 relative select-none transition-colors",
                    isToday && "bg-primary/[0.02]",
                    hasAvail && !isBlocked && bookings.length === 0 && "bg-primary/[0.04]",
                    isBlocked && "bg-destructive/5",
                    inDrag && "bg-destructive/15 ring-1 ring-inset ring-destructive/30",
                    !bookings.length && !isBlocked && "cursor-crosshair",
                  )}
                  onMouseDown={() => handleMouseDown(ds, hour)}
                  onMouseEnter={() => handleMouseEnter(ds, hour)}
                >
                  {bookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={cn(
                        "w-full text-left rounded-md px-1.5 py-1 mb-0.5 text-[10px] font-semibold truncate transition-all hover:ring-2 hover:ring-primary/30",
                        b.status === "confirmed" && "bg-primary/15 text-primary border border-primary/20",
                        b.status === "pending" && "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20",
                        b.status === "completed" && "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/20",
                        b.status === "no_show" && "bg-red-500/15 text-red-600 border border-red-500/20",
                      )}
                    >
                      {b.user_name || "Trainee"}
                    </button>
                  ))}
                  {isBlocked && bookings.length === 0 && (
                    <button
                      onClick={() => handleUnblock(ds, time)}
                      className="w-full flex items-center justify-center gap-1 text-[9px] text-destructive/60 hover:text-destructive transition-colors py-1"
                      title="Click to unblock"
                    >
                      <Ban className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Drag hint */}
      {!isDragging && (
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Drag across empty slots to block time
        </p>
      )}
    </div>
  );

  // ── MONTH VIEW ──
  const renderMonthView = () => (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-[9px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {monthDates.map(({ date: d, isCurrentMonth }) => {
          const ds = dateStr(d);
          const isToday = ds === todayStr;
          const dayBookings = bookingsByDate[ds] || [];
          const confirmed = dayBookings.filter(b => b.status === "confirmed" || b.status === "completed").length;
          const pending = dayBookings.filter(b => b.status === "pending").length;
          const hasBlocked = blocked.some(b => b.date === ds);

          return (
            <button
              key={ds}
              onClick={() => setSelectedDay(ds)}
              className={cn(
                "rounded-lg p-1.5 min-h-[52px] text-left transition-all hover:ring-1 hover:ring-primary/30",
                isToday && "bg-primary/10 ring-1 ring-primary/30",
                !isCurrentMonth && "opacity-30",
                selectedDay === ds && "ring-2 ring-primary",
              )}
            >
              <p className={cn(
                "text-[10px] font-semibold",
                isToday ? "text-primary" : "text-foreground"
              )}>{d.getDate()}</p>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {confirmed > 0 && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" title={`${confirmed} confirmed`} />
                )}
                {pending > 0 && (
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" title={`${pending} pending`} />
                )}
                {hasBlocked && (
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive/50" title="Has blocked slots" />
                )}
              </div>
              {dayBookings.length > 0 && (
                <p className="text-[8px] text-muted-foreground mt-0.5">{dayBookings.length} session{dayBookings.length > 1 ? "s" : ""}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="mt-4 rounded-2xl border border-border/30 bg-secondary/30 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-foreground">
              {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric",
              })}
            </h4>
            <button onClick={() => setSelectedDay(null)} className="p-1 rounded-lg hover:bg-secondary">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {(bookingsByDate[selectedDay] || []).length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No sessions on this day.</p>
          ) : (
            <div className="space-y-2">
              {(bookingsByDate[selectedDay] || [])
                .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                .map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card hover:bg-card/80 transition-colors text-left"
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      b.status === "confirmed" && "bg-primary/10",
                      b.status === "pending" && "bg-yellow-500/10",
                      b.status === "completed" && "bg-green-500/10",
                    )}>
                      <Clock className={cn(
                        "h-4 w-4",
                        b.status === "confirmed" && "text-primary",
                        b.status === "pending" && "text-yellow-500",
                        b.status === "completed" && "text-green-500",
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{b.user_name || "Trainee"}</p>
                      <p className="text-[10px] text-muted-foreground">{b.time_label} · ${b.price}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md capitalize",
                      b.status === "confirmed" && "bg-primary/10 text-primary",
                      b.status === "pending" && "bg-yellow-500/10 text-yellow-600",
                      b.status === "completed" && "bg-green-500/10 text-green-600",
                      b.status === "no_show" && "bg-red-500/10 text-red-500",
                    )}>{b.status}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── BOOKING DETAIL SHEET ──
  const renderBookingDetail = () => {
    if (!selectedBooking) return null;
    const b = selectedBooking;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
        <div className="relative bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto border border-border/30 shadow-2xl animate-slide-in-bottom">
          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-secondary overflow-hidden flex-shrink-0">
                {b.avatar_url ? (
                  <img src={b.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                    {(b.user_name || "T")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{b.user_name || "Trainee"}</p>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-md capitalize inline-block mt-0.5",
                  b.status === "confirmed" && "bg-primary/10 text-primary",
                  b.status === "pending" && "bg-yellow-500/10 text-yellow-600",
                  b.status === "completed" && "bg-green-500/10 text-green-600",
                  b.status === "no_show" && "bg-red-500/10 text-red-500",
                  b.status === "cancelled" && "bg-muted text-muted-foreground",
                )}>{b.status}</span>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <DetailRow icon={CalendarDays} label="Date" value={
                new Date(b.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                })
              } />
              <DetailRow icon={Clock} label="Time" value={b.time_label || formatHour(b.time)} />
              <DetailRow icon={DollarSign} label="Price" value={`$${b.price}`} />
              <DetailRow icon={Tag} label="Type" value={
                b.training_type === "personal" ? "Personal (1:1)" :
                b.training_type === "group" ? "Group" :
                b.training_type === "small_group" ? "Small Group" :
                "Session"
              } />
              {b.is_group && (
                <DetailRow icon={Users} label="Group" value="Yes" />
              )}
            </div>

            {/* Actions */}
            {b.status === "pending" && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1 rounded-xl h-10"
                  onClick={async () => {
                    const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", b.id);
                    if (error) { toast.error("Failed to confirm"); return; }
                    toast.success("Booking confirmed!");
                    setSelectedBooking(null);
                    onRefresh();
                  }}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-xl h-10 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={async () => {
                    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", b.id);
                    if (error) { toast.error("Failed to cancel"); return; }
                    toast.success("Booking rejected");
                    setSelectedBooking(null);
                    onRefresh();
                  }}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View toggle + navigation */}
      <div className="rounded-2xl border border-border/30 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Calendar</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToday}
              className="text-[10px] font-semibold text-primary px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setView(view === "week" ? "month" : "week")}
              className="text-[10px] font-semibold text-muted-foreground px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {view === "week" ? "Month" : "Week"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setOffset(o => o - 1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-xs font-semibold text-foreground">{weekLabel}</span>
          <button onClick={() => setOffset(o => o + 1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {view === "week" ? renderWeekView() : renderMonthView()}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/15 border border-primary/20" /> Confirmed
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm bg-yellow-500/15 border border-yellow-500/20" /> Pending
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm bg-green-500/15 border border-green-500/20" /> Completed
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm bg-destructive/10 border border-destructive/20" /> Blocked
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/[0.04] border border-border/20" /> Available
        </div>
      </div>

      {/* Booking detail modal */}
      {renderBookingDetail()}
    </div>
  );
};

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-[9px] text-muted-foreground">{label}</p>
        <p className="text-xs font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default CalendarTab;
