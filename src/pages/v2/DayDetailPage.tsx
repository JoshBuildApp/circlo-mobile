import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MapPin, Dumbbell, Activity, Play, MessageSquare, Plus } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton, Avatar } from "@/components/v2/shared";
import { useDayEvents } from "@/hooks/v2/useMocks";
import type { CalendarEvent } from "@/types/v2";
import { cn } from "@/lib/utils";

const ICON: Record<CalendarEvent["type"], typeof MapPin> = {
  session: MapPin,
  workout: Dumbbell,
  "plan-item": Activity,
  blocked: ChevronLeft,
  live: Play,
};

function EventCard({ e, onMessage }: { e: CalendarEvent; onMessage?: () => void }) {
  const Icon = ICON[e.type];
  const accent =
    e.type === "session" ? "border-l-teal" :
    e.type === "workout" ? "border-l-orange" :
    e.type === "plan-item" ? "border-l-teal-dim" :
    e.type === "live" ? "border-l-danger" : "border-l-v2-muted";
  return (
    <div className={cn("p-3.5 rounded-[14px] bg-navy-card border-l-[3px]", accent)}>
      <div className="flex gap-3 items-start">
        {e.type === "session" ? (
          <Avatar size={40} gradient="teal-gold" />
        ) : (
          <div className={cn(
            "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
            e.type === "workout" ? "bg-orange-dim text-orange" : "bg-teal-dim text-teal"
          )}>
            <Icon size={18} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold leading-snug">{e.title}</div>
          <div className="text-[12px] text-v2-muted mt-1 tnum">
            {new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {e.durationMin} min
            {e.location ? ` · ${e.location}` : ""}
          </div>
        </div>
      </div>
      {(e.type === "session" || e.type === "workout" || e.type === "plan-item") && (
        <div className="flex gap-2 mt-3">
          {e.type === "session" && (
            <button onClick={onMessage} className="flex-1 py-2 rounded-md bg-navy-card-2 text-offwhite text-[12px] font-semibold">
              Message
            </button>
          )}
          <button className="flex-1 py-2 rounded-md bg-teal text-navy-deep text-[12px] font-bold">
            {e.type === "session" ? "Directions" : "Start"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DayDetailPage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const dateObj = date ? new Date(date) : new Date();
  const { data: events = [] } = useDayEvents(dateObj);

  const sessions = events.filter((e) => e.type === "session" || e.type === "live");
  const workouts = events.filter((e) => e.type === "workout");
  const planItems = events.filter((e) => e.type === "plan-item");

  return (
    <PhoneFrame className="min-h-[100dvh] pb-32">
      <StatusBar />
      <header className="px-5 pt-2.5 flex items-center justify-between">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/calendar")}>
          <ChevronLeft size={14} />
        </RoundButton>
        <h3 className="text-[17px] font-bold">
          {dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </h3>
        <div className="w-9" />
      </header>

      <main className="px-5 pt-5 pb-32 flex flex-col gap-4">
        {events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-[15px] font-bold mb-2">Nothing planned</div>
            <p className="text-[13px] text-v2-muted mb-5">Book a session or add a workout for this day.</p>
          </div>
        )}

        {sessions.length > 0 && (
          <section>
            <div className="text-[10px] text-v2-muted font-bold tracking-widest uppercase mb-2">SESSIONS</div>
            <div className="flex flex-col gap-2">
              {sessions.map((e) => (
                <EventCard key={e.id} e={e} onMessage={() => navigate(`/v2/messages/th-${e.coachId ?? "maya"}`)} />
              ))}
            </div>
          </section>
        )}

        {workouts.length > 0 && (
          <section>
            <div className="text-[10px] text-v2-muted font-bold tracking-widest uppercase mb-2">WORKOUTS</div>
            <div className="flex flex-col gap-2">
              {workouts.map((e) => (<EventCard key={e.id} e={e} />))}
            </div>
          </section>
        )}

        {planItems.length > 0 && (
          <section>
            <div className="text-[10px] text-v2-muted font-bold tracking-widest uppercase mb-2">TRAINING PLAN</div>
            <div className="flex flex-col gap-2">
              {planItems.map((e) => (<EventCard key={e.id} e={e} />))}
            </div>
          </section>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-5 py-3.5 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom flex gap-2">
        <button
          onClick={() => navigate(`/v2/book/maya?date=${dateObj.toISOString().slice(0,10)}`)}
          className="flex-1 py-3.5 rounded-[14px] bg-teal text-navy-deep font-bold text-[13px] flex items-center justify-center gap-1.5"
        >
          <Plus size={14} strokeWidth={2.5} /> Book a session
        </button>
        <button
          onClick={() => navigate(`/v2/calendar/add-workout?date=${dateObj.toISOString().slice(0,10)}`)}
          className="flex-1 py-3.5 rounded-[14px] bg-transparent border border-orange text-orange font-bold text-[13px] flex items-center justify-center gap-1.5"
        >
          <Dumbbell size={14} strokeWidth={2.5} /> Add workout
        </button>
      </div>
    </PhoneFrame>
  );
}
