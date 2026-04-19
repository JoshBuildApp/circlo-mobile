import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Calendar as CalIcon, Plus } from "lucide-react";
import { PhoneFrame, StatusBar, TabBar, RoundButton, Avatar, Chip } from "@/components/v2/shared";
import { useMySessions } from "@/hooks/v2/useMocks";
import { cn } from "@/lib/utils";
import type { Session } from "@/types/v2";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
] as const;
type Tab = typeof TABS[number]["key"];

function dateBlock(d: Date) {
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    monthDay: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    timeRange: `${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
  };
}

function SessionCard({ s, onChat }: { s: Session; onChat: () => void }) {
  const blk = dateBlock(new Date(s.startsAt));
  const blkEnd = dateBlock(new Date(s.endsAt));
  const accent = s.status === "confirmed" ? "border-l-teal" : s.status === "pending" ? "border-l-orange" : "border-l-v2-muted";
  return (
    <div className={cn("p-4 rounded-[16px] bg-navy-card border-l-[3px]", accent)}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center">
          <Avatar size={44} gradient="teal-gold" />
          <div>
            <div className="text-[15px] font-bold">{s.coachName}</div>
            <div className="text-[11px] text-v2-muted mt-0.5">
              {s.format === "one-on-one" ? "1-on-1" : s.format === "group" ? "Group" : "Video review"} · {s.durationMin} min
            </div>
          </div>
        </div>
        <Chip variant={s.status === "confirmed" ? "teal" : s.status === "pending" ? "orange" : "default"} className="text-[10px]">
          {s.status === "confirmed" ? "✓ Confirmed" : s.status === "pending" ? "⏳ Pending" : s.status}
        </Chip>
      </div>
      <div className="p-3 rounded-[10px] bg-navy-card-2 flex gap-3.5 mb-2.5">
        <div>
          <div className={cn("text-[10px] font-bold tracking-wider", s.status === "pending" ? "text-orange" : "text-teal")}>{blk.weekday}</div>
          <div className="text-[18px] font-extrabold tracking-tight tnum">{blk.monthDay}</div>
          <div className="text-[11px] text-v2-muted mt-0.5 tnum">{blk.timeRange} → {blkEnd.timeRange}</div>
        </div>
        <div className="w-px bg-navy-line" />
        <div className="flex-1">
          <div className="text-[10px] text-v2-muted font-bold tracking-wider">LOCATION</div>
          <div className="text-[13px] font-semibold mt-0.5">{s.location}</div>
          <div className="text-[11px] text-v2-muted mt-0.5">{s.locationSubline}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <button onClick={onChat} className="py-2.5 rounded-md bg-navy-card-2 text-offwhite text-[12px] font-semibold">Message</button>
        <button className="py-2.5 rounded-md bg-navy-card-2 text-offwhite text-[12px] font-semibold">Directions</button>
        <button className="py-2.5 rounded-md bg-navy-card-2 text-v2-muted text-[12px] font-semibold">Cancel</button>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const { data: sessions = [] } = useMySessions(tab);

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <header className="px-5 pt-2.5 flex justify-between items-center">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/profile")}>
          <ChevronLeft size={14} />
        </RoundButton>
        <h3 className="text-[17px] font-bold">My bookings</h3>
        <RoundButton ariaLabel="Calendar" variant="solid-navy" size="sm" onClick={() => navigate("/v2/calendar")}>
          <CalIcon size={14} />
        </RoundButton>
      </header>

      <div className="flex bg-navy-card rounded-[14px] p-1 mx-5 mt-4 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2.5 rounded-[10px] text-[13px] font-bold",
              tab === t.key ? "bg-navy-card-2 text-offwhite" : "text-v2-muted"
            )}
          >
            {t.label}
            {t.key === "upcoming" && sessions.length > 0 && tab === "upcoming" && (
              <span className="bg-teal text-navy-deep text-[10px] px-1.5 rounded-full ml-1.5 tnum">{sessions.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">{tab.toUpperCase()}</div>
      <div className="px-5 flex flex-col gap-2.5">
        {sessions.length === 0 && (
          <div className="text-center text-v2-muted text-[13px] py-12">
            {tab === "upcoming" ? "No upcoming sessions. Book one →" : `No ${tab} sessions.`}
          </div>
        )}
        {sessions.map((s) => (
          <SessionCard key={s.id} s={s} onChat={() => navigate(`/v2/messages/th-${s.coachId}`)} />
        ))}
      </div>

      <div className="px-5 mt-5">
        <button
          onClick={() => navigate("/v2/discover")}
          className="w-full py-3.5 rounded-[14px] bg-teal text-navy-deep font-bold text-[14px] flex items-center justify-center gap-1.5"
        >
          <Plus size={16} strokeWidth={2.5} />
          Book another session
        </button>
      </div>

      <TabBar mode="player" active="calendar" />
    </PhoneFrame>
  );
}
