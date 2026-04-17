import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useHomeData } from "@/hooks/use-home-data";
import BrandLoader from "@/components/BrandLoader";
import PullToRefresh from "@/components/PullToRefresh";
import { Search, Zap, Plus, Play, Radio } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = ["Explore all", "HIIT", "Yoga", "Strength", "Padel", "Tennis"];

const HomePage = () => {
  const { data, loading, refetch } = useHomeData();
  const [activeCategory, setActiveCategory] = useState("Explore all");

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const stories = useMemo(() => (data?.topCoaches || []).slice(0, 8), [data]);
  const featured = useMemo(() => (data?.featuredCoaches || data?.topCoaches || [])[0], [data]);
  const trending = useMemo(() => (data?.trendingCoaches || data?.topCoaches || []).slice(0, 6), [data]);

  if (loading) return <BrandLoader />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-1">Couldn't load content</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Something went wrong. Pull down to refresh.
        </p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <div className="w-full pt-5 pb-28 overflow-x-hidden">
        {/* ═══════ STORIES STRIP ═══════ */}
        <section className="px-6 mb-8 overflow-x-auto scrollbar-hide flex gap-5 py-2">
          {/* YOU */}
          <Link to="/create" className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="relative p-[3px] rounded-full bg-gradient-kinetic">
              <div className="bg-background rounded-full p-[2px]">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-background bg-card flex items-center justify-center">
                  <Plus className="h-5 w-5 text-[#46f1c5]" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#46f1c5] rounded-full border-2 border-background flex items-center justify-center">
                <Plus className="h-3 w-3 text-background" strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-black tracking-widest text-foreground uppercase">You</span>
          </Link>

          {stories.map((c) => (
            <Link key={c.id} to={`/coach/${c.id}`} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="p-[3px] rounded-full bg-gradient-kinetic">
                <div className="bg-background rounded-full p-[2px]">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-background bg-card">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.coach_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-kinetic flex items-center justify-center text-background font-black">
                        {c.coach_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase truncate max-w-[64px]">
                {c.coach_name?.split(" ")[0]}
              </span>
            </Link>
          ))}
        </section>

        {/* ═══════ CATEGORY CHIPS ═══════ */}
        <section className="px-6 mb-8 overflow-x-auto scrollbar-hide flex gap-3">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-none px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${
                  active
                    ? "bg-gradient-kinetic text-white shadow-[0_8px_24px_rgba(0,212,170,0.25)]"
                    : "bg-card border border-border/40 text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </section>

        {/* ═══════ FEATURED COACH CARD ═══════ */}
        {featured && (
          <section className="px-6 mb-10">
            <Link
              to={`/coach/${featured.id}`}
              className="block relative rounded-lg overflow-hidden aspect-[16/9] mb-4 bg-card group"
            >
              {featured.image_url ? (
                <img
                  src={featured.image_url}
                  alt={featured.coach_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-gradient-kinetic opacity-80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

              <div className="absolute top-4 right-4 px-3 py-1 rounded-full glass-dark border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#46f1c5] animate-pulse" />
                <span className="text-[10px] font-black text-white tracking-wider uppercase">Live now</span>
              </div>

              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#46f1c5] overflow-hidden bg-card">
                  {featured.image_url && (
                    <img src={featured.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-black tracking-wide text-white uppercase italic">
                    {featured.coach_name}
                  </p>
                  <p className="text-[9px] text-white/70 uppercase tracking-widest">
                    {featured.sport} · Live Session
                  </p>
                </div>
              </div>
            </Link>

            <div className="flex justify-between items-start">
              <div className="max-w-[70%]">
                <h3 className="text-xl font-black text-foreground italic tracking-tighter leading-none mb-1 uppercase">
                  {featured.sport} Mastery
                </h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Push your limits with {featured.coach_name} — join the session and level up your game.
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-[#46f1c5] italic">45'</span>
                <span className="text-[8px] font-bold text-muted-foreground tracking-widest uppercase">Minutes</span>
              </div>
            </div>
          </section>
        )}

        {/* ═══════ BENTO GRID ═══════ */}
        <section className="px-6 grid grid-cols-2 gap-4 mb-10">
          {trending.slice(0, 4).map((c, i) => {
            const accent = i % 2 === 0 ? "#ffb59a" : "#46f1c5";
            return (
              <Link
                key={c.id}
                to={`/coach/${c.id}`}
                className="relative rounded-lg overflow-hidden aspect-square bg-card border border-border/40 group"
              >
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.coach_name}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-kinetic opacity-30" />
                )}
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-full glass-dark flex items-center justify-center border border-white/10">
                    <Play className="h-3.5 w-3.5 text-white" fill="currentColor" strokeWidth={0} />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: accent }}>
                      {c.sport || "Training"}
                    </span>
                    <h4 className="text-sm font-black text-white italic leading-tight uppercase mt-1">
                      {c.coach_name?.split(" ")[0]}
                      <br />
                      Session
                    </h4>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {/* ═══════ QUICK ACCESS GRID ═══════ */}
        <section className="px-6 grid grid-cols-2 gap-3">
          <Link to="/discover" className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40 active:scale-[0.97] transition-transform">
            <div className="h-10 w-10 rounded-lg bg-[#46f1c5]/10 flex items-center justify-center">
              <Search className="h-5 w-5 text-[#46f1c5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Find Coach</p>
              <p className="text-[10px] text-muted-foreground">{data.totalCoaches}+ coaches</p>
            </div>
          </Link>
          <Link to="/reels" className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40 active:scale-[0.97] transition-transform">
            <div className="h-10 w-10 rounded-lg bg-[#ffb59a]/10 flex items-center justify-center">
              <Radio className="h-5 w-5 text-[#ffb59a]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Reels</p>
              <p className="text-[10px] text-muted-foreground">Watch & learn</p>
            </div>
          </Link>
        </section>
      </div>

      {/* Kinetic FAB */}
      <Link
        to="/create"
        aria-label="Quick create"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-kinetic shadow-[0_20px_40px_rgba(0,212,170,0.25)] active:scale-90 transition-transform"
      >
        <Zap className="h-6 w-6 text-white" fill="currentColor" strokeWidth={0} />
      </Link>
    </PullToRefresh>
  );
};

export default HomePage;
