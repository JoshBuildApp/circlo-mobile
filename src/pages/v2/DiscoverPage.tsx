import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, MapPin, Mic, SlidersHorizontal, TrendingUp, Sparkles } from "lucide-react";
import {
  PhoneFrame,
  StatusBar,
  TabBar,
  HScroll,
  SectionHeader,
  Avatar,
  Chip,
} from "@/components/v2/shared";
import { useCoaches } from "@/hooks/v2/useMocks";
import { formatPrice } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";

const SPORTS: { key: string; label: string; emoji: string; tone: "teal" | "orange" | "dark" }[] = [
  { key: "padel", label: "Padel", emoji: "🎾", tone: "teal" },
  { key: "boxing", label: "Boxing", emoji: "🥊", tone: "orange" },
  { key: "strength", label: "Strength", emoji: "💪", tone: "dark" },
  { key: "yoga", label: "Yoga", emoji: "🧘", tone: "dark" },
  { key: "running", label: "Running", emoji: "🏃", tone: "dark" },
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { data: coaches = [] } = useCoaches();
  const [tab, setTab] = useState<"coaches" | "communities">("coaches");

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <header className="px-5 pt-1.5">
        <h1 className="text-[30px] font-extrabold tracking-tight">Discover</h1>
      </header>

      <div className="flex bg-navy-card rounded-[14px] p-1 mx-5 mt-3 mb-4">
        {(["coaches", "communities"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 rounded-[10px] capitalize text-[13px] font-bold transition-colors",
              tab === t ? "bg-navy-card-2 text-offwhite" : "text-v2-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mx-5 px-4 py-3 rounded-[14px] bg-navy-card flex items-center gap-2.5 text-v2-muted">
        <Search size={16} />
        <input
          placeholder="Search coaches, sports, clubs..."
          className="flex-1 bg-transparent border-none text-offwhite text-sm outline-none placeholder:text-v2-muted"
        />
        <Mic size={16} />
      </div>

      <HScroll className="mt-3.5 px-5">
        <button className="px-3.5 py-2 rounded-full text-[13px] font-semibold bg-teal text-navy-deep whitespace-nowrap">● Padel</button>
        <button className="px-3.5 py-2 rounded-full text-[13px] font-semibold bg-navy-card text-offwhite whitespace-nowrap flex items-center gap-1.5"><MapPin size={12} /> Tel Aviv</button>
        <button className="px-3.5 py-2 rounded-full text-[13px] font-semibold bg-navy-card text-offwhite whitespace-nowrap">{formatPrice(0).replace(/0$/, "")} Price</button>
        <button className="px-3.5 py-2 rounded-full text-[13px] font-semibold bg-navy-card text-offwhite whitespace-nowrap"><SlidersHorizontal size={12} /></button>
      </HScroll>

      <SectionHeader title={<span className="text-[13px] text-v2-muted font-bold tracking-wider uppercase">Browse by sport</span>} className="mt-5 mb-2" />
      <HScroll>
        {SPORTS.map((s) => (
          <div
            key={s.key}
            className={cn(
              "min-w-[88px] h-[88px] rounded-[16px] p-3 flex flex-col justify-between font-bold text-[13px]",
              s.tone === "teal" && "bg-teal text-navy-deep",
              s.tone === "orange" && "bg-orange text-white",
              s.tone === "dark" && "bg-navy-card text-offwhite"
            )}
          >
            <span className="text-2xl">{s.emoji}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </HScroll>

      <SectionHeader
        title={<span className="flex items-center gap-1.5"><MapPin size={16} className="text-teal" /> Near you now</span>}
        action="Map"
      />
      <HScroll>
        {coaches.slice(0, 3).map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/v2/coach/${c.id}`)}
            className={cn(
              "min-w-[180px] h-[140px] rounded-card p-3.5 flex flex-col justify-between text-left",
              c.avatarGradient === "orange-peach" ? "bg-orange text-white" : "bg-teal text-navy-deep"
            )}
          >
            <div className="flex justify-between text-[11px] font-bold">
              <span className="bg-black/30 text-white px-2 py-0.5 rounded-full">→ {c.nearKm ?? "1.0"} km</span>
              {c.rating && <span className="bg-black/30 text-white px-2 py-0.5 rounded-full tnum">{c.rating}★</span>}
            </div>
            <div>
              <div className="font-bold text-[15px]">{c.firstName} {c.name.split(" ").slice(-1)[0][0]}.</div>
              <div className="text-[11px] opacity-80">{c.city} · from {formatPrice(c.priceFromILS)}</div>
            </div>
          </button>
        ))}
      </HScroll>

      <SectionHeader title={<span className="flex items-center gap-1.5"><TrendingUp size={16} /> Trending this week</span>} action="See all" />
      <div className="px-5 flex flex-col gap-2">
        {coaches.slice(0, 3).map((c, i) => (
          <button
            key={c.id}
            onClick={() => navigate(`/v2/coach/${c.id}`)}
            className="flex items-center gap-3 px-4 py-3 bg-navy-card rounded-[16px] text-left"
          >
            <div className="text-[22px] font-extrabold text-v2-muted min-w-[22px] tnum">{i + 1}</div>
            <Avatar size={40} gradient={c.avatarGradient} />
            <div className="flex-1">
              <div className="text-[14px] font-bold">{c.name}</div>
              <div className="text-[12px] text-v2-muted">{c.sports[0]} · {c.sessionsThisWeek ?? 0} sessions</div>
            </div>
            <div className="text-teal text-[12px] font-bold tnum">↑ {Math.round((c.sessionsThisWeek ?? 0) * 1.5)}%</div>
          </button>
        ))}
      </div>

      <SectionHeader title={<span className="flex items-center gap-1.5"><Sparkles size={16} /> New on Circlo</span>} action="See all" />
      <HScroll>
        {coaches.filter((c) => c.badges.includes("new")).slice(0, 3).map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/v2/coach/${c.id}`)}
            className="min-w-[155px] h-[170px] rounded-card p-3.5 bg-navy-card flex flex-col justify-between relative text-left"
          >
            <span className="absolute top-2.5 right-2.5 bg-navy-card-2 text-offwhite px-2.5 py-1 rounded-full text-[10px] font-bold">3d new</span>
            <div />
            <div>
              <h4 className="font-bold text-[14px]">{c.name}</h4>
              <p className="text-[12px] text-v2-muted mt-0.5">{c.sports[0]} · {c.tagline.split(" · ")[1] ?? "New"}</p>
            </div>
          </button>
        ))}
      </HScroll>

      <SectionHeader title="Communities" action="All" />
      <HScroll className="pb-2">
        <button
          onClick={() => navigate(`/v2/coach/maya/community`)}
          className="min-w-[220px] rounded-card p-4 bg-teal text-navy-deep flex flex-col gap-2.5 text-left"
        >
          <Chip className="!bg-black/20 !text-navy-deep">24 ACTIVE</Chip>
          <div>
            <div className="font-bold text-[15px]">Tel Aviv Padel</div>
            <div className="text-[11px] opacity-80 mt-0.5">1,240 · 32 new today</div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex">
              <span className="w-5 h-5 rounded-full border border-teal" style={{ background: "#ff9d6c", marginRight: -4 }} />
              <span className="w-5 h-5 rounded-full border border-teal" style={{ background: "#ffd97a", marginRight: -4 }} />
              <span className="w-5 h-5 rounded-full border border-teal" style={{ background: "#3dd9b1" }} />
            </div>
            <span className="bg-black/25 text-navy-deep px-3.5 py-1.5 rounded-full text-[12px] font-bold">Join</span>
          </div>
        </button>
        <button className="min-w-[220px] rounded-card p-4 bg-orange text-white flex flex-col gap-2.5 text-left">
          <Chip className="!bg-black/30 !text-white">🔒 PRO ONLY</Chip>
          <div>
            <div className="font-bold text-[15px]">Pro Fight Club</div>
            <div className="text-[11px] opacity-85 mt-0.5">340 · verified only</div>
          </div>
        </button>
      </HScroll>

      <TabBar mode="player" active="discover" />
    </PhoneFrame>
  );
}
