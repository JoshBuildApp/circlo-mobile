import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Users, Dumbbell, Calendar, Star, MapPin, ChevronRight, Sparkles, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import SectionHeader from "@/components/home/SectionHeader";
import type { Coach } from "@/data/coaches";

const SPORTS = [
  { name: "Padel", emoji: "🎾" },
  { name: "Fitness", emoji: "💪" },
  { name: "Tennis", emoji: "🏸" },
  { name: "Boxing", emoji: "🥊" },
  { name: "Soccer", emoji: "⚽" },
  { name: "Basketball", emoji: "🏀" },
  { name: "Yoga", emoji: "🧘" },
  { name: "Swimming", emoji: "🏊" },
  { name: "Running", emoji: "🏃" },
  { name: "MMA", emoji: "🥋" },
  { name: "CrossFit", emoji: "🏋️" },
  { name: "Martial Arts", emoji: "🤺" },
];

interface DbCoach {
  id: string;
  user_id: string;
  coach_name: string;
  sport: string;
  bio: string | null;
  image_url: string | null;
  location: string | null;
  rating: number | null;
  price: number | null;
  followers: number | null;
  is_verified: boolean;
}

function toCoachShape(c: DbCoach): Coach {
  return {
    id: c.id,
    name: c.coach_name,
    tagline: c.sport,
    sport: c.sport,
    location: c.location || "",
    bio: c.bio || "",
    longBio: c.bio || "",
    coachingStyle: "",
    idealFor: "",
    specialties: [],
    image: c.image_url || "",
    coverImage: "",
    price: c.price || 0,
    rating: c.rating || 5,
    reviewCount: 0,
    followers: c.followers || 0,
    yearsExperience: 0,
    videos: [],
    reviews: [],
  };
}

const CoachCard = ({ coach, onClick, badge, subtitle }: {
  coach: DbCoach;
  onClick: () => void;
  badge?: string;
  subtitle?: string;
}) => (
  <motion.div
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="min-w-[180px] bg-card rounded-2xl border border-border/30 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
  >
    <div className="h-24 bg-secondary relative">
      {coach.image_url ? (
        <img src={coach.image_url} alt={coach.coach_name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#00D4AA]/20 to-[#FF6B2C]/20">
          <span className="text-2xl font-bold text-muted-foreground/40">{coach.coach_name.charAt(0)}</span>
        </div>
      )}
      {badge && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#00D4AA] text-white text-[9px] font-bold shadow">
          {badge}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent" />
    </div>
    <div className="p-3">
      <p className="text-[13px] font-bold text-foreground truncate">{coach.coach_name}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{coach.sport}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-0.5">
          {coach.rating && (
            <>
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] text-muted-foreground font-semibold">{coach.rating}</span>
            </>
          )}
        </div>
        {coach.price != null && coach.price > 0 && (
          <span className="text-[11px] font-bold text-[#00D4AA]">₪{coach.price}</span>
        )}
      </div>
    </div>
  </motion.div>
);

const Book = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedCoachId = searchParams.get("coach");

  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [allCoaches, setAllCoaches] = useState<DbCoach[]>([]);
  const [pastBookingCoaches, setPastBookingCoaches] = useState<(DbCoach & { lastDate: string })[]>([]);
  const [followedCoachIds, setFollowedCoachIds] = useState<string[]>([]);
  const [availableThisWeek, setAvailableThisWeek] = useState<{ coachId: string; nextSlot: string }[]>([]);
  const [sportCounts, setSportCounts] = useState<Record<string, number>>({});

  const [bookingCoach, setBookingCoach] = useState<Coach | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const { data: coaches } = await supabase
        .from("coach_profiles")
        .select("id, user_id, coach_name, sport, bio, image_url, location, rating, price, followers, is_verified")
        .eq("is_fake", false)
        .order("rating", { ascending: false });

      const coachList = (coaches || []) as DbCoach[];
      setAllCoaches(coachList);

      const counts: Record<string, number> = {};
      coachList.forEach((c) => {
        const s = c.sport || "Other";
        counts[s] = (counts[s] || 0) + 1;
      });
      setSportCounts(counts);

      if (user) {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("coach_id, date, coach_name")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(20);

        if (bookings && bookings.length > 0) {
          const seen = new Set<string>();
          const recentCoachIds: { id: string; date: string }[] = [];
          for (const b of bookings) {
            if (!seen.has(b.coach_id)) {
              seen.add(b.coach_id);
              recentCoachIds.push({ id: b.coach_id, date: b.date });
            }
            if (recentCoachIds.length >= 3) break;
          }
          const pastCoaches = recentCoachIds
            .map(({ id, date }) => {
              const c = coachList.find((co) => co.id === id);
              return c ? { ...c, lastDate: date } : null;
            })
            .filter(Boolean) as (DbCoach & { lastDate: string })[];
          setPastBookingCoaches(pastCoaches);
        }

        const { data: follows } = await supabase
          .from("user_follows")
          .select("coach_id")
          .eq("user_id", user.id);
        setFollowedCoachIds((follows || []).map((f) => f.coach_id));
      }

      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToCheck = Array.from({ length: 7 }, (_, i) => (dayOfWeek + i) % 7);

      const { data: slots } = await supabase
        .from("availability")
        .select("coach_id, day_of_week, start_time")
        .eq("is_active", true)
        .in("day_of_week", daysToCheck)
        .limit(100);

      if (slots) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const coachSlotMap = new Map<string, string>();
        for (const s of slots) {
          if (!coachSlotMap.has(s.coach_id)) {
            const dayName = dayNames[s.day_of_week];
            const time = s.start_time?.slice(0, 5) || "";
            coachSlotMap.set(s.coach_id, `${dayName} ${time}`);
          }
        }
        setAvailableThisWeek(
          Array.from(coachSlotMap.entries())
            .map(([coachId, nextSlot]) => ({ coachId, nextSlot }))
            .slice(0, 10)
        );
      }

      setLoading(false);
    };
    fetchAll();
  }, [user]);

  useEffect(() => {
    if (preselectedCoachId && allCoaches.length > 0 && !bookingCoach) {
      const c = allCoaches.find((co) => co.id === preselectedCoachId);
      if (c) setBookingCoach(toCoachShape(c));
    }
  }, [preselectedCoachId, allCoaches, bookingCoach]);

  const followedCoaches = useMemo(
    () => allCoaches.filter((c) => followedCoachIds.includes(c.id)),
    [allCoaches, followedCoachIds]
  );

  const pastCoachIds = useMemo(() => new Set(pastBookingCoaches.map((c) => c.id)), [pastBookingCoaches]);

  const suggestions = useMemo(() => {
    let filtered = allCoaches.filter(
      (c) => !followedCoachIds.includes(c.id) && !pastCoachIds.has(c.id)
    );
    if (sportFilter) filtered = filtered.filter((c) => c.sport === sportFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) => c.coach_name.toLowerCase().includes(q) || c.sport.toLowerCase().includes(q)
      );
    }
    return filtered.slice(0, 6);
  }, [allCoaches, followedCoachIds, pastCoachIds, sportFilter, search]);

  const availableCoaches = useMemo(() => {
    return availableThisWeek
      .map(({ coachId, nextSlot }) => {
        const c = allCoaches.find((co) => co.id === coachId);
        return c ? { ...c, nextSlot } : null;
      })
      .filter(Boolean) as (DbCoach & { nextSlot: string })[];
  }, [availableThisWeek, allCoaches]);

  const handleBook = (coach: DbCoach) => {
    setBookingCoach(toCoachShape(coach));
  };

  if (loading) {
    return (
      <div className="py-6 md:py-10 px-4 space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-7 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-64 ml-10 rounded-lg" />
        </div>

        {/* Search bar skeleton */}
        <Skeleton className="h-[52px] w-full max-w-lg rounded-2xl" />

        {/* Coach cards skeleton – horizontal scroll row */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[180px] rounded-2xl border border-border/30 overflow-hidden">
                <Skeleton className="h-24 w-full rounded-none" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                  <div className="flex items-center justify-between mt-2">
                    <Skeleton className="h-3 w-10 rounded" />
                    <Skeleton className="h-3 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sport pills skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Suggested coaches grid skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/20 overflow-hidden">
                <Skeleton className="h-28 w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-3 w-36 rounded" />
                    </div>
                    <Skeleton className="h-4 w-8 rounded" />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 md:py-10 pb-28 md:pb-10 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 md:px-0 mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00D4AA]/70 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-2xl md:text-[28px] font-bold text-foreground tracking-tight">Book a Session</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-10">Find the right coach and start training</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="px-4 md:px-0 mb-8"
      >
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coaches by name or sport..."
            className="w-full h-[52px] pl-11 pr-4 rounded-2xl bg-card border border-border/20 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]/40 shadow-sm transition-all duration-200"
          />
        </div>
      </motion.div>

      {/* Continue Where You Left Off */}
      {user && pastBookingCoaches.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-10 px-4 md:px-0"
        >
          <SectionHeader title="Continue Where You Left Off" />
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
            {pastBookingCoaches.map((c) => (
              <CoachCard
                key={c.id}
                coach={c}
                onClick={() => handleBook(c)}
                badge="Recent"
                subtitle={`Last: ${c.lastDate}`}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Your Favorite Coaches */}
      {user && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-10 px-4 md:px-0"
        >
          <SectionHeader title="Your Favorite Coaches" />
          {followedCoaches.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
              {followedCoaches.map((c) => (
                <CoachCard key={c.id} coach={c} onClick={() => handleBook(c)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border/20 p-8 text-center">
              <div className="h-12 w-12 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No favorite coaches yet</p>
              <p className="text-xs text-muted-foreground mb-3">Follow coaches to see them here</p>
              <Link to="/discover" className="inline-flex items-center gap-1 text-sm text-[#00D4AA] font-semibold hover:underline">
                Discover Coaches <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </motion.section>
      )}

      {/* Browse by Sport */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mb-10 px-4 md:px-0"
      >
        <SectionHeader title="Browse by Sport" />
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 snap-x">
          {SPORTS.map(({ name, emoji }) => {
            const active = sportFilter === name;
            const count = sportCounts[name] || 0;
            return (
              <motion.button
                key={name}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSportFilter(active ? null : name)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 py-2.5 px-4 rounded-2xl transition-all duration-200 snap-start whitespace-nowrap",
                  active
                    ? "bg-gradient-to-r from-[#00D4AA] to-[#00D4AA]/80 text-white shadow-lg shadow-[#00D4AA]/20"
                    : "bg-card border border-border/30 hover:border-[#00D4AA]/30 hover:shadow-sm"
                )}
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-xs font-bold">{name}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                    active ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Suggested For You */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mb-10 px-4 md:px-0"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {sportFilter ? `${sportFilter} Coaches` : "Suggested For You"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top-rated coaches ready to train with you</p>
          </div>
          {sportFilter && (
            <button onClick={() => setSportFilter(null)} className="text-xs text-[#00D4AA] font-semibold hover:underline">
              Clear filter
            </button>
          )}
        </div>
        {suggestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((c, i) => {
              const avail = availableThisWeek.find((a) => a.coachId === c.id);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-card rounded-2xl border border-border/20 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
                  onClick={() => handleBook(c)}
                >
                  {/* Coach image header */}
                  <div className="h-28 bg-secondary relative">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.coach_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#00D4AA]/10 to-[#FF6B2C]/10">
                        <span className="text-3xl font-bold text-muted-foreground/30">{c.coach_name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
                    {c.is_verified && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#00D4AA] text-white text-[9px] font-bold flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Verified
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">{c.coach_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          {c.sport}
                          {c.location && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <MapPin className="h-2.5 w-2.5" />
                              {c.location}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-semibold text-foreground">{c.rating || 5}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
                      <span className="text-base font-bold text-[#00D4AA]">₪{c.price || 0}<span className="text-[10px] font-normal text-muted-foreground">/session</span></span>
                      {avail && (
                        <span className="text-[10px] text-green-600 font-medium flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                          <Clock className="h-2.5 w-2.5" />
                          {avail.nextSlot}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-border/20 p-10 text-center">
            <div className="h-12 w-12 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No coaches found</p>
            <p className="text-xs text-muted-foreground">{sportFilter ? `Try a different sport or clear the filter` : "Try a different search"}</p>
          </div>
        )}
      </motion.section>

      {/* Available This Week */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mb-10 px-4 md:px-0"
      >
        <SectionHeader title="Available This Week" />
        {availableCoaches.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border/20 p-10 text-center">
            <div className="h-12 w-12 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No availability this week</p>
            <p className="text-xs text-muted-foreground">Coaches haven't posted open slots yet. Try browsing by sport above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableCoaches.slice(0, 10).map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
                className="bg-card rounded-2xl border border-border/20 flex items-center gap-3 p-3.5 cursor-pointer hover:shadow-md transition-all duration-200 group"
                onClick={() => handleBook(c)}
              >
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.coach_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#00D4AA]/20 to-[#FF6B2C]/20">
                      <span className="text-sm font-bold text-muted-foreground/50">{c.coach_name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{c.coach_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold text-[#00D4AA]">{c.sport}</span>
                    <span className="text-[10px] text-green-600 flex items-center gap-1 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                      {c.nextSlot}
                    </span>
                  </div>
                </div>
                {c.price && <span className="text-sm font-bold text-foreground mr-1">₪{c.price}</span>}
                <button
                  onClick={(e) => { e.stopPropagation(); handleBook(c); }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00D4AA]/80 text-white text-xs font-bold hover:shadow-lg hover:shadow-[#00D4AA]/20 active:scale-95 transition-all duration-200"
                >
                  Book
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Premium Booking Modal */}
      <AnimatePresence>
        {bookingCoach && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => setBookingCoach(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-card rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Coach summary card */}
              <div className="relative h-40 bg-secondary">
                {bookingCoach.image ? (
                  <img src={bookingCoach.image} alt={bookingCoach.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#00D4AA]/20 to-[#FF6B2C]/20">
                    <span className="text-5xl font-bold text-muted-foreground/20">{bookingCoach.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <h2 className="text-xl font-bold text-foreground">{bookingCoach.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground font-medium">{bookingCoach.sport}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-foreground">{bookingCoach.rating}</span>
                    </div>
                    {bookingCoach.location && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />{bookingCoach.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Pricing */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Session price</p>
                    <p className="text-2xl font-bold text-foreground">₪{bookingCoach.price}<span className="text-sm font-normal text-muted-foreground">/session</span></p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[#00D4AA]" />
                  </div>
                </div>

                {/* CTA */}
                <Link
                  to={`/coach/${bookingCoach.id}`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-[#00D4AA] to-[#00D4AA]/80 text-white font-bold text-[15px] shadow-lg shadow-[#00D4AA]/20 hover:shadow-xl hover:shadow-[#00D4AA]/30 active:scale-[0.98] transition-all duration-200"
                >
                  View Profile & Book
                  <ChevronRight className="h-5 w-5" />
                </Link>

                <button
                  onClick={() => setBookingCoach(null)}
                  className="w-full py-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Book;
