import { useCallback, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useHomeData } from "@/hooks/use-home-data";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useAuth } from "@/contexts/AuthContext";
import BrandLoader from "@/components/BrandLoader";
import PullToRefresh from "@/components/PullToRefresh";
import EndOfScroll from "@/components/EndOfScroll";
import { CoachHeartButton } from "@/components/CoachHeartButton";
import {
  Search, Zap, Plus, Play, Calendar, ChevronRight, Sparkles,
  Star, CheckCircle2, MapPin, Clock, TrendingUp, Flame,
} from "lucide-react";
import { motion } from "framer-motion";
import type { HomeCoach } from "@/hooks/use-home-data";

const SPORT_EMOJI: Record<string, string> = {
  padel: "🎾", tennis: "🎾", fitness: "💪", crossfit: "🏋️",
  boxing: "🥊", mma: "🥋", soccer: "⚽", basketball: "🏀",
  yoga: "🧘", swimming: "🏊", running: "🏃", "martial arts": "🤺",
};

const greet = (name?: string) => {
  const h = new Date().getHours();
  const prefix = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${prefix}, ${name}` : prefix;
};

const formatSessionDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSame(d, today)) return "Today";
  if (isSame(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

/* ═══════════════════════════════════════════════════════
   LITTLE RE-USED CARDS
   ═══════════════════════════════════════════════════════ */

const CoachMiniCard = ({ coach }: { coach: HomeCoach }) => (
  <Link
    to={`/coach/${coach.id}`}
    className="relative flex-shrink-0 w-[164px] aspect-[3/4] rounded-2xl overflow-hidden bg-card border border-border/30 group active:scale-[0.98] transition-transform"
  >
    {coach.image_url ? (
      <img
        src={coach.image_url}
        alt={coach.coach_name}
        className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        loading="lazy"
      />
    ) : (
      <div className="absolute inset-0 bg-gradient-kinetic opacity-50" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1">
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ff6b2c] text-white text-[9px] font-black uppercase tracking-wide shadow w-fit">
          {coach.sport}
        </span>
        {coach.rating != null && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold w-fit">
            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
            {coach.rating.toFixed(1)}
          </span>
        )}
      </div>
      <CoachHeartButton coachId={coach.id} coachName={coach.coach_name} size="sm" />
    </div>

    <div className="absolute bottom-0 inset-x-0 p-3">
      <div className="flex items-center gap-1 mb-0.5">
        <p className="text-white font-bold text-[13px] truncate">{coach.coach_name}</p>
        {coach.is_verified && <CheckCircle2 className="h-3 w-3 text-sky-400 fill-sky-400/20 flex-shrink-0" />}
      </div>
      <div className="flex items-center justify-between gap-2">
        {coach.location && (
          <span className="flex items-center gap-0.5 text-[10px] text-white/70 truncate">
            <MapPin className="h-2.5 w-2.5" />{coach.location}
          </span>
        )}
        {coach.price != null && coach.price > 0 && (
          <span className="flex-shrink-0 text-[10px] font-black text-white bg-[#46f1c5]/90 px-1.5 py-0.5 rounded-full">
            ₪{coach.price}
          </span>
        )}
      </div>
    </div>
  </Link>
);

const SectionHeader = ({
  title, action, actionHref, icon,
}: { title: string; action?: string; actionHref?: string; icon?: React.ReactNode }) => (
  <div className="flex items-end justify-between px-6 mb-4">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-lg font-black tracking-tight text-foreground">{title}</h2>
    </div>
    {action && actionHref && (
      <Link to={actionHref} className="text-[11px] font-black uppercase tracking-[0.18em] text-[#46f1c5] inline-flex items-center gap-0.5">
        {action}
        <ChevronRight className="h-3 w-3" />
      </Link>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */

const HomePage = () => {
  const { data, loading, refetch } = useHomeData();
  const { user, profile } = useAuth();
  const { items: recentlyViewed } = useRecentlyViewed(5);
  const navigate = useNavigate();

  const handleRefresh = useCallback(async () => { await refetch(); }, [refetch]);

  // First-run onboarding redirect (Phase 6.5). If a logged-in user has no
  // interests saved and hasn't already skipped, push them through onboarding.
  useEffect(() => {
    if (!user || !profile) return;
    const skipped = typeof window !== "undefined" && sessionStorage.getItem("circlo_onboarding_skipped") === "1";
    if (skipped) return;
    if ((profile.interests || []).length === 0) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, profile, navigate]);

  const firstName = (profile?.username || user?.email?.split("@")[0] || "").split(" ")[0];
  const greeting = greet(firstName);

  const stories = useMemo(() => (data?.topCoaches || []).slice(0, 8), [data]);
  const featured = useMemo(() => (data?.featuredCoaches || []).slice(0, 6), [data]);
  const recommended = useMemo(() => (data?.recommendedCoaches || []).slice(0, 6), [data]);
  const newCoaches = useMemo(() => (data?.newCoaches || []).slice(0, 6), [data]);
  const upcoming = data?.upcomingSessions || [];
  const sports = useMemo(() => {
    const counts = data?.sportCounts || {};
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [data]);

  const context = upcoming[0]
    ? `Your next session is ${formatSessionDate(upcoming[0].date)} · ${upcoming[0].time_label || upcoming[0].time?.slice(0, 5)}`
    : data && data.totalCoaches > 0
    ? `${data.totalCoaches}+ coaches ready to train you`
    : "Find your next coach";

  if (loading) return <BrandLoader />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-1">Couldn't load content</h2>
        <p className="text-sm text-muted-foreground mb-4">Pull down to refresh.</p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <div className="w-full pt-5 pb-28 overflow-x-hidden">

        {/* ═══════ 1. GREETING ═══════ */}
        <section className="px-6 mb-7">
          <span className="text-[10px] font-black tracking-[0.3em] text-[#46f1c5] uppercase">
            {new Date().toLocaleDateString(undefined, { weekday: "long" })}
          </span>
          <h1 className="text-[28px] font-black leading-tight text-foreground mt-1 tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{context}</p>
        </section>

        {/* ═══════ 2. STORIES STRIP ═══════ */}
        <section className="mb-8">
          <div className="px-6 overflow-x-auto scrollbar-hide flex gap-5 py-2">
            <Link to="/create" className="flex flex-col items-center gap-2 flex-shrink-0" aria-label="Create content">
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
                        <img src={c.image_url} alt={c.coach_name} className="w-full h-full object-cover" loading="lazy" />
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
          </div>
        </section>

        {/* ═══════ 3. UPCOMING SESSIONS (logged-in, non-empty) ═══════ */}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <SectionHeader title="Upcoming sessions" action="See all" actionHref="/bookings" icon={<Calendar className="h-4 w-4 text-[#46f1c5]" />} />
            <div className="flex gap-3 px-6 overflow-x-auto scrollbar-hide snap-x">
              {upcoming.slice(0, 3).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => navigate(`/coach/${b.coach_id}`)}
                  className="flex-shrink-0 snap-start w-[260px] p-4 rounded-2xl bg-gradient-to-br from-[#46f1c5]/15 to-[#ff6b2c]/10 border border-[#46f1c5]/25 text-left active:scale-[0.98] transition-transform"
                  aria-label={`Upcoming session with ${b.coach_name}`}
                >
                  <span className="text-[9px] font-black tracking-[0.3em] text-[#46f1c5] uppercase">
                    {formatSessionDate(b.date)}
                  </span>
                  <p className="mt-1 text-base font-black text-foreground truncate">{b.coach_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />{b.time_label || b.time?.slice(0, 5)}
                    {b.training_type && <span className="text-muted-foreground/50">· {b.training_type}</span>}
                  </p>
                  {b.price != null && b.price > 0 && (
                    <p className="mt-3 text-sm font-black text-foreground">₪{b.price}</p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ 4. CONTINUE WHERE YOU LEFT OFF ═══════ */}
        {recentlyViewed.length > 0 && (
          <section className="mb-10">
            <SectionHeader title="Jump back in" icon={<TrendingUp className="h-4 w-4 text-[#ffb59a]" />} />
            <div className="px-6 flex gap-3 overflow-x-auto scrollbar-hide snap-x">
              {recentlyViewed.map((c) => (
                <div key={c.id} className="snap-start"><CoachMiniCard coach={c} /></div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ 5. FEATURED CARD ═══════ */}
        {featured[0] && (
          <section className="px-6 mb-10">
            <Link
              to={`/coach/${featured[0].id}`}
              className="block relative rounded-2xl overflow-hidden aspect-[16/10] bg-card group active:scale-[0.99] transition-transform"
            >
              {featured[0].image_url ? (
                <img src={featured[0].image_url} alt={featured[0].coach_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-gradient-kinetic opacity-80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-black/10 to-transparent" />

              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-[10px] font-black text-white tracking-wider uppercase inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#46f1c5]" />Featured
                </span>
                {featured[0].rating != null && (
                  <span className="px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    {featured[0].rating.toFixed(1)}
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[10px] font-black tracking-[0.28em] text-[#ffb59a] uppercase mb-1">
                  {featured[0].sport}
                </p>
                <h3 className="text-2xl font-black text-white leading-tight">
                  Train with {featured[0].coach_name}
                </h3>
                {featured[0].tagline && (
                  <p className="text-xs text-white/80 mt-1 line-clamp-2 max-w-[90%]">{featured[0].tagline}</p>
                )}
              </div>
            </Link>
          </section>
        )}

        {/* ═══════ 6. FEATURED COACHES RAIL ═══════ */}
        {featured.length > 1 && (
          <section className="mb-10">
            <SectionHeader title="Featured coaches" action="See all" actionHref="/discover" />
            <div className="px-6 flex gap-3 overflow-x-auto scrollbar-hide snap-x">
              {featured.slice(1, 7).map((c) => (
                <div key={c.id} className="snap-start"><CoachMiniCard coach={c} /></div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ 7. BROWSE BY SPORT ═══════ */}
        {sports.length > 0 && (
          <section className="mb-10">
            <SectionHeader title="Browse by sport" />
            <div className="px-6 flex gap-2 overflow-x-auto scrollbar-hide snap-x">
              {sports.map(([name, count]) => (
                <Link
                  key={name}
                  to={`/discover?sport=${encodeURIComponent(name)}`}
                  className="flex-shrink-0 snap-start flex items-center gap-2 h-11 px-5 rounded-full bg-card border border-border/40 text-[11px] font-black uppercase tracking-[0.14em] text-foreground active:scale-95 transition-transform"
                >
                  <span className="text-base">{SPORT_EMOJI[name.toLowerCase()] || "🎯"}</span>
                  <span>{name}</span>
                  <span className="text-[9px] text-muted-foreground bg-muted/40 rounded-full px-1.5 py-0.5">{count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ 8. RECOMMENDED FOR YOU ═══════ */}
        {recommended.length > 0 && (
          <section className="mb-10">
            <SectionHeader
              title={user ? "Recommended for you" : "Popular this week"}
              action="More"
              actionHref="/discover"
              icon={<Sparkles className="h-4 w-4 text-[#46f1c5]" />}
            />
            <div className="px-6 flex gap-3 overflow-x-auto scrollbar-hide snap-x">
              {recommended.map((c) => (
                <div key={c.id} className="snap-start"><CoachMiniCard coach={c} /></div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ 9. NEW ON CIRCLO ═══════ */}
        {newCoaches.length > 0 && (
          <section className="mb-10">
            <SectionHeader title="New on Circlo" icon={<Flame className="h-4 w-4 text-[#ffb59a]" />} />
            <div className="px-6 flex gap-3 overflow-x-auto scrollbar-hide snap-x">
              {newCoaches.map((c) => (
                <div key={c.id} className="snap-start"><CoachMiniCard coach={c} /></div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════ 10. BENTO QUICK ACTIONS ═══════ */}
        <section className="px-6 grid grid-cols-2 gap-4 mb-10">
          {(data.trendingCoaches || []).slice(0, 4).map((c, i) => {
            const accent = i % 2 === 0 ? "#ffb59a" : "#46f1c5";
            return (
              <Link
                key={c.id}
                to={`/coach/${c.id}`}
                className="relative rounded-2xl overflow-hidden aspect-square bg-card border border-border/40 group"
                aria-label={`${c.coach_name} — ${c.sport} coach`}
              >
                {c.image_url ? (
                  <img src={c.image_url} alt={c.coach_name} className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
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
                      {c.coach_name?.split(" ")[0]}<br />Session
                    </h4>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {/* ═══════ 11. QUICK ACCESS ═══════ */}
        <section className="px-6 grid grid-cols-2 gap-3 mb-8">
          <Link to="/discover" className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/40 active:scale-[0.97] transition-transform">
            <div className="h-10 w-10 rounded-lg bg-[#46f1c5]/10 flex items-center justify-center">
              <Search className="h-5 w-5 text-[#46f1c5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Find Coach</p>
              <p className="text-[10px] text-muted-foreground">{data.totalCoaches}+ coaches</p>
            </div>
          </Link>
          <Link to="/book" className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/40 active:scale-[0.97] transition-transform">
            <div className="h-10 w-10 rounded-lg bg-[#ffb59a]/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#ffb59a]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Book a session</p>
              <p className="text-[10px] text-muted-foreground">
                {upcoming.length > 0 ? `${upcoming.length} upcoming` : "Schedule now"}
              </p>
            </div>
          </Link>
        </section>

        {/* ═══════ END OF SCROLL ═══════ */}
        <EndOfScroll message="More coaches are coming soon…" />
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
