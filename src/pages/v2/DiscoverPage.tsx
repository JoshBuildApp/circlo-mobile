import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, MapPin, Mic, SlidersHorizontal, TrendingUp, Sparkles, Users, Lock } from "lucide-react";
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
import { formatPrice, formatCompactNumber } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/native/useNative";

const SPORTS: { key: string; label: string; emoji: string; tone: "teal" | "orange" | "dark" }[] = [
  { key: "padel", label: "Padel", emoji: "🎾", tone: "teal" },
  { key: "boxing", label: "Boxing", emoji: "🥊", tone: "orange" },
  { key: "strength", label: "Strength", emoji: "💪", tone: "dark" },
  { key: "yoga", label: "Yoga", emoji: "🧘", tone: "dark" },
  { key: "running", label: "Running", emoji: "🏃", tone: "dark" },
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"coaches" | "communities">("coaches");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSport, setActiveSport] = useState<string | null>("padel");
  const { data: coaches = [] } = useCoaches({
    query: searchQuery,
    sport: activeSport as never,
  });
  const { tap } = useHaptics();

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
            onClick={() => { tap("light"); setTab(t); }}
            className={cn(
              "flex-1 py-2.5 rounded-[10px] capitalize text-[13px] font-bold transition-colors min-h-[44px]",
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search coaches, sports, clubs..."
          className="flex-1 bg-transparent border-none text-offwhite text-sm outline-none placeholder:text-v2-muted"
        />
        {searchQuery && (
          <button
            onClick={() => { tap("light"); setSearchQuery(""); }}
            aria-label="Clear search"
            className="text-v2-muted text-xs min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
          >
            ✕
          </button>
        )}
        <Mic size={16} />
      </div>

      {/* Filter chips. Location/price/more filters are intentionally disabled
          until the backend supports them — shown greyed out so the UI doesn't
          promise what it can't deliver. */}
      <HScroll className="mt-3.5 px-5">
        <button
          onClick={() => { tap("light"); setActiveSport(activeSport === "padel" ? null : "padel"); }}
          className={cn(
            "px-3.5 py-2 min-h-[44px] rounded-full text-[13px] font-semibold whitespace-nowrap",
            activeSport === "padel" ? "bg-teal text-navy-deep" : "bg-navy-card text-offwhite"
          )}
        >
          ● Padel
        </button>
        <button disabled aria-disabled className="px-3.5 py-2 min-h-[44px] rounded-full text-[13px] font-semibold bg-navy-card text-v2-muted-2 whitespace-nowrap flex items-center gap-1.5 opacity-50 cursor-not-allowed"><MapPin size={12} /> Tel Aviv</button>
        <button disabled aria-disabled className="px-3.5 py-2 min-h-[44px] rounded-full text-[13px] font-semibold bg-navy-card text-v2-muted-2 whitespace-nowrap opacity-50 cursor-not-allowed">Price</button>
        <button disabled aria-disabled aria-label="More filters (coming soon)" className="px-3.5 py-2 min-h-[44px] rounded-full text-[13px] font-semibold bg-navy-card text-v2-muted-2 whitespace-nowrap opacity-50 cursor-not-allowed"><SlidersHorizontal size={12} /></button>
      </HScroll>

      {tab === "coaches" ? (
        <>
      <SectionHeader title={<span className="text-[13px] text-v2-muted font-bold tracking-wider uppercase">Browse by sport</span>} className="mt-5 mb-2" />
      <HScroll>
        {SPORTS.map((s) => {
          const selected = activeSport === s.key;
          return (
            <button
              key={s.key}
              onClick={() => { tap("light"); setActiveSport(selected ? null : s.key); }}
              className={cn(
                "min-w-[88px] h-[88px] rounded-[16px] p-3 flex flex-col justify-between font-bold text-[13px] text-left transition-transform active:scale-95",
                selected ? "ring-2 ring-offwhite" : "",
                s.tone === "teal" && "bg-teal text-navy-deep",
                s.tone === "orange" && "bg-orange text-white",
                s.tone === "dark" && "bg-navy-card text-offwhite"
              )}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </HScroll>

      <SectionHeader
        title={<span className="flex items-center gap-1.5"><MapPin size={16} className="text-teal" /> Near you now</span>}
        action="Map"
      />
      <HScroll>
        {coaches.slice(0, 3).map((c) => (
          <button
            key={c.id}
            onClick={() => { tap("light"); navigate(`/v2/coach/${c.id}`); }}
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
            onClick={() => { tap("light"); navigate(`/v2/coach/${c.id}`); }}
            className="flex items-center gap-3 px-4 py-3 bg-navy-card rounded-[16px] text-left min-h-[64px]"
          >
            <div className="text-[22px] font-extrabold text-v2-muted min-w-[22px] tnum">{i + 1}</div>
            <Avatar size={40} src={c.avatarUrl} alt={c.name} gradient={c.avatarGradient} />
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
            onClick={() => { tap("light"); navigate(`/v2/coach/${c.id}`); }}
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
          onClick={() => { tap("light"); navigate(`/v2/coach/maya/community`); }}
          className="min-w-[220px] rounded-card p-4 bg-teal text-navy-deep flex flex-col gap-2.5 text-left"
        >
          <Chip className="!bg-black/20 !text-navy-deep">24 ACTIVE</Chip>
          <div>
            <div className="font-bold text-[15px]">Tel Aviv Padel</div>
            <div className="text-[11px] opacity-80 mt-0.5">1,240 · 32 new today</div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex">
              <span className="w-5 h-5 rounded-full border border-teal v2-avatar-warm" style={{ marginRight: -4 }} />
              <span className="w-5 h-5 rounded-full border border-teal v2-avatar-gold" style={{ marginRight: -4 }} />
              <span className="w-5 h-5 rounded-full border border-teal v2-avatar-mint" />
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
        </>
      ) : (
        <CommunitiesView coaches={coaches} navigate={navigate} />
      )}

      <TabBar mode="player" active="discover" />
    </PhoneFrame>
  );
}

interface CommunitiesViewProps {
  coaches: ReturnType<typeof useCoaches>["data"];
  navigate: ReturnType<typeof useNavigate>;
}

const FEATURED_COMMUNITIES = [
  { id: "tlv-padel", name: "Tel Aviv Padel", members: 1240, online: 24, sport: "Padel", tone: "teal", isPro: false, joined: false, activity: "32 new posts today" },
  { id: "pro-fight", name: "Pro Fight Club", members: 340, online: 12, sport: "Boxing", tone: "orange", isPro: true, joined: false, activity: "Verified coaches only" },
  { id: "yoga-anywhere", name: "Yoga Anywhere", members: 880, online: 18, sport: "Yoga", tone: "teal", isPro: false, joined: true, activity: "Daily morning flow" },
  { id: "marathon-il", name: "Marathon Israel", members: 2100, online: 41, sport: "Running", tone: "orange", isPro: false, joined: true, activity: "Sunday long-run group" },
  { id: "strength-tel-aviv", name: "Strength TLV", members: 560, online: 8, sport: "Strength", tone: "teal", isPro: false, joined: false, activity: "PR boards updated weekly" },
];

function CommunitiesView({ coaches, navigate }: CommunitiesViewProps) {
  const myCoach = coaches[0];
  return (
    <>
      <SectionHeader title={<span className="text-[13px] text-v2-muted font-bold tracking-wider uppercase">Your circles</span>} className="mt-5 mb-2" />
      <div className="px-5 flex flex-col gap-2 mb-2">
        {myCoach && (
          <button
            onClick={() => { tap("light"); navigate(`/v2/coach/${myCoach.id}/community`); }}
            className="p-3.5 min-h-[64px] rounded-[14px] bg-navy-card flex gap-3 items-center text-left"
          >
            <Avatar size={40} gradient={myCoach.avatarGradient} />
            <div className="flex-1">
              <div className="text-[14px] font-bold flex items-center gap-1.5">
                {myCoach.firstName}'s {myCoach.sports[0]} Circle
                <Chip variant="teal" className="text-[9px] !px-1.5 !py-0.5">MEMBER</Chip>
              </div>
              <div className="text-[11px] text-v2-muted mt-0.5 tnum">
                {myCoach.followerCount?.toLocaleString() ?? 0} members · 12 new this week
              </div>
            </div>
            <span className="text-[12px] text-teal font-bold">Open →</span>
          </button>
        )}
        <button
          onClick={() => { tap("light"); navigate("/v2/coach/maya/community"); }}
          className="p-3.5 min-h-[64px] rounded-[14px] bg-navy-card flex gap-3 items-center text-left"
        >
          <Avatar size={40} gradient="orange-peach" />
          <div className="flex-1">
            <div className="text-[14px] font-bold">Tel Aviv Padel</div>
            <div className="text-[11px] text-v2-muted mt-0.5">Follower · 1,240 members</div>
          </div>
          <span className="text-[12px] text-v2-muted font-bold">Open →</span>
        </button>
      </div>

      <SectionHeader
        title={<span className="flex items-center gap-1.5"><Users size={16} className="text-teal" /> Trending circles</span>}
        action="See all"
      />
      <HScroll>
        {FEATURED_COMMUNITIES.map((c) => (
          <button
            key={c.id}
            onClick={() => { tap("light"); navigate(`/v2/coach/${myCoach?.id ?? "maya"}/community`); }}
            className={cn(
              "min-w-[220px] rounded-card p-4 flex flex-col gap-2.5 text-left",
              c.tone === "teal" && "bg-teal text-navy-deep",
              c.tone === "orange" && "bg-orange text-white"
            )}
          >
            <Chip className={cn(c.tone === "teal" ? "!bg-black/20 !text-navy-deep" : "!bg-black/30 !text-white")} leadingDot>
              {c.isPro ? "PRO ONLY" : `${c.online} ONLINE`}
            </Chip>
            <div>
              <div className="font-bold text-[15px]">{c.name}</div>
              <div className="text-[11px] opacity-80 mt-0.5 tnum">
                {formatCompactNumber(c.members)} · {c.activity}
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] opacity-80">{c.sport}</span>
              {c.isPro ? (
                <Lock size={14} className="opacity-80" />
              ) : (
                <span className={cn("px-3 py-1 rounded-full text-[11px] font-bold", c.tone === "teal" ? "bg-black/25 text-navy-deep" : "bg-black/30 text-white")}>
                  {c.joined ? "Joined ✓" : "Join"}
                </span>
              )}
            </div>
          </button>
        ))}
      </HScroll>

      <SectionHeader
        title={<span className="text-[13px] text-v2-muted font-bold tracking-wider uppercase">By sport</span>}
        className="mt-5 mb-2"
      />
      <HScroll>
        {SPORTS.map((s) => (
          <button
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
          </button>
        ))}
      </HScroll>

      <SectionHeader
        title={<span className="flex items-center gap-1.5"><Sparkles size={16} className="text-teal" /> Newly opened</span>}
      />
      <div className="px-5 flex flex-col gap-2 pb-4">
        {FEATURED_COMMUNITIES.slice(2).map((c) => (
          <button
            key={c.id + "-row"}
            onClick={() => { tap("light"); navigate(`/v2/coach/${myCoach?.id ?? "maya"}/community`); }}
            className="p-3.5 min-h-[64px] rounded-[14px] bg-navy-card flex gap-3 items-center text-left"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-[12px] flex items-center justify-center text-lg shrink-0",
                c.tone === "teal" ? "bg-teal text-navy-deep" : "bg-orange text-white"
              )}
            >
              {c.sport[0]}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold">{c.name}</div>
              <div className="text-[11px] text-v2-muted mt-0.5 tnum">
                {formatCompactNumber(c.members)} members · {c.online} online
              </div>
            </div>
            {c.joined ? (
              <Chip variant="teal" className="text-[10px]">JOINED</Chip>
            ) : (
              <span className="text-[12px] text-teal font-bold">Join</span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
