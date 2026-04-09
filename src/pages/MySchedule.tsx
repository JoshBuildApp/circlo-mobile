import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, User, Users,
  Download, ExternalLink, X, Plus, Star, Search, Zap, ArrowRight,
  Briefcase, UserCircle, Trash2, CheckCircle2, Flame, Timer,
  TrendingUp, MapPin, Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  addMonths, subMonths, startOfWeek, endOfWeek, isToday, isSameMonth,
  parseISO, addDays, subDays, addWeeks, subWeeks, differenceInMinutes,
  differenceInHours, isBefore, isAfter,
} from "date-fns";
import { useTrainingSessions, SESSION_TYPES, type TrainingSession } from "@/hooks/use-training-sessions";
import { formatHour } from "@/hooks/use-availability";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Booking {
  id: string;
  coach_id: string;
  coach_name: string;
  date: string;
  time: string;
  time_label: string;
  status: string;
  price: number;
  payment_method?: string;
}

interface CoachOption {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  rating: number | null;
}

type Sheet = "none" | "day-actions" | "pick-coach" | "detail" | "create-session";
type ScheduleMode = "coach" | "personal";
type ViewMode = "day" | "week" | "month";

const TYPE_ICONS: Record<string, React.ElementType> = {
  personal: User,
  small_group: Users,
  group: Users,
};

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6;
  return { value: `${h.toString().padStart(2, "0")}:00`, label: formatHour(`${h.toString().padStart(2, "0")}:00`) };
});

const DAY_TIMELINE_HOURS = Array.from({ length: 15 }, (_, i) => i + 6);

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  confirmed: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", dot: "bg-teal-400" },
  upcoming: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", dot: "bg-teal-400" },
  pending: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-400" },
  pending_payment: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-400" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
  open: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", dot: "bg-teal-400" },
  full: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
};

const getStatusStyle = (status: string) => STATUS_STYLES[status] || STATUS_STYLES.pending;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const MySchedule = () => {
  const { user, role, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isCoach = role === "coach" || isAdmin;

  const [mode, setMode] = useState<ScheduleMode>(isCoach ? "coach" : "personal");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [sheet, setSheet] = useState<Sheet>("none");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Personal mode state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [lastCoach, setLastCoach] = useState<CoachOption | null>(null);
  const [followedCoaches, setFollowedCoaches] = useState<CoachOption[]>([]);
  const [coachSearch, setCoachSearch] = useState("");
  const [coachesLoading, setCoachesLoading] = useState(false);

  // Coach mode state
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null);
  const [coachPrice, setCoachPrice] = useState(50);
  const [coachBookings, setCoachBookings] = useState<(Booking & { user_name?: string })[]>([]);
  const [loadingCoachData, setLoadingCoachData] = useState(true);

  // Session creation form
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDesc, setSessionDesc] = useState("");
  const [sessionType, setSessionType] = useState("personal");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("09:00");
  const [sessionCapacity, setSessionCapacity] = useState(1);
  const [sessionPrice, setSessionPrice] = useState(50);
  const [savingSession, setSavingSession] = useState(false);

  const { sessions: coachSessions, loading: loadingSessions, refresh: refreshSessions } = useTrainingSessions(coachProfileId || undefined);

  // Load coach profile
  useEffect(() => {
    if (!user || !isCoach) { setLoadingCoachData(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("id, price")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setCoachProfileId(data.id);
        setCoachPrice(data.price || 50);
        setSessionPrice(data.price || 50);
      }
      setLoadingCoachData(false);
    };
    load();
  }, [user, isCoach]);

  // Load coach bookings
  useEffect(() => {
    if (!coachProfileId) return;
    const load = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("coach_id", coachProfileId)
        .order("date", { ascending: true });
      if (data) {
        const userIds = [...new Set(data.map((b: any) => b.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", userIds);
        const profileMap: Record<string, string> = {};
        if (profiles) profiles.forEach((p) => { profileMap[p.user_id] = p.username; });
        setCoachBookings(data.map((b: any) => ({ ...b, user_name: profileMap[b.user_id] || "Unknown" })));
      }
    };
    load();
  }, [coachProfileId]);

  // Load personal bookings
  useEffect(() => {
    if (!user) { setLoadingBookings(false); return; }
    supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .then(({ data }) => {
        setBookings((data || []) as Booking[]);
        setLoadingBookings(false);
      });
  }, [user]);

  // Quick-book coach loading
  const loadCoachOptions = useCallback(async () => {
    if (!user) return;
    setCoachesLoading(true);
    const { data: lastBooking } = await supabase
      .from("bookings")
      .select("coach_id, coach_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    let lastCoachProfile: CoachOption | null = null;
    if (lastBooking && lastBooking.length > 0) {
      const { data: profile } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, rating")
        .eq("id", lastBooking[0].coach_id)
        .maybeSingle();
      if (profile) lastCoachProfile = profile as CoachOption;
    }
    setLastCoach(lastCoachProfile);
    const { data: follows } = await supabase.from("user_follows").select("coach_id").eq("user_id", user.id);
    if (follows && follows.length > 0) {
      const { data: profiles } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, rating")
        .in("id", follows.map((f) => f.coach_id));
      setFollowedCoaches((profiles || []) as CoachOption[]);
    } else {
      setFollowedCoaches([]);
    }
    setCoachesLoading(false);
  }, [user]);

  // Calendar logic
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  }, [weekStart]);

  // Personal: bookings by date
  const personalByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => { (map[b.date] = map[b.date] || []).push(b); });
    return map;
  }, [bookings]);

  // Coach: sessions + bookings by date
  const coachEventsByDate = useMemo(() => {
    const map: Record<string, { sessions: TrainingSession[]; bookings: typeof coachBookings }> = {};
    coachSessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = { sessions: [], bookings: [] };
      map[s.date].sessions.push(s);
    });
    coachBookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = { sessions: [], bookings: [] };
      map[b.date].bookings.push(b);
    });
    return map;
  }, [coachSessions, coachBookings]);

  const getDayEvents = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    if (mode === "coach") {
      const events = coachEventsByDate[key];
      return { count: (events?.sessions.length || 0) + (events?.bookings.length || 0), hasEvents: !!events };
    }
    const b = personalByDate[key];
    return { count: b?.length || 0, hasEvents: !!b };
  };

  const getEventsForDate = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    if (mode === "coach") {
      const events = coachEventsByDate[key];
      const items: { time: string; label: string; title: string; type: "session" | "booking"; data: any }[] = [];
      if (events?.sessions) {
        events.sessions.forEach((s) => items.push({
          time: s.time, label: s.time_label || s.time, title: s.title || "Session",
          type: "session", data: s,
        }));
      }
      if (events?.bookings) {
        events.bookings.forEach((b) => items.push({
          time: b.time, label: b.time_label, title: b.user_name || b.coach_name,
          type: "booking", data: b,
        }));
      }
      return items.sort((a, b) => a.time.localeCompare(b.time));
    }
    const bks = personalByDate[key] || [];
    return bks.map((b) => ({
      time: b.time, label: b.time_label, title: b.coach_name,
      type: "booking" as const, data: b,
    })).sort((a, b) => a.time.localeCompare(b.time));
  };

  const selectedDayKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const selectedPersonalBookings = selectedDayKey ? (personalByDate[selectedDayKey] || []) : [];
  const selectedCoachEvents = selectedDayKey ? coachEventsByDate[selectedDayKey] : null;

  const todayBookings = bookings.filter((b) => {
    try { return isSameDay(parseISO(b.date), new Date()); } catch { return false; }
  });

  // Stats computations
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const allEvents = mode === "coach"
      ? [...coachSessions, ...coachBookings]
      : bookings;

    const thisMonth = allEvents.filter((e) => {
      try {
        const d = parseISO(e.date);
        return d >= monthStart && d <= monthEnd && e.status !== "cancelled";
      } catch { return false; }
    });

    // Next session countdown
    let nextSession: { date: string; time: string; title: string } | null = null;
    const upcoming = allEvents
      .filter((e) => {
        try {
          const d = parseISO(e.date);
          return isAfter(d, subDays(now, 1)) && e.status !== "cancelled";
        } catch { return false; }
      })
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

    if (upcoming.length > 0) {
      const next = upcoming[0];
      nextSession = {
        date: next.date,
        time: next.time,
        title: "coach_name" in next ? (next as any).coach_name || (next as any).title : (next as any).title || "Session",
      };
    }

    // Streak: consecutive days with sessions
    let streak = 0;
    let checkDate = now;
    for (let i = 0; i < 60; i++) {
      const key = format(checkDate, "yyyy-MM-dd");
      const hasEvent = allEvents.some((e) => e.date === key && e.status !== "cancelled");
      if (hasEvent) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else if (i === 0) {
        // Today might not have happened yet, check yesterday
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    let nextCountdown = "";
    if (nextSession) {
      try {
        const sessionDateTime = new Date(`${nextSession.date}T${nextSession.time}`);
        const mins = differenceInMinutes(sessionDateTime, now);
        if (mins < 0) {
          nextCountdown = "Now";
        } else if (mins < 60) {
          nextCountdown = `${mins}m`;
        } else {
          const hrs = differenceInHours(sessionDateTime, now);
          if (hrs < 24) {
            nextCountdown = `${hrs}h`;
          } else {
            nextCountdown = `${Math.floor(hrs / 24)}d`;
          }
        }
      } catch {
        nextCountdown = "--";
      }
    }

    return {
      totalThisMonth: thisMonth.length,
      streak,
      nextCountdown,
      nextTitle: nextSession?.title || null,
    };
  }, [bookings, coachSessions, coachBookings, mode]);

  // Upcoming sessions (after today)
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");

    if (mode === "coach") {
      const items: { time: string; label: string; title: string; date: string; type: "session" | "booking"; data: any }[] = [];
      Object.entries(coachEventsByDate).forEach(([date, events]) => {
        if (date < todayStr) return;
        events.sessions.forEach((s) => items.push({ time: s.time, label: s.time_label || s.time, title: s.title || "Session", date, type: "session", data: s }));
        events.bookings.forEach((b) => items.push({ time: b.time, label: b.time_label, title: b.user_name || b.coach_name, date, type: "booking", data: b }));
      });
      return items
        .filter((i) => i.data.status !== "cancelled")
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .slice(0, 10);
    }

    return bookings
      .filter((b) => b.date >= todayStr && b.status !== "cancelled")
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 10)
      .map((b) => ({
        time: b.time, label: b.time_label, title: b.coach_name,
        date: b.date, type: "booking" as const, data: b,
      }));
  }, [bookings, coachEventsByDate, mode]);

  // Session creation
  const handleCreateSession = async () => {
    if (!sessionTitle.trim() || !sessionDate) {
      toast.error("Please fill in title and date");
      return;
    }
    if (!coachProfileId) return;
    setSavingSession(true);
    const { error } = await supabase.from("training_sessions").insert({
      coach_id: coachProfileId,
      title: sessionTitle.trim(),
      description: sessionDesc.trim(),
      session_type: sessionType,
      date: sessionDate,
      time: sessionTime,
      time_label: formatHour(sessionTime),
      max_capacity: sessionCapacity,
      price: sessionPrice,
      status: "open",
    } as any);
    setSavingSession(false);
    if (error) {
      toast.error("Failed to create session: " + error.message);
    } else {
      toast.success("Session created!");
      setSheet("none");
      resetSessionForm();
      refreshSessions();
    }
  };

  const resetSessionForm = () => {
    setSessionTitle(""); setSessionDesc(""); setSessionType("personal");
    setSessionDate(""); setSessionTime("09:00");
    setSessionCapacity(1); setSessionPrice(coachPrice);
  };

  const handleSessionTypeChange = (type: string) => {
    setSessionType(type);
    const info = SESSION_TYPES.find((t) => t.value === type);
    if (info) setSessionCapacity(info.capacity);
  };

  const handleCancelSession = async (session: TrainingSession) => {
    await supabase.from("training_sessions").update({ status: "cancelled" } as any).eq("id", session.id);
    toast.success("Session cancelled");
    refreshSessions();
  };

  const handleDeleteSession = async (session: TrainingSession) => {
    await supabase.from("training_sessions").delete().eq("id", session.id);
    toast.success("Session deleted");
    refreshSessions();
  };

  const handleConfirmBooking = async (id: string) => {
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
    toast.success("Booking confirmed");
    if (coachProfileId) {
      const { data } = await supabase.from("bookings").select("*").eq("coach_id", coachProfileId).order("date", { ascending: true });
      if (data) {
        const userIds = [...new Set(data.map((b: any) => b.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, username").in("user_id", userIds);
        const profileMap: Record<string, string> = {};
        if (profiles) profiles.forEach((p) => { profileMap[p.user_id] = p.username; });
        setCoachBookings(data.map((b: any) => ({ ...b, user_name: profileMap[b.user_id] || "Unknown" })));
      }
    }
  };

  const generateICS = (booking: Booking): string => {
    const dateStr = booking.date.replace(/-/g, "");
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Circlo//Training//EN",
      "BEGIN:VEVENT",
      `DTSTART:${dateStr}T${booking.time.replace(/:/g, "")}00`,
      `SUMMARY:Training with ${booking.coach_name}`,
      `DESCRIPTION:${booking.time_label} session - ₪${booking.price}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
  };

  const handleExportICS = (booking: Booking) => {
    const blob = new Blob([generateICS(booking)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training-${booking.coach_name.replace(/\s+/g, "-")}-${booking.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGoogleCalendar = (booking: Booking) => {
    const dateStr = booking.date.replace(/-/g, "");
    const timeStr = booking.time.replace(/:/g, "");
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Training with ${booking.coach_name}`)}&dates=${dateStr}T${timeStr}00/${dateStr}T${timeStr}00&details=${encodeURIComponent(`${booking.time_label} session - ₪${booking.price}`)}`,
      "_blank"
    );
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    if (viewMode === "month") {
      setViewMode("day");
    }
  };

  const openPickCoach = () => {
    setSheet("pick-coach");
    setCoachSearch("");
    loadCoachOptions();
  };

  const handleBookWithCoach = (coach: CoachOption) => {
    setSheet("none");
    navigate(`/coach/${coach.id}`);
  };

  const filteredFollowed = followedCoaches.filter((c) =>
    !coachSearch || c.coach_name.toLowerCase().includes(coachSearch.toLowerCase()) || c.sport.toLowerCase().includes(coachSearch.toLowerCase())
  );

  const isLoading = mode === "coach" ? (loadingCoachData || loadingSessions) : loadingBookings;

  // Navigation helpers
  const navigatePrev = () => {
    if (viewMode === "month") setCurrentMonth(subMonths(currentMonth, 1));
    else if (viewMode === "week") setWeekStart(subWeeks(weekStart, 1));
    else if (viewMode === "day" && selectedDate) setSelectedDate(subDays(selectedDate, 1));
  };

  const navigateNext = () => {
    if (viewMode === "month") setCurrentMonth(addMonths(currentMonth, 1));
    else if (viewMode === "week") setWeekStart(addWeeks(weekStart, 1));
    else if (viewMode === "day" && selectedDate) setSelectedDate(addDays(selectedDate, 1));
  };

  const navigationLabel = () => {
    if (viewMode === "month") return format(currentMonth, "MMMM yyyy");
    if (viewMode === "week") return `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;
    if (viewMode === "day" && selectedDate) return format(selectedDate, "EEEE, MMMM d");
    return "";
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER — Unauthenticated
  // ═══════════════════════════════════════════════════════════
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-[#00D4AA]/20 to-[#FF6B2C]/20 flex items-center justify-center">
            <CalendarDays className="h-12 w-12 text-[#00D4AA]" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#FF6B2C]/20 flex items-center justify-center">
            <Clock className="h-4 w-4 text-[#FF6B2C]" />
          </div>
        </motion.div>
        <div>
          <p className="text-xl font-bold text-foreground">My Schedule</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-[260px]">
            Log in to view your training calendar and upcoming sessions
          </p>
        </div>
        <Link
          to="/login"
          className="h-12 px-8 rounded-2xl bg-gradient-to-r from-[#00D4AA] to-[#00B896] text-white flex items-center justify-center text-sm font-bold active:scale-95 transition-transform shadow-lg shadow-[#00D4AA]/20"
        >
          Log In to Continue
        </Link>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER — Main Schedule
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ─── Header ─── */}
      <div className="px-4 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Schedule</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === "coach" && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setSessionDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
                  setSheet("create-session");
                }}
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00B896] flex items-center justify-center text-white shadow-lg shadow-[#00D4AA]/25"
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            )}
            {mode === "personal" && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={openPickCoach}
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00B896] flex items-center justify-center text-white shadow-lg shadow-[#00D4AA]/25"
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            )}
          </div>
        </div>

        {/* ─── Mode Toggle (Coach) ─── */}
        {isCoach && (
          <div className="flex gap-1 p-1 bg-[#1A1A2E]/60 dark:bg-[#1A1A2E] rounded-2xl mb-4 border border-white/5">
            <button
              onClick={() => setMode("coach")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                mode === "coach"
                  ? "bg-gradient-to-r from-[#00D4AA] to-[#00B896] text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Coach Mode
            </button>
            <button
              onClick={() => setMode("personal")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                mode === "personal"
                  ? "bg-white/10 text-foreground shadow-md backdrop-blur-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCircle className="h-3.5 w-3.5" />
              My Schedule
            </button>
          </div>
        )}

        {/* ─── Stats Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-2 mb-4"
        >
          <div className="bg-[#1A1A2E]/40 dark:bg-[#1A1A2E]/60 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="h-5 w-5 rounded-md bg-[#00D4AA]/15 flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-[#00D4AA]" />
              </div>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">This Month</span>
            </div>
            <p className="text-2xl font-black text-foreground leading-none">{stats.totalThisMonth}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">sessions</p>
          </div>

          <div className="bg-[#1A1A2E]/40 dark:bg-[#1A1A2E]/60 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="h-5 w-5 rounded-md bg-[#FF6B2C]/15 flex items-center justify-center">
                <Flame className="h-3 w-3 text-[#FF6B2C]" />
              </div>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Streak</span>
            </div>
            <p className="text-2xl font-black text-foreground leading-none">{stats.streak}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">days</p>
          </div>

          <div className="bg-[#1A1A2E]/40 dark:bg-[#1A1A2E]/60 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="h-5 w-5 rounded-md bg-purple-500/15 flex items-center justify-center">
                <Timer className="h-3 w-3 text-purple-400" />
              </div>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Next</span>
            </div>
            <p className="text-2xl font-black text-foreground leading-none">
              {stats.nextCountdown || "--"}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{stats.nextTitle || "none"}</p>
          </div>
        </motion.div>

        {/* ─── Calendar Navigation ─── */}
        <div className="flex items-center justify-between mb-2">
          <motion.button whileTap={{ scale: 0.85 }} onClick={navigatePrev} className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground active:bg-white/10 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-foreground">{navigationLabel()}</p>
            <div className="flex gap-0.5 bg-[#1A1A2E]/40 dark:bg-[#1A1A2E] rounded-xl p-0.5 border border-white/5">
              {(["day", "week", "month"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setViewMode(v);
                    if (v === "week" && selectedDate) {
                      setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all capitalize",
                    viewMode === v
                      ? "bg-[#00D4AA] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={navigateNext} className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground active:bg-white/10 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Day headers */}
        {viewMode !== "day" && (
          <div className="grid grid-cols-7 gap-0 mt-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground/60 py-1.5 uppercase tracking-wider">{d}</div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* CALENDAR VIEWS                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="px-4 space-y-3">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-28">
          {/* ═══ MONTH VIEW ═══ */}
          {viewMode === "month" && (
            <div className="px-4 flex-shrink-0">
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const { count } = getDayEvents(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const today = isToday(day);

                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "relative flex flex-col items-center justify-center py-2.5 rounded-xl transition-all",
                        isSelected
                          ? "bg-gradient-to-br from-[#00D4AA] to-[#00B896] text-white shadow-lg shadow-[#00D4AA]/20"
                          : today
                            ? "bg-[#00D4AA]/10 text-[#00D4AA] ring-1 ring-[#00D4AA]/30"
                            : count > 0
                              ? "bg-white/5 text-foreground"
                              : isCurrentMonth
                                ? "text-foreground/70 hover:bg-white/5"
                                : "text-muted-foreground/20"
                      )}
                    >
                      <span className={cn(
                        "text-xs leading-none",
                        (isSelected || today) ? "font-black" : count > 0 ? "font-bold" : "font-medium"
                      )}>
                        {format(day, "d")}
                      </span>
                      {count > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                            <div
                              key={j}
                              className={cn(
                                "h-1 w-1 rounded-full",
                                isSelected ? "bg-white/80" : "bg-[#00D4AA]"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Selected day detail below month */}
              {selectedDate && (() => {
                const events = getEventsForDate(selectedDate);
                return (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                          {isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, MMM d")}
                        </h3>
                        {events.length > 0 && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#00D4AA]/10 text-[#00D4AA]">
                            {events.length} event{events.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setViewMode("day")}
                        className="text-[11px] font-bold text-[#00D4AA] active:opacity-70 flex items-center gap-1"
                      >
                        Full Day <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    {events.length === 0 ? (
                      <EmptyDayState
                        mode={mode}
                        onAction={() => {
                          if (mode === "coach" && selectedDate) {
                            setSessionDate(format(selectedDate, "yyyy-MM-dd"));
                            setSheet("create-session");
                          } else {
                            openPickCoach();
                          }
                        }}
                      />
                    ) : (
                      <div className="space-y-2">
                        {events.slice(0, 3).map((ev, j) => (
                          <SessionCard key={j} event={ev} index={j} mode={mode} onTap={() => {
                            if (ev.type !== "session" && mode === "personal") {
                              setSelectedBooking(ev.data);
                              setSheet("detail");
                            }
                          }} onConfirm={handleConfirmBooking} onCancel={handleCancelSession} onDelete={handleDeleteSession} />
                        ))}
                        {events.length > 3 && (
                          <button onClick={() => setViewMode("day")} className="w-full text-center text-xs text-[#00D4AA] font-bold py-2 active:opacity-70">
                            +{events.length - 3} more sessions
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ═══ WEEK VIEW ═══ */}
          {viewMode === "week" && (
            <div className="px-3">
              {/* Week grid */}
              <div className="grid grid-cols-7 gap-1.5 mb-5">
                {weekDays.map((day) => {
                  const { count } = getDayEvents(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const today = isToday(day);

                  return (
                    <motion.button
                      key={day.toISOString()}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "flex flex-col items-center rounded-2xl py-3 transition-all relative",
                        isSelected
                          ? "bg-gradient-to-b from-[#00D4AA] to-[#00B896] text-white shadow-lg shadow-[#00D4AA]/25"
                          : today
                            ? "bg-[#00D4AA]/10 text-foreground"
                            : "bg-[#1A1A2E]/30 dark:bg-[#1A1A2E]/50 text-foreground border border-white/5"
                      )}
                    >
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider mb-1",
                        isSelected ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {format(day, "EEE")}
                      </span>
                      <span className={cn(
                        "text-lg font-black leading-none",
                        isSelected ? "text-white" : today ? "text-[#00D4AA]" : ""
                      )}>
                        {format(day, "d")}
                      </span>
                      {count > 0 && (
                        <div className="flex gap-0.5 mt-1.5">
                          {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                            <div key={j} className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-white/70" : "bg-[#00D4AA]")} />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Today's Sessions */}
              {selectedDate && (() => {
                const events = getEventsForDate(selectedDate);
                const today = isToday(selectedDate);

                return (
                  <div className="px-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-foreground">
                          {today ? "Today's Sessions" : format(selectedDate, "EEEE")}
                        </h2>
                        {events.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D4AA]/10 text-[#00D4AA]">
                            {events.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setViewMode("day")}
                        className="text-[11px] font-bold text-[#00D4AA] active:opacity-70 flex items-center gap-1"
                      >
                        Timeline <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    {events.length === 0 ? (
                      <EmptyDayState
                        mode={mode}
                        onAction={() => {
                          if (mode === "coach" && selectedDate) {
                            setSessionDate(format(selectedDate, "yyyy-MM-dd"));
                            setSheet("create-session");
                          } else {
                            openPickCoach();
                          }
                        }}
                      />
                    ) : (
                      <AnimatePresence mode="popLayout">
                        <div className="space-y-3">
                          {events.map((ev, j) => (
                            <SessionCard
                              key={`${ev.time}-${j}`}
                              event={ev}
                              index={j}
                              mode={mode}
                              large
                              onTap={() => {
                                if (ev.type !== "session" && mode === "personal") {
                                  setSelectedBooking(ev.data);
                                  setSheet("detail");
                                }
                              }}
                              onConfirm={handleConfirmBooking}
                              onCancel={handleCancelSession}
                              onDelete={handleDeleteSession}
                            />
                          ))}
                        </div>
                      </AnimatePresence>
                    )}

                    {/* Upcoming Sessions */}
                    {upcomingSessions.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Upcoming</h3>
                        <div className="space-y-2">
                          {upcomingSessions
                            .filter((s) => !(selectedDate && s.date === format(selectedDate, "yyyy-MM-dd")))
                            .slice(0, 5)
                            .map((ev, j) => (
                              <UpcomingCard
                                key={`${ev.date}-${ev.time}-${j}`}
                                event={ev}
                                index={j}
                                onTap={() => {
                                  if (ev.type !== "session" && mode === "personal") {
                                    setSelectedBooking(ev.data);
                                    setSheet("detail");
                                  }
                                }}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ═══ DAY VIEW (TIMELINE) ═══ */}
          {viewMode === "day" && selectedDate && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">
                    {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE, MMM d")}
                  </p>
                  {(() => {
                    const count = getEventsForDate(selectedDate).length;
                    return count > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D4AA]/10 text-[#00D4AA]">
                        {count} session{count !== 1 ? "s" : ""}
                      </span>
                    ) : null;
                  })()}
                </div>
                {mode === "coach" ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSessionDate(format(selectedDate, "yyyy-MM-dd"));
                      setSheet("create-session");
                    }}
                    className="flex items-center gap-1.5 text-[#00D4AA] text-xs font-bold bg-[#00D4AA]/10 px-3 py-1.5 rounded-xl"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Session
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={openPickCoach}
                    className="flex items-center gap-1.5 text-[#00D4AA] text-xs font-bold bg-[#00D4AA]/10 px-3 py-1.5 rounded-xl"
                  >
                    <Plus className="h-3.5 w-3.5" /> Book
                  </motion.button>
                )}
              </div>

              {/* Timeline */}
              <div className="relative">
                {DAY_TIMELINE_HOURS.map((hour) => {
                  const timeStr = `${hour.toString().padStart(2, "0")}:00`;
                  const events = getEventsForDate(selectedDate).filter((e) => {
                    const eventHour = parseInt(e.time.split(":")[0]);
                    return eventHour === hour;
                  });

                  return (
                    <div key={hour} className="flex gap-4 min-h-[60px] group">
                      {/* Time label */}
                      <div className="w-14 flex-shrink-0 text-right pt-0.5">
                        <span className="text-[11px] font-bold text-muted-foreground/50">
                          {formatHour(timeStr)}
                        </span>
                      </div>

                      {/* Timeline + events */}
                      <div className="flex-1 border-l-2 border-white/5 pl-4 pb-2 relative">
                        {/* Current time indicator */}
                        {isToday(selectedDate) && new Date().getHours() === hour && (
                          <div className="absolute -left-[5px] top-2 flex items-center gap-0 z-10 w-full">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-red-500/60 to-transparent" />
                          </div>
                        )}

                        {events.length === 0 ? (
                          <div className="h-full min-h-[44px]" />
                        ) : (
                          <div className="space-y-2 py-1">
                            {events.map((ev, j) => (
                              <SessionCard
                                key={j}
                                event={ev}
                                index={j}
                                mode={mode}
                                onTap={() => {
                                  if (ev.type !== "session" && mode === "personal") {
                                    setSelectedBooking(ev.data);
                                    setSheet("detail");
                                  }
                                }}
                                onConfirm={handleConfirmBooking}
                                onCancel={handleCancelSession}
                                onDelete={handleDeleteSession}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty state for day */}
              {getEventsForDate(selectedDate).length === 0 && (
                <EmptyDayState
                  mode={mode}
                  onAction={() => {
                    if (mode === "coach" && selectedDate) {
                      setSessionDate(format(selectedDate, "yyyy-MM-dd"));
                      setSheet("create-session");
                    } else {
                      openPickCoach();
                    }
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* SHEETS / MODALS                                     */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* Create Session Sheet (Coach) */}
      {sheet === "create-session" && (
        <SheetBackdrop onClose={() => { setSheet("none"); resetSessionForm(); }}>
          <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-4" />
          <div className="flex items-center justify-between mb-5">
            <p className="text-lg font-black text-foreground">New Training Session</p>
            <button onClick={() => { setSheet("none"); resetSessionForm(); }} className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {SESSION_TYPES.map((t) => {
                const Icon = TYPE_ICONS[t.value];
                const active = sessionType === t.value;
                return (
                  <motion.button
                    key={t.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSessionTypeChange(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all",
                      active
                        ? "bg-[#00D4AA]/10 border-[#00D4AA]/30 text-[#00D4AA]"
                        : "bg-[#1A1A2E]/40 border-white/5 text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold">{t.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <Input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Session title" className="rounded-xl h-12 bg-[#1A1A2E]/40 border-white/5 text-foreground placeholder:text-muted-foreground/50" />
            <Input value={sessionDesc} onChange={(e) => setSessionDesc(e.target.value)} placeholder="Description (optional)" className="rounded-xl h-12 bg-[#1A1A2E]/40 border-white/5 text-foreground placeholder:text-muted-foreground/50" />

            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="rounded-xl h-12 bg-[#1A1A2E]/40 border-white/5" />
              <Select value={sessionTime} onValueChange={setSessionTime}>
                <SelectTrigger className="h-12 rounded-xl bg-[#1A1A2E]/40 border-white/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold mb-1.5 block uppercase tracking-wider">Max Capacity</label>
                <Input type="number" value={sessionCapacity} onChange={(e) => setSessionCapacity(Math.max(1, parseInt(e.target.value) || 1))} min={1} className="rounded-xl h-12 bg-[#1A1A2E]/40 border-white/5" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold mb-1.5 block uppercase tracking-wider">Price (₪)</label>
                <Input type="number" value={sessionPrice} onChange={(e) => setSessionPrice(parseInt(e.target.value) || 0)} min={0} className="rounded-xl h-12 bg-[#1A1A2E]/40 border-white/5" />
              </div>
            </div>

            <Button onClick={handleCreateSession} disabled={savingSession} className="w-full rounded-2xl h-13 text-sm font-bold bg-gradient-to-r from-[#00D4AA] to-[#00B896] border-0 text-white shadow-lg shadow-[#00D4AA]/20 hover:shadow-[#00D4AA]/30">
              {savingSession ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </SheetBackdrop>
      )}

      {/* Pick Coach Sheet (Personal) */}
      {sheet === "pick-coach" && (
        <SheetBackdrop onClose={() => setSheet("none")}>
          <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-4" />
          <div className="flex items-center justify-between mb-5">
            <p className="text-lg font-black text-foreground">Choose a Coach</p>
            <button onClick={() => setSheet("none")} className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {coachesLoading ? (
            <div className="space-y-3 py-4"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {lastCoach && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Train again</p>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBookWithCoach(lastCoach)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#00D4AA]/10 to-[#00D4AA]/5 border border-[#00D4AA]/20 text-left"
                  >
                    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-[#1A1A2E] flex-shrink-0">
                      {lastCoach.image_url ? <img src={lastCoach.image_url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} /> : null}
                      <div className={`h-full w-full flex items-center justify-center text-lg font-black text-[#00D4AA] bg-[#00D4AA]/10 ${lastCoach.image_url ? 'hidden' : ''}`}>{lastCoach.coach_name.charAt(0).toUpperCase()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{lastCoach.coach_name}</p>
                      <p className="text-xs text-muted-foreground">{lastCoach.sport}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#00D4AA] to-[#00B896] text-white rounded-xl px-4 py-2 flex-shrink-0 shadow-lg shadow-[#00D4AA]/20">
                      <Zap className="h-3.5 w-3.5" /><span className="text-xs font-bold">Book</span>
                    </div>
                  </motion.button>
                </div>
              )}
              {followedCoaches.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Following</p>
                  {followedCoaches.length > 3 && (
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input type="text" value={coachSearch} onChange={(e) => setCoachSearch(e.target.value)} placeholder="Search coaches..." className="w-full h-10 rounded-xl bg-[#1A1A2E]/60 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 border border-white/5 outline-none focus:ring-1 focus:ring-[#00D4AA]/30" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {filteredFollowed.map((coach) => (
                      <motion.button
                        key={coach.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBookWithCoach(coach)}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#1A1A2E]/30 border border-white/5 text-left"
                      >
                        <div className="h-11 w-11 rounded-xl overflow-hidden bg-[#1A1A2E] flex-shrink-0">
                          {coach.image_url ? <img src={coach.image_url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} /> : null}
                          <div className={`h-full w-full flex items-center justify-center text-xs font-bold text-[#00D4AA] bg-[#00D4AA]/10 ${coach.image_url ? 'hidden' : ''}`}>{coach.coach_name.charAt(0).toUpperCase()}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{coach.coach_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">{coach.sport}</span>
                            {coach.rating && (<><span className="text-muted-foreground/30">·</span><Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" /><span className="text-[11px] text-muted-foreground">{coach.rating}</span></>)}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {!lastCoach && followedCoaches.length === 0 && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-[#1A1A2E]/60 flex items-center justify-center"><Search className="h-7 w-7 text-muted-foreground" /></div>
                  <div className="text-center">
                    <p className="text-base font-bold text-foreground">Discover coaches</p>
                    <p className="text-xs text-muted-foreground mt-1">Find the right coach for you</p>
                  </div>
                  <button onClick={() => { setSheet("none"); navigate("/discover"); }} className="h-11 px-7 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00B896] text-white text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-[#00D4AA]/20">
                    <Search className="h-3.5 w-3.5" /> Browse Coaches
                  </button>
                </div>
              )}
              {(lastCoach || followedCoaches.length > 0) && (
                <button onClick={() => { setSheet("none"); navigate("/discover"); }} className="w-full flex items-center justify-center gap-2 py-3 text-[#00D4AA] text-xs font-bold active:opacity-70">
                  <Search className="h-3.5 w-3.5" /> Discover more coaches
                </button>
              )}
            </div>
          )}
        </SheetBackdrop>
      )}

      {/* Session Detail Sheet (Personal) */}
      {sheet === "detail" && selectedBooking && (
        <SheetBackdrop onClose={() => { setSheet("none"); setSelectedBooking(null); }}>
          <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-4" />
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-foreground">Session Details</h2>
            <button onClick={() => { setSheet("none"); setSelectedBooking(null); }} className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#00D4AA]/20 to-[#00D4AA]/5 flex items-center justify-center">
                <User className="h-7 w-7 text-[#00D4AA]" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{selectedBooking.coach_name}</p>
                <Link to={`/coach/${selectedBooking.coach_id}`} className="text-xs text-[#00D4AA] font-semibold">View profile</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Date", value: selectedBooking.date },
                { label: "Time", value: selectedBooking.time_label },
                { label: "Price", value: `₪${selectedBooking.price}` },
                { label: "Status", value: selectedBooking.status, isStatus: true },
              ].map((item) => {
                const style = item.isStatus ? getStatusStyle(selectedBooking.status) : null;
                return (
                  <div key={item.label} className="bg-[#1A1A2E]/40 rounded-2xl p-3.5 border border-white/5">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mb-1.5">{item.label}</p>
                    <p className={cn("text-sm font-bold capitalize", style ? style.text : "text-foreground")}>
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2.5 pt-1">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Add to Calendar</p>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleGoogleCalendar(selectedBooking)}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#1A1A2E]/60 border border-white/5 text-sm font-semibold text-foreground"
                >
                  <ExternalLink className="h-4 w-4" /> Google
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExportICS(selectedBooking)}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#1A1A2E]/60 border border-white/5 text-sm font-semibold text-foreground"
                >
                  <Download className="h-4 w-4" /> Export .ics
                </motion.button>
              </div>
            </div>
          </div>
        </SheetBackdrop>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════

interface SessionCardProps {
  event: { time: string; label: string; title: string; type: "session" | "booking"; data: any };
  index: number;
  mode: ScheduleMode;
  large?: boolean;
  onTap: () => void;
  onConfirm?: (id: string) => void;
  onCancel?: (session: TrainingSession) => void;
  onDelete?: (session: TrainingSession) => void;
}

const SessionCard = ({ event: ev, index, mode, large, onTap, onConfirm, onCancel, onDelete }: SessionCardProps) => {
  const isSession = ev.type === "session";
  const status = ev.data?.status || "pending";
  const isCancelled = status === "cancelled";
  const style = getStatusStyle(status);
  const Icon = isSession ? (TYPE_ICONS[ev.data?.session_type] || CalendarDays) : User;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onClick={onTap}
      className={cn(
        "rounded-2xl border overflow-hidden transition-all",
        isCancelled ? "opacity-40" : "",
        ev.type !== "session" && mode === "personal" ? "cursor-pointer" : "",
        large ? "p-0" : "p-0"
      )}
      style={{
        background: "linear-gradient(135deg, rgba(26,26,46,0.6) 0%, rgba(26,26,46,0.3) 100%)",
        borderColor: "rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex">
        {/* Gradient accent bar */}
        <div className={cn(
          "w-1 flex-shrink-0",
          status === "confirmed" || status === "upcoming" || status === "open" ? "bg-gradient-to-b from-[#00D4AA] to-[#00B896]" :
          status === "pending" || status === "pending_payment" ? "bg-gradient-to-b from-[#FF6B2C] to-orange-600" :
          status === "cancelled" ? "bg-gradient-to-b from-red-500 to-red-600" :
          "bg-gradient-to-b from-[#00D4AA] to-[#00B896]"
        )} />

        <div className={cn("flex-1 p-3.5", large ? "p-4" : "")}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex-shrink-0 rounded-xl flex items-center justify-center",
              large ? "h-12 w-12" : "h-9 w-9",
              isSession ? "bg-[#00D4AA]/10 text-[#00D4AA]" : "bg-[#FF6B2C]/10 text-[#FF6B2C]"
            )}>
              <Icon className={cn(large ? "h-5 w-5" : "h-4 w-4")} />
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-bold text-foreground truncate",
                large ? "text-sm" : "text-xs",
                isCancelled ? "line-through" : ""
              )}>
                {ev.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("font-semibold", large ? "text-xs" : "text-[10px]", "text-muted-foreground")}>
                  {ev.label}
                </span>
                {ev.data?.price != null && (
                  <span className={cn("font-black text-[#00D4AA]", large ? "text-xs" : "text-[10px]")}>
                    ₪{ev.data.price}
                  </span>
                )}
              </div>
            </div>

            {/* Status badge */}
            {status && !isCancelled && (
              <span className={cn(
                "text-[9px] font-bold px-2.5 py-1 rounded-lg capitalize flex items-center gap-1",
                style.bg, style.text
              )}>
                <div className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                {status === "pending_payment" ? "Awaiting" : status}
              </span>
            )}
            {isCancelled && (
              <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400">
                Cancelled
              </span>
            )}

            {/* Coach actions */}
            {mode === "coach" && !isSession && status !== "confirmed" && status !== "cancelled" && onConfirm && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onConfirm(ev.data.id); }}
                className="h-8 px-3 rounded-xl bg-[#00D4AA]/15 text-[#00D4AA] text-[10px] font-bold flex items-center gap-1 flex-shrink-0"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
              </motion.button>
            )}
            {mode === "coach" && isSession && !isCancelled && (
              <div className="flex gap-1 flex-shrink-0">
                {onCancel && (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); onCancel(ev.data); }}
                    className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                )}
                {onDelete && (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); onDelete(ev.data); }}
                    className="h-8 w-8 rounded-xl bg-red-500/8 flex items-center justify-center text-red-400/60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Capacity bar */}
          {isSession && ev.data?.max_capacity > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (ev.data.current_bookings / ev.data.max_capacity) * 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={cn(
                    "h-full rounded-full",
                    ev.data.current_bookings >= ev.data.max_capacity
                      ? "bg-gradient-to-r from-red-500 to-red-400"
                      : "bg-gradient-to-r from-[#00D4AA] to-[#00B896]"
                  )}
                />
              </div>
              <span className="text-[9px] text-muted-foreground font-bold">
                {ev.data.current_bookings}/{ev.data.max_capacity}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface UpcomingCardProps {
  event: { time: string; label: string; title: string; date: string; type: "session" | "booking"; data: any };
  index: number;
  onTap: () => void;
}

const UpcomingCard = ({ event: ev, index, onTap }: UpcomingCardProps) => {
  const status = ev.data?.status || "pending";
  const style = getStatusStyle(status);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onClick={onTap}
      className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1A2E]/30 border border-white/5 cursor-pointer active:bg-white/5 transition-colors"
    >
      {/* Date block */}
      <div className="flex-shrink-0 w-12 text-center">
        <p className="text-[9px] font-bold text-muted-foreground uppercase">
          {format(parseISO(ev.date), "EEE")}
        </p>
        <p className="text-lg font-black text-foreground leading-none mt-0.5">
          {format(parseISO(ev.date), "d")}
        </p>
      </div>

      {/* Divider */}
      <div className={cn("w-0.5 h-8 rounded-full", style.dot)} />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{ev.title}</p>
        <p className="text-[10px] text-muted-foreground">{ev.label}</p>
      </div>

      {/* Price */}
      {ev.data?.price != null && (
        <span className="text-[10px] font-black text-[#00D4AA]">₪{ev.data.price}</span>
      )}
    </motion.div>
  );
};

const EmptyDayState = ({ mode, onAction }: { mode: ScheduleMode; onAction: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="flex flex-col items-center py-10 gap-4"
  >
    <div className="relative">
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#1A1A2E]/80 to-[#1A1A2E]/40 flex items-center justify-center border border-white/5">
        <CalendarDays className="h-9 w-9 text-muted-foreground/30" />
      </div>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute -top-2 -right-2 h-8 w-8 rounded-xl bg-gradient-to-br from-[#00D4AA]/20 to-[#00D4AA]/5 flex items-center justify-center border border-[#00D4AA]/20"
      >
        <Plus className="h-4 w-4 text-[#00D4AA]" />
      </motion.div>
    </div>
    <div className="text-center">
      <p className="text-base font-bold text-foreground">No sessions scheduled</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
        {mode === "coach" ? "Create a training session for this day" : "Book a session with your favorite coach"}
      </p>
    </div>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onAction}
      className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00B896] text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#00D4AA]/20"
    >
      {mode === "coach" ? (
        <><Plus className="h-4 w-4" /> Create Session</>
      ) : (
        <><Search className="h-4 w-4" /> Book a Session</>
      )}
    </motion.button>
  </motion.div>
);

const SheetBackdrop = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-5 pb-10 border-t border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

export default MySchedule;
