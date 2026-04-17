import { useState, useMemo } from "react";
import { Search, Users, Plus, Sparkles, Flame, MapPin } from "lucide-react";
import { useCommunity } from "@/hooks/use-community";
import type { CommunityInfo } from "@/hooks/use-community";
import { CommunityEmptyState } from "@/components/CommunityEmptyState";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const SPORTS = [
  "All",
  "Padel",
  "Tennis",
  "Fitness",
  "Boxing",
  "Soccer",
  "Basketball",
  "Yoga",
  "Swimming",
  "Running",
  "MMA",
  "CrossFit",
  "Martial Arts",
];

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

/* ─── Hero banner (featured / first community) ─────────────────────────── */
const CommunityHero = ({
  community,
  memberPreviews,
  totalMembers,
  onJoin,
}: {
  community: CommunityInfo;
  memberPreviews: string[];
  totalMembers: number;
  onJoin: () => void;
}) => (
  <section className="relative h-[360px] md:h-[420px] w-full overflow-hidden">
    {community.image ? (
      <img
        src={community.image}
        alt={community.coachName}
        className="absolute inset-0 h-full w-full object-cover"
      />
    ) : (
      <div className="absolute inset-0 bg-gradient-kinetic opacity-80" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

    <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full glass-dark border border-white/10">
        {community.isVerified && <Sparkles className="h-3 w-3 text-[#46f1c5]" />}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#46f1c5]">
          {community.isVerified ? "Pro Community" : "Featured"}
        </span>
      </div>

      <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-white mb-4">
        {community.coachName}
      </h1>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={onJoin}
          className="bg-gradient-kinetic text-white font-black uppercase tracking-[0.15em] px-7 py-3 rounded-md text-xs shadow-[0_10px_30px_rgba(0,212,170,0.35)] active:scale-95 transition-transform"
        >
          Join Club
        </button>

        <div className="flex -space-x-3">
          {memberPreviews.slice(0, 3).map((src, i) =>
            src ? (
              <img
                key={i}
                src={src}
                alt=""
                className="h-8 w-8 rounded-full border-2 border-background object-cover"
              />
            ) : (
              <div
                key={i}
                className="h-8 w-8 rounded-full border-2 border-background bg-secondary"
              />
            )
          )}
          {totalMembers > 3 && (
            <div className="h-8 w-8 rounded-full border-2 border-background bg-card flex items-center justify-center text-[10px] font-black text-[#46f1c5]">
              +{fmt(totalMembers - 3)}
            </div>
          )}
        </div>
      </div>
    </div>
  </section>
);

/* ─── Bento mini community card (for stats row) ───────────────────────── */
const BentoCommunityCard = ({
  community,
  onClick,
  accent,
}: {
  community: CommunityInfo;
  onClick: () => void;
  accent: "primary" | "secondary";
}) => (
  <button
    onClick={onClick}
    className="relative overflow-hidden rounded-lg border border-border/40 bg-card/80 p-5 aspect-square text-left flex flex-col justify-between active:scale-95 transition-transform"
  >
    <Users
      className={`h-7 w-7 ${accent === "primary" ? "text-[#46f1c5]" : "text-[#ffb59a]"}`}
    />
    <div>
      <div className="text-2xl font-black text-foreground leading-none truncate">
        {community.coachName}
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
        {community.sport} · {fmt(community.memberCount)} members
      </div>
    </div>
  </button>
);

/* ─── Feed-style card for main list ────────────────────────────────────── */
const FeedCommunityCard = ({
  community,
  onClick,
  index,
}: {
  community: CommunityInfo;
  onClick: () => void;
  index: number;
}) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
  >
    <button
      onClick={onClick}
      className="group w-full text-left bg-card border-0 rounded-lg overflow-hidden active:scale-[0.98] transition-transform"
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full border border-[#46f1c5]/30 overflow-hidden bg-secondary">
          {community.image ? (
            <img src={community.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-kinetic" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground truncate">{community.coachName}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {community.sport} · {fmt(community.memberCount)} members
          </p>
        </div>
        {community.isVerified && (
          <div className="h-6 w-6 rounded-full bg-[#46f1c5]/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3 w-3 text-[#46f1c5]" />
          </div>
        )}
      </div>

      {community.tagline && (
        <div className="px-4 pb-4">
          <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">
            {community.tagline}
          </p>
        </div>
      )}

      {/* Image banner */}
      <div className="relative h-48 mx-4 mb-4 rounded-lg overflow-hidden">
        {community.image ? (
          <img
            src={community.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#46f1c5]/20" />
        )}
        <div className="absolute top-3 right-3 glass-dark rounded-full px-3 py-1 flex items-center gap-1">
          <Flame className="h-3 w-3 text-[#ffb59a]" />
          <span className="text-[10px] font-black text-white">Active</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 glass-dark rounded-full px-3 py-1">
            <Users className="h-3 w-3 text-white/80" />
            <span className="text-[10px] font-black uppercase tracking-wider text-white">
              {fmt(community.memberCount)}
            </span>
          </div>
          <div
            className="bg-gradient-kinetic text-white font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full text-[10px] flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Join
          </div>
        </div>
      </div>
    </button>
  </motion.div>
);

const Community = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSport, setActiveSport] = useState("All");
  const { communities, loading } = useCommunity();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!communities) return [];
    return communities.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sport.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSport =
        activeSport === "All" ||
        c.sport.toLowerCase() === activeSport.toLowerCase();
      return matchSearch && matchSport;
    });
  }, [communities, searchQuery, activeSport]);

  const featured = useMemo(
    () => (communities || []).slice(0, 3),
    [communities]
  );

  const hero = featured[0];
  const bentoPair = featured.slice(1, 3);

  const totalMembers = useMemo(
    () => (communities || []).reduce((s, c) => s + (c.memberCount || 0), 0),
    [communities]
  );

  const memberAvatars = useMemo(
    () => (communities || []).map((c) => c.image).filter(Boolean) as string[],
    [communities]
  );

  const hasNone = !loading && (!communities || communities.length === 0);

  return (
    <div className="w-full pb-32 bg-background min-h-screen">
      {hasNone ? (
        <div className="px-4 pt-8">
          <CommunityEmptyState
            title="Be the first to create a community"
            description="No communities yet — start one and bring athletes together around your sport."
            actionLabel="Create Community"
          />
        </div>
      ) : (
        <>
          {/* Hero */}
          {hero && (
            <CommunityHero
              community={hero}
              memberPreviews={memberAvatars}
              totalMembers={totalMembers}
              onJoin={() => navigate(`/community/${hero.coachId}`)}
            />
          )}

          {/* Sticky sport filters */}
          <nav className="sticky top-16 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex gap-6 overflow-x-auto scrollbar-hide">
            {SPORTS.map((sport) => (
              <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className={`flex-shrink-0 text-xs font-black tracking-[0.2em] pb-1 uppercase transition-colors ${
                  activeSport === sport
                    ? "text-[#46f1c5] border-b-2 border-[#46f1c5]"
                    : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                {sport}
              </button>
            ))}
          </nav>

          {/* Search */}
          <div className="px-6 mt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search coaches or sports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-lg bg-card border border-border/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#46f1c5]/30 focus:border-[#46f1c5]/40 transition-all"
              />
            </div>
          </div>

          {/* Bento grid: hero highlight + 2 stat-style featured tiles */}
          {activeSport === "All" && !searchQuery && hero && bentoPair.length > 0 && (
            <div className="px-6 mt-8">
              <div className="grid grid-cols-2 gap-4">
                {/* Wide highlight */}
                <button
                  onClick={() => navigate(`/community/${hero.coachId}`)}
                  className="col-span-2 relative overflow-hidden rounded-lg bg-card p-6 group text-left active:scale-[0.99] transition-transform"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-kinetic opacity-10 blur-3xl group-hover:opacity-20 transition-opacity" />
                  <div className="relative flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black text-[#ffb59a] uppercase tracking-[0.25em] mb-2 block">
                        Next Highlight
                      </span>
                      <h3 className="text-2xl font-bold text-foreground leading-tight">
                        Join {hero.coachName}
                        <br />
                        <span className="text-foreground/70 text-base font-normal">
                          {hero.sport} community
                        </span>
                      </h3>
                    </div>
                    <div className="bg-card/80 border border-border/40 rounded-lg p-3 flex flex-col items-center min-w-[54px]">
                      <span className="text-xs font-black text-[#46f1c5] uppercase">Live</span>
                      <span className="text-xl font-black text-foreground">
                        {fmt(hero.memberCount)}
                      </span>
                    </div>
                  </div>
                  <div className="relative flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{fmt(hero.memberCount)} members</span>
                    </div>
                    {hero.sport && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{hero.sport}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-5 inline-flex h-11 items-center justify-center w-full rounded-md bg-muted/40 text-xs font-black uppercase tracking-[0.2em] text-foreground border border-border/60">
                    Open community
                  </div>
                </button>

                {bentoPair.map((c, i) => (
                  <BentoCommunityCard
                    key={c.coachId}
                    community={c}
                    onClick={() => navigate(`/community/${c.coachId}`)}
                    accent={i === 0 ? "primary" : "secondary"}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feed list */}
          <div className="px-6 mt-10">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">
              {activeSport === "All" ? "Latest communities" : `${activeSport} communities`}
            </h4>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-lg overflow-hidden animate-pulse h-72"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-card/60 rounded-lg border border-border/40">
                <div className="h-12 w-12 rounded-full bg-muted/40 mx-auto mb-3 flex items-center justify-center">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No communities found for "{searchQuery || activeSport}"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((community, i) => (
                  <FeedCommunityCard
                    key={community.coachId}
                    community={community}
                    index={i}
                    onClick={() => navigate(`/community/${community.coachId}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Community;
