import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect, lazy, Suspense } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, X, Play, Eye, Star, CheckCircle2, Users,
  Heart, MessageCircle, Bookmark, Calendar, SlidersHorizontal,
  TrendingUp, Sparkles, Clock, Flame, ChevronRight, MapPin, Map, List,
} from "lucide-react";

const CoachMapView = lazy(() => import("@/components/CoachMapView"));
import WorkoutQuiz from "@/components/WorkoutQuiz";
import { feedItems } from "@/data/feed";
import { coaches } from "@/data/coaches";
import { useCoachVideos } from "@/hooks/use-coach-videos";
import { useAuth } from "@/contexts/AuthContext";
import { useDataMode } from "@/contexts/DataModeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookingModal } from "@/components/BookingModal";
import { SafeImage } from "@/components/ui/safe-image";
import PostDetailModal from "@/components/PostDetailModal";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicSessions, type TrainingSession } from "@/hooks/use-training-sessions";
import { User, UsersRound } from "lucide-react";

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

/** Check if a URL points to actual video content (not just a path containing "video") */
const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url);

const SPORTS = ["Padel", "Fitness", "Basketball", "Tennis", "Boxing", "Soccer", "Yoga", "Swimming"];
const SPORT_ICONS: Record<string, string> = {
  All: "🔥", Padel: "🎾", Fitness: "💪", Basketball: "🏀", Tennis: "🎾",
  Boxing: "🥊", Soccer: "⚽", Yoga: "🧘", Swimming: "🏊",
};
const CATEGORIES = ["All", ...SPORTS];
const POPULAR_SEARCHES = ["Padel training", "Boxing drills", "Yoga flow", "Tennis serve", "Basketball crossover"];
const AVAILABILITY_OPTIONS = [
  { label: "Any time", value: "any" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
] as const;

interface DbCoach {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  tagline: string | null;
  rating: number | null;
  price: number | null;
  is_verified: boolean;
  is_pro: boolean;
  is_boosted: boolean;
  followers: number | null;
  location: string | null;
}

interface FilterState {
  sports: string[];
  priceRange: [number, number];
  minRating: number;
  location: string;
  availability: string;
}

const DEFAULT_FILTERS: FilterState = {
  sports: [],
  priceRange: [0, 500],
  minRating: 0,
  location: "",
  availability: "any",
};

const filtersAreActive = (f: FilterState) =>
  f.sports.length > 0 ||
  f.priceRange[0] > 0 ||
  f.priceRange[1] < 500 ||
  f.minRating > 0 ||
  f.location.trim() !== "" ||
  f.availability !== "any";

const activeFilterCount = (f: FilterState) => {
  let c = 0;
  if (f.sports.length > 0) c++;
  if (f.priceRange[0] > 0 || f.priceRange[1] < 500) c++;
  if (f.minRating > 0) c++;
  if (f.location.trim()) c++;
  if (f.availability !== "any") c++;
  return c;
};

/* ─── AutoPlay Grid Video ─── */
const AutoPlayVideo = ({ src, poster }: { src: string; poster?: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.play().catch(() => {}); } else { el.pause(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className="absolute inset-0 w-full h-full object-cover"
      muted loop playsInline preload="metadata"
    />
  );
};

/* ─── Featured Carousel Item ─── */
const FeaturedCard = ({ item }: { item: { id: string; coachId: string; coachName: string; sport: string; image: string; videoSrc: string; title: string; views: number; likes: number } }) => {
  const hasVideo = item.videoSrc && isVideoUrl(item.videoSrc);
  return (
    <Link
      to={`/coach/${item.coachId}`}
      className="flex-shrink-0 w-[280px] aspect-[3/4] rounded-2xl overflow-hidden relative bg-secondary active:scale-[0.97] transition-transform"
    >
      {hasVideo ? (
        <AutoPlayVideo src={item.videoSrc} poster={item.image} />
      ) : (
        <SafeImage src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {hasVideo && (
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white text-sm font-bold line-clamp-2 mb-1">{item.title}</p>
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-[11px] font-medium">{item.coachName}</span>
          <span className="text-white/40 text-[10px]">·</span>
          <span className="text-white/50 text-[10px] capitalize">{item.sport}</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-white/60 text-[10px]"><Heart className="h-3 w-3" />{fmt(item.likes)}</span>
          {item.views > 0 && <span className="flex items-center gap-1 text-white/60 text-[10px]"><Eye className="h-3 w-3" />{fmt(item.views)}</span>}
        </div>
      </div>
    </Link>
  );
};

/* ─── Grid Tile (video or coach card) ─── */
type GridItem =
  | { type: "video"; id: string; coachId: string; coachName: string; sport: string; image: string; videoSrc: string; title: string; views: number; likes: number; category: string }
  | { type: "coach"; id: string; name: string; sport: string; image: string; tagline: string; rating: number; price: number; isVerified: boolean; isPro: boolean; isBoosted: boolean; followers: number; location: string };

const GridTile = ({ item, size }: { item: GridItem; size: "large" | "small" | "wide" }) => {
  const isLarge = size === "large";
  const isWide = size === "wide";

  if (item.type === "coach") {
    return (
      <Link
        to={`/coach/${item.id}`}
        className={`relative rounded-2xl overflow-hidden bg-card border border-border/10 group active:scale-[0.96] transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5 ${
          isLarge ? "col-span-2 row-span-2" : isWide ? "col-span-2" : ""
        }`}
      >
        <div className={`relative ${isLarge ? "aspect-square" : isWide ? "aspect-[2/1]" : "aspect-square"} bg-secondary overflow-hidden`}>
          {item.image ? (
            <SafeImage src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" fallbackIcon={<Users className="h-10 w-10 text-muted-foreground/15" />} />
          ) : (
            <div className="h-full w-full flex items-center justify-center"><Users className="h-10 w-10 text-muted-foreground/15" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/70 transition-colors duration-300" />
          {/* Badges row */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {item.isBoosted && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-accent/90 text-[9px] font-bold text-accent-foreground backdrop-blur-sm">
                <Flame className="h-2.5 w-2.5" />Featured
              </span>
            )}
            {item.isPro && !item.isBoosted && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/90 text-[9px] font-bold text-primary-foreground backdrop-blur-sm">
                <Sparkles className="h-2.5 w-2.5" />PRO
              </span>
            )}
            {item.isVerified && (
              <div className="bg-primary rounded-full p-0.5">
                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="absolute right-2.5 bottom-14 flex flex-col gap-1.5 opacity-0 group-active:opacity-100 transition-opacity">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.success("Saved!"); }} className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <Bookmark className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className={`text-white font-bold line-clamp-1 ${isLarge ? "text-base" : "text-xs"}`}>{item.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white/60 text-[10px] capitalize">{item.sport}</span>
              <span className="flex items-center gap-0.5 text-white/60 text-[10px]">
                <Star className="h-2.5 w-2.5 text-accent fill-accent" />{item.rating}
              </span>
            </div>
            {(isLarge || isWide) && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-white/70 text-[11px] font-semibold">₪{item.price}/hr</span>
                <span className="text-white/50 text-[10px]">{fmt(item.followers)} fans</span>
              </div>
            )}
          </div>
          {isLarge && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                <Calendar className="h-3 w-3" />Book
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  const hasVideo = item.videoSrc && isVideoUrl(item.videoSrc);
  return (
    <Link
      to={`/coach/${item.coachId}`}
      className={`relative rounded-2xl overflow-hidden bg-secondary group active:scale-[0.96] transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 ${
        isLarge ? "col-span-2 row-span-2" : isWide ? "col-span-2" : ""
      }`}
    >
      <div className={`relative ${isLarge ? "aspect-square" : isWide ? "aspect-[2/1]" : "aspect-square"} overflow-hidden`}>
        {hasVideo ? (
          <AutoPlayVideo src={item.videoSrc} poster={item.image} />
        ) : (
          <SafeImage src={item.image} alt={item.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/70 transition-colors duration-300" />
        {hasVideo && (
          <div className="absolute top-2.5 left-2.5 h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-3 w-3 text-white fill-white ml-[1px]" />
          </div>
        )}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.success("Saved!"); }} className="h-7 w-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-all">
            <Bookmark className="h-3 w-3" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className={`text-white font-semibold line-clamp-2 ${isLarge ? "text-sm mb-1" : "text-[10px] leading-tight"}`}>{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white/60 text-[10px]">{item.coachName}</span>
            {item.views > 0 && (
              <span className="flex items-center gap-0.5 text-white/50 text-[9px]"><Eye className="h-2.5 w-2.5" />{fmt(item.views)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ─── Active Filter Chip ─── */
const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <button
    onClick={onRemove}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary active:scale-95 transition-all"
  >
    {label}
    <X className="h-3 w-3" />
  </button>
);

const GRID_PAGE_SIZE = 18;

/** Returns responsive column count: 3 mobile, 4 md, 5 lg */
const useColumns = () => {
  const [cols, setCols] = useState(() => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth >= 1024) return 5;
    if (window.innerWidth >= 768) return 4;
    return 3;
  });
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setCols(5);
      else if (window.innerWidth >= 768) setCols(4);
      else setCols(3);
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
};

/* ═══════ MAIN DISCOVER PAGE ═══════ */
const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookingCoach, setBookingCoach] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [category, setCategory] = useState("All");
  const [gridVisible, setGridVisible] = useState(GRID_PAGE_SIZE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("circlo_recent_searches") || "[]"); } catch { return []; }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Active filters (applied)
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  // Draft filters (editing in the sheet)
  const [draftFilters, setDraftFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });

  const { videos: uploadedVideos } = useCoachVideos();
  const { sessions: publicSessions } = usePublicSessions();
  const [dbCoaches, setDbCoaches] = useState<DbCoach[]>([]);
  const [dbCoachesLoaded, setDbCoachesLoaded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [availableCoachIds, setAvailableCoachIds] = useState<Set<string> | null>(null);

  const { isRealMode } = useDataMode();

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, tagline, rating, price, is_verified, is_pro, is_boosted, followers, location")
        .order("followers", { ascending: false });
      if (isRealMode) query = query.eq("is_fake", false);
      const { data } = await query;
      if (data) setDbCoaches((data as unknown as DbCoach[]).filter((coach) => coach.coach_name?.trim()));
      setDbCoachesLoaded(true);
    };
    load();
  }, [isRealMode]);

  // Fetch coaches with availability matching the selected filter
  useEffect(() => {
    if (filters.availability === "any") {
      setAvailableCoachIds(null);
      return;
    }
    const fetchAvailable = async () => {
      const now = new Date();
      const todayDow = now.getDay(); // 0=Sun
      if (filters.availability === "today") {
        const { data } = await supabase
          .from("availability")
          .select("coach_id")
          .eq("day_of_week", todayDow)
          .eq("is_active", true);
        if (data) setAvailableCoachIds(new Set(data.map((r: { coach_id: string }) => r.coach_id)));
      } else if (filters.availability === "week") {
        const { data } = await supabase
          .from("availability")
          .select("coach_id")
          .eq("is_active", true);
        if (data) setAvailableCoachIds(new Set(data.map((r: { coach_id: string }) => r.coach_id)));
      }
    };
    fetchAvailable();
  }, [filters.availability]);

  const dbCoachMap = useMemo(() => {
    const map = new Map<string, DbCoach>();
    dbCoaches.forEach((coach) => {
      if (coach.coach_name?.trim()) {
        map.set(coach.id, coach);
      }
    });
    return map;
  }, [dbCoaches]);

  const addRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("circlo_recent_searches", JSON.stringify(updated));
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setSearchFocused(false);
    setGridVisible(GRID_PAGE_SIZE);
    if (q.trim()) addRecentSearch(q.trim());
  };

  const openFilterSheet = () => {
    setDraftFilters({ ...filters });
    setShowFilters(true);
  };

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setShowFilters(false);
    setGridVisible(GRID_PAGE_SIZE);
  };

  const clearAllFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setDraftFilters({ ...DEFAULT_FILTERS });
    setShowFilters(false);
    setGridVisible(GRID_PAGE_SIZE);
  };

  const removeSportFilter = (sport: string) => {
    setFilters((prev) => ({ ...prev, sports: prev.sports.filter((s) => s !== sport) }));
  };

  const toggleDraftSport = (sport: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter((s) => s !== sport)
        : [...prev.sports, sport],
    }));
  };

  const isActive = filtersAreActive(filters);
  const filterCount = activeFilterCount(filters);

  // All coaches merged and filtered
  const allCoaches = useMemo(() => {
    const merged = [
      ...dbCoaches.map((c) => ({
        id: c.id, name: c.coach_name, sport: c.sport, image: c.image_url || "",
        tagline: c.tagline || "", rating: c.rating || 5, price: c.price || 50,
        isVerified: c.is_verified, isPro: c.is_pro, isBoosted: c.is_boosted,
        followers: c.followers || 0, location: c.location || "", isDb: true,
      })),
      ...(isRealMode ? [] : coaches
        .filter((coach) => coach.name?.trim())
        .map((c) => ({
        id: c.id, name: c.name, sport: c.sport, image: c.image,
        tagline: c.tagline, rating: c.rating, price: c.price,
        isVerified: false, isPro: false, isBoosted: false, followers: c.followers, location: c.location, isDb: false,
      }))),
    ];
    let filtered = merged;

    const sportFilter = filters.sports.length > 0 ? filters.sports : (category !== "All" ? [category] : []);
    if (sportFilter.length > 0) filtered = filtered.filter((c) => sportFilter.some((s) => c.sport.toLowerCase() === s.toLowerCase()));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q) || c.sport.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
    }
    if (filters.minRating > 0) filtered = filtered.filter((c) => c.rating >= filters.minRating);
    if (filters.priceRange[1] < 500) filtered = filtered.filter((c) => c.price <= filters.priceRange[1]);
    if (filters.priceRange[0] > 0) filtered = filtered.filter((c) => c.price >= filters.priceRange[0]);
    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter((c) => c.location.toLowerCase().includes(loc));
    }
    if (availableCoachIds) {
      filtered = filtered.filter((c) => availableCoachIds.has(c.id));
    }

    // Sort: boosted first, then pro, then rest
    filtered.sort((a, b) => {
      const scoreA = (a.isBoosted ? 2 : 0) + (a.isPro ? 1 : 0);
      const scoreB = (b.isBoosted ? 2 : 0) + (b.isPro ? 1 : 0);
      return scoreB - scoreA;
    });
    return filtered;
  }, [dbCoaches, category, searchQuery, filters, isRealMode, availableCoachIds]);

  // Build video content items
  const videoItems = useMemo(() => {
    const staticItems = isRealMode ? [] : feedItems.flatMap((item) => {
      const coach = coaches.find((c) => c.id === item.coachId);
      const coachName = coach?.name?.trim() || item.coachName?.trim();
      if (!coachName) return [];
      return [{
        id: item.id, coachId: item.coachId, coachName,
        sport: coach?.sport || item.sport,
        image: item.image || coach?.image || item.coachAvatar,
        videoSrc: item.videoSrc,
        views: item.likes * 12, title: item.caption, likes: item.likes, category: item.category,
      }];
    });

    const uploadedItems = !dbCoachesLoaded
      ? []
      : uploadedVideos.flatMap((v) => {
          const coach = dbCoachMap.get(v.coach_id);
          if (!coach?.coach_name?.trim()) return [];
          const isVid = v.media_type === "video" || isVideoUrl(v.media_url);
          return [{
            id: v.id, coachId: v.coach_id, coachName: coach.coach_name,
            sport: coach.sport || "Training",
            image: v.thumbnail_url || (isVid ? coach.image_url : v.media_url) || coach.image_url || "",
            videoSrc: isVid ? v.media_url : "",
            views: v.views || 0, title: v.title, likes: 0, category: "training",
          }];
        });

    let all = [...uploadedItems, ...staticItems];
    const sportFilter = filters.sports.length > 0 ? filters.sports : (category !== "All" ? [category] : []);
    if (sportFilter.length > 0) all = all.filter((i) => sportFilter.some((s) => i.sport.toLowerCase() === s.toLowerCase()));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      all = all.filter((i) => i.coachName.toLowerCase().includes(q) || i.sport.toLowerCase().includes(q) || i.title.toLowerCase().includes(q));
    }
    return all;
  }, [uploadedVideos, category, searchQuery, dbCoachMap, dbCoachesLoaded, filters]);

  const featured = useMemo(() => videoItems.slice(0, 6), [videoItems]);

  const trendingCoaches = useMemo(() =>
    [...allCoaches].sort((a, b) => b.followers - a.followers).slice(0, 8),
  [allCoaches]);

  const gridItems: GridItem[] = useMemo(() => {
    const items: GridItem[] = [];
    const vids = [...videoItems];
    const coachs = [...allCoaches].slice(0, 12);
    let vi = 0, ci = 0;
    while (vi < vids.length || ci < coachs.length) {
      if (vi < vids.length) items.push({ type: "video", ...vids[vi++] });
      if (vi < vids.length) items.push({ type: "video", ...vids[vi++] });
      if (ci < coachs.length) {
        const c = coachs[ci++];
        items.push({ type: "coach", id: c.id, name: c.name, sport: c.sport, image: c.image, tagline: c.tagline, rating: c.rating, price: c.price, isVerified: c.isVerified, isPro: c.isPro, isBoosted: c.isBoosted, followers: c.followers, location: c.location });
      }
      if (vi < vids.length) items.push({ type: "video", ...vids[vi++] });
    }
    return items;
  }, [videoItems, allCoaches]);

  const sizeAt = (i: number): "large" | "small" | "wide" => {
    const p = i % 9;
    if (p === 0) return "large";
    if (p === 5) return "wide";
    return "small";
  };

  const searchSuggestions = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    const coachMatches = allCoaches.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3);
    const sportMatches = CATEGORIES.filter((c) => c !== "All" && c.toLowerCase().includes(q));
    return { coaches: coachMatches, sports: sportMatches };
  }, [searchQuery, allCoaches]);

  const hasResults = gridItems.length > 0;

  // Build active filter chip labels
  const activeChips = useMemo(() => {
    const chips: { label: string; remove: () => void }[] = [];
    filters.sports.forEach((s) => {
      chips.push({ label: s, remove: () => removeSportFilter(s) });
    });
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) {
      chips.push({
        label: `₪${filters.priceRange[0]}–${filters.priceRange[1]}`,
        remove: () => setFilters((prev) => ({ ...prev, priceRange: [0, 500] })),
      });
    }
    if (filters.minRating > 0) {
      chips.push({
        label: `${filters.minRating}+ ★`,
        remove: () => setFilters((prev) => ({ ...prev, minRating: 0 })),
      });
    }
    if (filters.location.trim()) {
      chips.push({
        label: filters.location,
        remove: () => setFilters((prev) => ({ ...prev, location: "" })),
      });
    }
    if (filters.availability !== "any") {
      const opt = AVAILABILITY_OPTIONS.find((o) => o.value === filters.availability);
      chips.push({
        label: opt?.label || filters.availability,
        remove: () => setFilters((prev) => ({ ...prev, availability: "any" })),
      });
    }
    return chips;
  }, [filters]);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden w-full">
      {/* ═══ STICKY SEARCH + CATEGORIES ═══ */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl px-4 pt-4 pb-2 space-y-3 border-b border-border/5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
              placeholder="Search coaches, sports..."
              aria-label="Search coaches and sports"
              className="w-full h-11 pl-10 pr-9 rounded-2xl bg-secondary/70 border border-border/10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
            aria-label={viewMode === "list" ? "Switch to map view" : "Switch to list view"}
            className={`h-11 w-11 rounded-2xl border border-border/10 flex items-center justify-center active:scale-95 transition-all ${
              viewMode === "map" ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-muted-foreground"
            }`}
          >
            {viewMode === "list" ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
          <button
            onClick={openFilterSheet}
            aria-label="Open filters"
            className={`relative h-11 w-11 rounded-2xl border border-border/10 flex items-center justify-center active:scale-95 transition-all ${
              isActive ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-muted-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* Category chips with sport icons */}
        <div className="flex w-full max-w-full gap-2 overflow-x-auto hide-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setSearchFocused(false); setGridVisible(GRID_PAGE_SIZE); }}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                category === cat
                  ? "bg-foreground text-background shadow-lg shadow-foreground/10"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span className="text-sm leading-none">{SPORT_ICONS[cat] || "🏅"}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex w-full max-w-full items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {activeChips.map((chip) => (
              <FilterChip key={chip.label} label={chip.label} onRemove={chip.remove} />
            ))}
            <button
              onClick={clearAllFilters}
              className="flex-shrink-0 text-[11px] font-semibold text-destructive px-2 py-1 active:scale-95"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ═══ SEARCH OVERLAY ═══ */}
      {searchFocused && (
        <div className="absolute inset-0 top-[120px] z-30 bg-background px-4 pt-4 pb-24 overflow-y-auto">
          {recentSearches.length > 0 && !searchQuery && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent</h3>
                <button onClick={() => { setRecentSearches([]); localStorage.removeItem("circlo_recent_searches"); }} className="text-[10px] text-primary font-semibold">Clear</button>
              </div>
              {recentSearches.map((s) => (
                <button key={s} onClick={() => handleSearch(s)} className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors text-left">
                  <Clock className="h-4 w-4 text-muted-foreground/40" />
                  <span className="text-sm text-foreground">{s}</span>
                </button>
              ))}
            </div>
          )}
          {!searchQuery && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Popular</h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((s) => (
                  <button key={s} onClick={() => handleSearch(s)} className="px-3 py-2 rounded-full bg-secondary/60 text-xs font-medium text-foreground active:scale-95 transition-all">{s}</button>
                ))}
              </div>
            </div>
          )}
          {searchSuggestions && (
            <div>
              {searchSuggestions.sports.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Sports</h3>
                  {searchSuggestions.sports.map((s) => (
                    <button key={s} onClick={() => { setCategory(s); setSearchQuery(""); setSearchFocused(false); }} className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors text-left">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">{s}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchSuggestions.coaches.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Coaches</h3>
                  {searchSuggestions.coaches.map((c) => (
                    <Link key={c.id} to={`/coach/${c.id}`} onClick={() => setSearchFocused(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                        {c.image ? <SafeImage src={c.image} alt={c.name} className="h-full w-full object-cover" /> : <Users className="h-4 w-4 text-muted-foreground m-auto mt-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.sport} · ₪{c.price}</p>
                      </div>
                      <Star className="h-3 w-3 text-accent fill-accent" />
                      <span className="text-xs font-bold text-foreground">{c.rating}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={() => setSearchFocused(false)} className="w-full mt-6 h-11 rounded-2xl bg-secondary text-sm font-semibold text-muted-foreground active:scale-95 transition-all">Cancel</button>
        </div>
      )}

      {/* ═══ MAP VIEW ═══ */}
      {viewMode === "map" && (
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        }>
          <CoachMapView coaches={allCoaches} />
        </Suspense>
      )}

      {/* ═══ MAIN SCROLLABLE CONTENT ═══ */}
      {viewMode === "list" && !dbCoachesLoaded && (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[280px] w-[200px] rounded-2xl flex-shrink-0" />)}
          </div>
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        </div>
      )}
      <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto hide-scrollbar pb-24 ${!dbCoachesLoaded || viewMode === "map" ? "hidden" : ""}`} onScroll={() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 600) {
          setGridVisible((c) => Math.min(c + GRID_PAGE_SIZE, gridItems.length));
        }
      }}>

        {/* ─── FEATURED CAROUSEL ─── */}
        {featured.length > 0 && !searchQuery && !isActive && (
          <div className="pt-4 pb-2">
            <div className="flex items-center gap-2 px-4 mb-3">
              <Flame className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-bold text-foreground">Featured</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-2">
              {featured.map((item) => (
                <FeaturedCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ─── WORKOUT QUIZ ─── */}
        {!searchQuery && !isActive && (
          <div className="px-4 py-3">
            {!showQuiz ? (
              <button
                onClick={() => setShowQuiz(true)}
                className="w-full p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-orange-500/10 border border-primary/20 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h3 className="font-heading font-bold text-foreground text-sm">Find Your Perfect Workout</h3>
                    <p className="text-xs text-muted-foreground">Take a 30-second quiz and get matched</p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ) : (
              <div className="p-5 rounded-2xl bg-card border border-border/50">
                <WorkoutQuiz
                  onFindCoach={(sport) => {
                    setCategory(sport.charAt(0).toUpperCase() + sport.slice(1));
                    setShowQuiz(false);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ─── TRENDING COACHES ─── */}
        {trendingCoaches.length > 0 && !searchQuery && !isActive && (
          <div className="py-3">
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Trending</h2>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
              {trendingCoaches.map((c) => (
                <Link
                  key={c.id + (c.isDb ? "-db" : "")}
                  to={`/coach/${c.id}`}
                  className="flex-shrink-0 w-[120px] text-center active:scale-[0.97] transition-transform"
                >
                  <div className="relative h-[120px] w-[120px] rounded-2xl overflow-hidden bg-secondary mx-auto mb-2">
                    {c.image ? (
                      <SafeImage src={c.image} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center"><Users className="h-8 w-8 text-muted-foreground/15" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {c.isVerified && (
                      <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 text-accent fill-accent" />
                      <span className="text-[9px] text-white font-bold">{c.rating}</span>
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-foreground truncate">{c.name}</p>
                  <p className="text-[9px] text-muted-foreground">{c.sport} · ₪{c.price}</p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const coachData = coaches.find((co) => co.id === c.id);
                      if (coachData) setBookingCoach(coachData);
                      else setBookingCoach({ id: c.id, name: c.name, image: c.image, price: c.price, rating: c.rating, sport: c.sport, tagline: c.tagline || "", location: c.location, bio: "", longBio: "", coachingStyle: "", idealFor: "", specialties: [], coverImage: c.image, reviewCount: 0, followers: c.followers, yearsExperience: 0, videos: [], reviews: [] });
                    }}
                    className="mt-1 w-full py-1.5 rounded-lg bg-brand-gradient text-white text-[9px] font-bold active:scale-95 transition-all"
                  >
                    Quick Book
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── RECOMMENDED ─── */}
        {!searchQuery && !isActive && allCoaches.length > 3 && (
          <div className="py-3 border-t border-border/5">
            <div className="flex items-center gap-2 px-4 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Recommended for You</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
              {allCoaches.slice(0, 6).map((c) => (
                <Link
                  key={c.id + "-rec"}
                  to={`/coach/${c.id}`}
                  className="flex-shrink-0 flex items-center gap-3 bg-card rounded-2xl border border-border/10 p-3 w-[250px] active:scale-[0.97] transition-transform"
                >
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                    {c.image ? <SafeImage src={c.image} alt={c.name} className="h-full w-full object-cover" loading="lazy" /> : <Users className="h-6 w-6 text-muted-foreground/20 m-auto mt-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                      {c.isVerified && <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{c.sport}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><Star className="h-2.5 w-2.5 text-accent fill-accent" />{c.rating}</span>
                      <span className="text-[10px] font-bold text-primary">₪{c.price}/hr</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── UPCOMING SESSIONS ─── */}
        {publicSessions.length > 0 && !searchQuery && !isActive && (
          <div className="py-3 border-t border-border/5">
            <div className="flex items-center gap-2 px-4 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Upcoming Sessions</h2>
              <span className="text-[10px] text-muted-foreground ml-auto">{publicSessions.length} available</span>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
              {publicSessions.map((s) => {
                const TypeIcon = s.session_type === "group" ? UsersRound : s.session_type === "small_group" ? Users : User;
                const spotsLeft = s.max_capacity - s.current_bookings;
                const dateObj = new Date(s.date + "T00:00:00");
                const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <Link
                    key={s.id}
                    to={`/coach/${s.coach_id}`}
                    className="flex-shrink-0 w-[220px] bg-card rounded-2xl border border-border/10 p-3 active:scale-[0.97] transition-transform"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                        {s.coach_image ? (
                          <SafeImage src={s.coach_image} alt={s.coach_name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate">{s.coach_name}</p>
                        <p className="text-[9px] text-muted-foreground capitalize">{s.coach_sport}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-foreground truncate mb-1">{s.title || "Training Session"}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>{dayLabel}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <Clock className="h-3 w-3" />
                      <span>{s.time_label || s.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className="h-3 w-3 text-primary" />
                        <span className="text-[9px] font-medium text-muted-foreground">
                          {s.session_type === "personal" ? "1-on-1" : s.session_type === "small_group" ? "Small Group" : "Group"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.price != null && <span className="text-[10px] font-bold text-primary">₪{s.price}</span>}
                        <span className="text-[9px] text-muted-foreground">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── MIXED DISCOVERY GRID ─── */}
        <div className="border-t border-border/5 pt-3">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-sm font-bold text-foreground">
              {searchQuery ? `Results for "${searchQuery}"` : isActive ? "Filtered Results" : "Explore"}
            </h2>
            <span className="text-[10px] text-muted-foreground">{gridItems.length} items</span>
          </div>

          {!hasResults ? (
            <div className="px-4 py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-base font-bold text-foreground mb-1">No results found</h3>
              <p className="text-xs text-muted-foreground mb-6">
                {isActive ? "Try adjusting your filters" : "Try a different search or explore categories"}
              </p>
              {isActive && (
                <button
                  onClick={clearAllFilters}
                  className="mb-4 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all"
                >
                  Clear All Filters
                </button>
              )}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {CATEGORIES.filter((c) => c !== "All").slice(0, 4).map((c) => (
                  <button key={c} onClick={() => { setCategory(c); setSearchQuery(""); clearAllFilters(); }} className="px-4 py-2 rounded-full bg-secondary text-xs font-semibold text-foreground active:scale-95 transition-all">{c}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-2 px-1 md:px-4">
                {gridItems.slice(0, gridVisible).map((item, i) => (
                  <GridTile key={item.id + "-" + i} item={item} size={sizeAt(i)} />
                ))}
              </div>
              {gridVisible < gridItems.length && (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══ FILTER BOTTOM SHEET ═══ */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={() => setShowFilters(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl animate-slide-up safe-area-bottom"
            style={{ maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="sticky top-0 bg-background rounded-t-3xl z-10 px-5 pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: "calc(88vh - 130px)" }}>
              {/* ── SPORT TYPE (multi-select) ── */}
              <div className="mb-7">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Sport Type</h3>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((sport) => {
                    const selected = draftFilters.sports.includes(sport);
                    return (
                      <button
                        key={sport}
                        onClick={() => toggleDraftSport(sport)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                          selected
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <span>{SPORT_ICONS[sport] || "🏅"}</span>
                        {sport}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── BUDGET RANGE ── */}
              <div className="mb-7">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Budget</h3>
                  <span className="text-xs font-bold text-primary">
                    ₪{draftFilters.priceRange[0]} – ₪{draftFilters.priceRange[1]}
                  </span>
                </div>
                <div className="px-1">
                  <Slider
                    min={0}
                    max={500}
                    step={10}
                    value={draftFilters.priceRange}
                    onValueChange={(val) => setDraftFilters((prev) => ({ ...prev, priceRange: [val[0], val[1]] as [number, number] }))}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">₪0</span>
                  <span className="text-[10px] text-muted-foreground">₪500</span>
                </div>
              </div>

              {/* ── RATING ── */}
              <div className="mb-7">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Minimum Rating</h3>
                <div className="flex gap-2">
                  {[
                    { label: "Any", value: 0 },
                    { label: "3.0+", value: 3 },
                    { label: "4.0+", value: 4 },
                    { label: "4.5+", value: 4.5 },
                    { label: "5.0", value: 5 },
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setDraftFilters((prev) => ({ ...prev, minRating: r.value }))}
                      className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                        draftFilters.minRating === r.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {r.value > 0 && <Star className="h-3 w-3 fill-current" />}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── AVAILABILITY ── */}
              <div className="mb-7">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Availability</h3>
                <div className="flex gap-2">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDraftFilters((prev) => ({ ...prev, availability: opt.value }))}
                      className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        draftFilters.availability === opt.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {opt.value !== "any" && <Calendar className="h-3 w-3" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── LOCATION ── */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Location</h3>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    value={draftFilters.location}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Tel Aviv, New York..."
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {draftFilters.location && (
                    <button
                      onClick={() => setDraftFilters((prev) => ({ ...prev, location: "" }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 flex items-center justify-center"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky bottom actions */}
            <div className="sticky bottom-0 bg-background border-t border-border/10 px-5 py-4 safe-area-bottom">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDraftFilters({ ...DEFAULT_FILTERS });
                  }}
                  className="flex-1 h-12 rounded-2xl bg-secondary text-sm font-bold text-muted-foreground active:scale-95 transition-all"
                >
                  Clear All
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-[2] h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingCoach && (
        <BookingModal isOpen={!!bookingCoach} onClose={() => setBookingCoach(null)} coachId={bookingCoach?.id} selectedDate={null} selectedTime={null} sessionType="individual" price={bookingCoach?.price || 0} />
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
};

export default Discover;
