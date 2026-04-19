import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, MapPin, Dumbbell, Activity, Video } from "lucide-react";
import { PhoneFrame, StatusBar, TabBar, RoundButton } from "@/components/v2/shared";
import { useCalendarEvents } from "@/hooks/v2/useMocks";
import type { CalendarEvent } from "@/types/v2";
import { useRole } from "@/contexts/v2/RoleContext";
import { cn } from "@/lib/utils";

type View = "month" | "week" | "list";
const VIEW_KEY = "circlo:v2_calendar_view";

const TYPE_DOT: Record<CalendarEvent["type"], string> = {
  session: "bg-teal",
  workout: "bg-orange",
  "plan-item": "bg-teal-dim",
  blocked: "bg-v2-muted",
  live: "bg-danger",
};

function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

function MonthView({ events, onDay, anchor }: { events: CalendarEvent[]; onDay: (d: Date) => void; anchor: Date }) {
  const first = startOfMonth(anchor);
  const startDay = (first.getDay() + 6) % 7; // Mon-first
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Date[] = [];
  for (let i = 0; i < startDay; i++) {
    const d = new Date(first);
    d.setDate(d.getDate() - (startDay - i));
    cells.push(d);
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const d = new Date(cells[cells.length - 1]);
    d.setDate(d.getDate() + 1);
    cells.push(d);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="px-4">
      <div className="grid grid-cols-7 mb-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-[10px] font-bold text-v2-muted tracking-wider text-center py-1.5 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const isToday = d.getTime() === today.getTime();
          const dayEvents = events.filter((e) => new Date(e.startsAt).toDateString() === d.toDateString());
          return (
            <button
              key={i}
              onClick={() => onDay(d)}
              className={cn(
                "aspect-square flex flex-col items-center justify-start py-1.5 rounded-md transition-colors",
                isToday && "border border-teal",
                !inMonth && "opacity-30",
                "hover:bg-navy-card"
              )}
            >
              <div className={cn("text-[12px] font-semibold tnum", isToday && "text-teal")}>{d.getDate()}</div>
              <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                {dayEvents.slice(0, 4).map((e) => (
                  <span key={e.id} className={cn("w-1 h-1 rounded-full", TYPE_DOT[e.type])} />
                ))}
                {dayEvents.length > 4 && <span className="text-[8px] text-v2-muted">+{dayEvents.length - 4}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const hours = Array.from({ length: 17 }).map((_, i) => i + 6); // 06..22

  return (
    <div className="px-4">
      <div className="grid grid-cols-7 mb-2">
        {days.map((d) => (
          <div key={d.toString()} className="text-center">
            <div className="text-[10px] text-v2-muted font-bold uppercase tracking-wider">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i(d)]}</div>
            <div className={cn("text-[14px] font-bold tnum", d.toDateString() === today.toDateString() && "text-teal")}>{d.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="relative h-[520px] overflow-y-auto rounded-md bg-navy-card">
        {hours.map((h) => (
          <div key={h} className="flex border-b border-navy-line">
            <div className="w-12 text-[10px] text-v2-muted py-1.5 px-1 tnum">{h.toString().padStart(2, "0")}:00</div>
            <div className="flex-1 border-l border-navy-line h-8 relative">
              {events
                .filter((e) => {
                  const d = new Date(e.startsAt);
                  return days.some((day) => day.toDateString() === d.toDateString()) && d.getHours() === h;
                })
                .map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-[10px] text-white truncate",
                      e.type === "session" && "bg-teal text-navy-deep",
                      e.type === "workout" && "bg-orange",
                      e.type === "plan-item" && "bg-teal-dim text-teal",
                      e.type === "live" && "bg-danger"
                    )}
                  >
                    {e.title}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function i(d: Date) { return (d.getDay() + 6) % 7; }

function ListView({ events, onDay }: { events: CalendarEvent[]; onDay: (d: Date) => void }) {
  const groups: Record<string, CalendarEvent[]> = {};
  const today = new Date();
  events
    .slice()
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .forEach((e) => {
      const d = new Date(e.startsAt);
      const diff = Math.floor((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      const key = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff < 7 ? "This week" : diff < 14 ? "Next week" : "Later";
      groups[key] = groups[key] ?? [];
      groups[key].push(e);
    });

  const ICON: Record<CalendarEvent["type"], typeof MapPin> = {
    session: MapPin,
    workout: Dumbbell,
    "plan-item": Activity,
    blocked: ChevronRight,
    live: Video,
  };

  return (
    <div className="px-5 flex flex-col gap-4">
      {(["Today", "Tomorrow", "This week", "Next week", "Later"] as const).map((label) =>
        groups[label] ? (
          <div key={label}>
            <div className="text-[10px] text-v2-muted font-bold tracking-widest uppercase mb-2">{label.toUpperCase()}</div>
            <div className="flex flex-col gap-2">
              {groups[label].map((e) => {
                const d = new Date(e.startsAt);
                const Icon = ICON[e.type];
                return (
                  <button
                    key={e.id}
                    onClick={() => onDay(d)}
                    className="p-3 rounded-[14px] bg-navy-card flex gap-3 items-center text-left"
                  >
                    <div className="text-center w-12 shrink-0">
                      <div className="text-[10px] text-v2-muted font-bold tracking-wider">
                        {d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                      </div>
                      <div className="text-[18px] font-extrabold tracking-tight tnum">{d.getDate()}</div>
                    </div>
                    <div className="w-px h-8 bg-navy-line" />
                    <div className={cn("w-9 h-9 rounded-md flex items-center justify-center shrink-0", e.type === "session" ? "bg-teal-dim text-teal" : e.type === "workout" ? "bg-orange-dim text-orange" : e.type === "live" ? "bg-danger/20 text-danger" : "bg-navy-card-2 text-v2-muted")}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">{e.title}</div>
                      <div className="text-[11px] text-v2-muted mt-0.5 tnum">
                        {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {e.location ? ` · ${e.location}` : ""}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-v2-muted" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null
      )}
      {Object.keys(groups).length === 0 && (
        <div className="text-center py-12 text-v2-muted text-[13px]">Nothing scheduled.</div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { isCoach } = useRole();
  const initial = (typeof window !== "undefined" ? (localStorage.getItem(VIEW_KEY) as View | null) : null) ?? (isCoach ? "week" : "month");
  const [view, setView] = useState<View>(initial);
  const [anchor, setAnchor] = useState(new Date());
  const range = useMemo(() => ({ s: startOfMonth(anchor), e: endOfMonth(anchor) }), [anchor]);
  const { data: events = [] } = useCalendarEvents(range.s, range.e);

  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, view); } catch { /* noop */ }
  }, [view]);

  const stepMonth = (delta: number) => {
    const d = new Date(anchor);
    d.setMonth(d.getMonth() + delta);
    setAnchor(d);
  };

  const goDay = (d: Date) => {
    const iso = d.toISOString().slice(0, 10);
    navigate(`/v2/calendar/${iso}`);
  };

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <header className="px-5 pt-3 flex justify-between items-center">
        <h1 className="text-[26px] font-extrabold tracking-tight">Calendar</h1>
        <RoundButton ariaLabel="Add" variant="solid-navy" size="sm" onClick={() => navigate("/v2/calendar/add-workout")}>
          <Plus size={16} strokeWidth={2.5} />
        </RoundButton>
      </header>

      <div className="flex bg-navy-card rounded-[14px] p-1 mx-5 mt-4 mb-3.5">
        {(["month", "week", "list"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "flex-1 py-2.5 rounded-[10px] text-[13px] font-bold capitalize",
              view === v ? "bg-navy-card-2 text-offwhite" : "text-v2-muted"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "month" && (
        <>
          <div className="flex items-center justify-between px-5 pb-3">
            <button onClick={() => stepMonth(-1)} className="w-8 h-8 rounded-md bg-navy-card text-offwhite"><ChevronLeft size={14} /></button>
            <h3 className="text-[16px] font-bold">{anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <button onClick={() => stepMonth(1)} className="w-8 h-8 rounded-md bg-navy-card text-offwhite"><ChevronRight size={14} /></button>
          </div>
          <MonthView events={events} onDay={goDay} anchor={anchor} />
        </>
      )}
      {view === "week" && <WeekView events={events} />}
      {view === "list" && <ListView events={events} onDay={goDay} />}

      <button
        onClick={() => navigate("/v2/calendar/add-workout")}
        aria-label="Quick add"
        className="fixed bottom-[100px] right-5 z-40 w-14 h-14 rounded-full bg-orange text-white shadow-2xl flex items-center justify-center"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <TabBar mode={isCoach ? "coach" : "player"} active={isCoach ? "dashboard" : "book"} />
    </PhoneFrame>
  );
}
