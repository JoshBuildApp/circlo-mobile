import { useState, useRef, useEffect, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star, Calendar, Users, MessageCircle, Heart, Share2,
  MapPin, Clock, Award, CheckCircle2, Play, ChevronRight,
  Trophy, Zap, Shield, ArrowLeft, Bookmark, Eye, Video,
  Image as ImageIcon, ShoppingBag, Globe, Timer, Flame,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCoachPublicProfile } from "@/hooks/use-coach-public-profile";
import { useCoachReviews } from "@/hooks/use-coach-reviews";
import { useCoachVideos } from "@/hooks/use-coach-videos";
import { useFollow } from "@/hooks/use-follow";
import { useAvailability, useBlockedSlots, useBookedSlots, getNextAvailableFromSlots } from "@/hooks/use-availability";
import { useCoachProducts } from "@/hooks/use-products";
import { ShareCoachProfile } from "@/components/ShareCoachProfile";
import CoachCommunity from "@/components/CoachCommunity";
import CoachStore from "@/components/CoachStore";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════
   SPORT COLOR THEMES
   ═══════════════════════════════════════════════════════ */
const SPORT_THEMES: Record<string, { primary: string; ring: string; gradient: string; glow: string; badge: string }> = {
  boxing:         { primary: "#EF4444", ring: "ring-red-500/40",    gradient: "from-red-600 to-red-900",       glow: "shadow-red-500/20",    badge: "bg-red-500/15 text-red-400 border-red-500/20" },
  yoga:           { primary: "#A855F7", ring: "ring-purple-500/40", gradient: "from-purple-600 to-purple-900", glow: "shadow-purple-500/20", badge: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  padel:          { primary: "#00D4AA", ring: "ring-teal-400/40",   gradient: "from-teal-500 to-teal-800",     glow: "shadow-teal-500/20",   badge: "bg-teal-500/15 text-teal-400 border-teal-500/20" },
  tennis:         { primary: "#22C55E", ring: "ring-green-500/40",  gradient: "from-green-500 to-green-800",   glow: "shadow-green-500/20",  badge: "bg-green-500/15 text-green-400 border-green-500/20" },
  fitness:        { primary: "#FF6B2C", ring: "ring-orange-500/40", gradient: "from-orange-500 to-orange-800", glow: "shadow-orange-500/20", badge: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  soccer:         { primary: "#3B82F6", ring: "ring-blue-500/40",   gradient: "from-blue-500 to-blue-800",     glow: "shadow-blue-500/20",   badge: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  basketball:     { primary: "#F97316", ring: "ring-orange-400/40", gradient: "from-orange-400 to-orange-700", glow: "shadow-orange-400/20", badge: "bg-orange-400/15 text-orange-300 border-orange-400/20" },
  swimming:       { primary: "#06B6D4", ring: "ring-cyan-500/40",   gradient: "from-cyan-500 to-cyan-800",     glow: "shadow-cyan-500/20",   badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  running:        { primary: "#EAB308", ring: "ring-yellow-500/40", gradient: "from-yellow-500 to-yellow-800", glow: "shadow-yellow-500/20", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  mma:            { primary: "#DC2626", ring: "ring-red-600/40",    gradient: "from-red-700 to-red-950",       glow: "shadow-red-600/20",    badge: "bg-red-600/15 text-red-400 border-red-600/20" },
  crossfit:       { primary: "#F59E0B", ring: "ring-amber-500/40",  gradient: "from-amber-500 to-amber-800",   glow: "shadow-amber-500/20",  badge: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  "martial arts": { primary: "#991B1B", ring: "ring-red-800/40",    gradient: "from-red-800 to-red-950",       glow: "shadow-red-800/20",    badge: "bg-red-800/15 text-red-300 border-red-800/20" },
};
const DEFAULT_THEME = { primary: "#00D4AA", ring: "ring-teal-400/40", gradient: "from-[#1A1A2E] to-[#0F3460]", glow: "shadow-teal-500/20", badge: "bg-teal-500/15 text-teal-400 border-teal-500/20" };

const getSportTheme = (sport: string) => SPORT_THEMES[sport.toLowerCase()] || DEFAULT_THEME;

/* ═══════════════════════════════════════════════════════
   FORMAT HELPERS
   ═══════════════════════════════════════════════════════ */
const fmt = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : n.toString());

/* ═══════════════════════════════════════════════════════
   TAB TYPES
   ═══════════════════════════════════════════════════════ */
type TabKey = "videos" | "posts" | "about" | "reviews" | "store";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "videos",  label: "Videos",  icon: Video },
  { key: "posts",   label: "Posts",   icon: ImageIcon },
  { key: "about",   label: "About",   icon: Award },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "store",   label: "Store",   icon: ShoppingBag },
];

/* ═══════════════════════════════════════════════════════
   ANIMATION PRESETS
   ═══════════════════════════════════════════════════════ */
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
};

/* ═══════════════════════════════════════════════════════
   RATING STARS
   ═══════════════════════════════════════════════════════ */
const RatingStars = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(cls, i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-white/20")} />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   RATING BAR
   ═══════════════════════════════════════════════════════ */
const RatingBar = ({ star, count, total, color }: { star: number; count: number; total: number; color: string }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-white/50 text-xs">{star}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.1 * (5 - star) }}
        />
      </div>
      <span className="w-6 text-right text-white/40 text-xs">{count}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   VIDEO THUMBNAIL (auto-play on visible)
   ═══════════════════════════════════════════════════════ */
const VideoThumb = memo(({ video, onClick, sportColor }: {
  video: { id: string; title: string; media_url: string; media_type: string; thumbnail_url: string | null; views: number; duration?: number };
  onClick: () => void;
  sportColor: string;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<string>("");
  const isVideo = video.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(video.media_url);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { e.isIntersecting ? el.play().catch(() => {}) : el.pause(); },
      { threshold: 0.4 }
    );
    obs.observe(el);
    // Get duration from video metadata
    const onMeta = () => {
      if (el.duration && isFinite(el.duration)) {
        const mins = Math.floor(el.duration / 60);
        const secs = Math.floor(el.duration % 60);
        setDuration(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    };
    el.addEventListener("loadedmetadata", onMeta);
    return () => { obs.disconnect(); el.removeEventListener("loadedmetadata", onMeta); };
  }, []);

  return (
    <motion.button
      variants={cardVariant}
      onClick={onClick}
      className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-white/5 group active:scale-[0.97] transition-transform"
    >
      {isVideo ? (
        <video ref={ref} src={video.media_url} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline preload="metadata" />
      ) : (
        <img src={video.thumbnail_url || video.media_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {/* Play icon + duration badge */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
        {duration && (
          <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white tabular-nums">{duration}</span>
        )}
        {isVideo && (
          <div className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-3 w-3 text-white fill-white ml-[1px]" />
          </div>
        )}
      </div>
      {/* View count overlay */}
      {video.views > 0 && (
        <div className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm flex items-center gap-1">
          <Eye className="h-2.5 w-2.5 text-white/70" />
          <span className="text-[10px] font-bold text-white/80">{fmt(video.views)}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{video.title}</p>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: sportColor + "CC" }}>
          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
        </div>
      </div>
    </motion.button>
  );
});
VideoThumb.displayName = "VideoThumb";

/* ═══════════════════════════════════════════════════════
   POST THUMBNAIL (Instagram grid)
   ═══════════════════════════════════════════════════════ */
const PostThumb = memo(({ item, onClick }: {
  item: { id: string; title: string; media_url: string; thumbnail_url: string | null; views: number };
  onClick: () => void;
}) => (
  <motion.button
    variants={cardVariant}
    onClick={onClick}
    className="relative aspect-square rounded-xl overflow-hidden bg-white/5 group active:scale-[0.97] transition-transform"
  >
    <img
      src={item.thumbnail_url || item.media_url}
      alt={item.title}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3 text-white text-xs font-semibold">
        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{fmt(item.views)}</span>
      </div>
    </div>
  </motion.button>
));
PostThumb.displayName = "PostThumb";

/* ═══════════════════════════════════════════════════════
   HIGHLIGHT CIRCLE (Instagram stories style)
   ═══════════════════════════════════════════════════════ */
const HighlightCircle = ({ label, icon: Icon, color, delay }: { label: string; icon: React.ElementType; color: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.7 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    className="flex flex-col items-center gap-1.5 flex-shrink-0"
  >
    <div
      className="h-16 w-16 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-[#0D0D14]"
      style={{ backgroundColor: color + "20", borderColor: color, boxShadow: `0 0 0 2px ${color}` }}
    >
      <Icon className="h-6 w-6" style={{ color }} />
    </div>
    <span className="text-[10px] text-white/60 font-medium text-center max-w-[64px] line-clamp-1">{label}</span>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════
   DAY LABELS
   ═══════════════════════════════════════════════════════ */
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
const PublicCoachProfile = () => {
  const { id: coachId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("videos");
  const [showFullBio, setShowFullBio] = useState(false);
  const [playingMedia, setPlayingMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const { data: coach, isLoading, error } = useCoachPublicProfile(coachId);
  const { reviews, stats, loading: reviewsLoading } = useCoachReviews(coachId);
  const { videos: allContent, loading: videosLoading } = useCoachVideos(coachId);
  const { following, toggleFollow, loading: followLoading } = useFollow(coachId);
  const { availability } = useAvailability(coachId);
  const { blocked } = useBlockedSlots(coachId);
  const { bookedMap } = useBookedSlots(coachId);
  const { products } = useCoachProducts(coachId);

  const nextAvailable = availability.length > 0
    ? getNextAvailableFromSlots(availability, bookedMap, blocked)
    : null;

  const availableDays = new Set(
    availability.filter((s: { is_active?: boolean }) => s.is_active !== false).map((s: { day_of_week: number }) => s.day_of_week)
  );

  // Split content into videos and posts
  const videoItems = useMemo(() =>
    allContent.filter((v) => v.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(v.media_url)),
    [allContent]
  );
  const postItems = useMemo(() =>
    allContent.filter((v) => v.media_type === "image" || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(v.media_url)),
    [allContent]
  );

  // Loading state
  if (isLoading) return <ProfileSkeleton />;

  if (error || !coach) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-white/30" />
          </div>
          <h1 className="text-2xl font-bold text-white">Coach Not Found</h1>
          <p className="text-white/50">This profile may have been removed.</p>
          <button onClick={() => navigate("/discover")} className="px-6 py-2.5 rounded-xl bg-[#00D4AA] text-white font-semibold text-sm">
            Browse Coaches
          </button>
        </div>
      </div>
    );
  }

  const theme = getSportTheme(coach.sport || "");
  const averageRating = stats.count > 0 ? stats.average : (coach.rating || 0);
  const totalReviews = stats.count || 0;
  const bio = coach.bio || "";

  const handleAction = (path: string) => {
    if (!user) { navigate("/login"); return; }
    navigate(path);
  };

  // Build highlight items: certifications, years experience, sports, languages
  const highlights: { label: string; icon: React.ElementType }[] = [];
  if (coach.certifications) {
    coach.certifications.slice(0, 3).forEach((c: string) => highlights.push({ label: c, icon: Shield }));
  }
  if (coach.years_experience) {
    highlights.push({ label: `${coach.years_experience}+ Years`, icon: Award });
  }
  if (coach.sport) {
    highlights.push({ label: coach.sport, icon: Trophy });
  }
  if (coach.specialties) {
    coach.specialties.slice(0, 2).forEach((s: string) => highlights.push({ label: s, icon: Zap }));
  }
  if (coach.languages) {
    coach.languages.slice(0, 2).forEach((l: string) => highlights.push({ label: l, icon: Globe }));
  }
  if (coach.training_style) highlights.push({ label: coach.training_style, icon: Flame });

  return (
    <div className="min-h-screen bg-[#0D0D14] text-white">
      {/* ═══════ HERO BANNER ═══════ */}
      <div className="relative">
        {/* Cover image/video */}
        <div className={cn("h-56 md:h-72 w-full overflow-hidden bg-gradient-to-br", theme.gradient)}>
          {coach.intro_video_url ? (
            <video
              src={coach.intro_video_url}
              className="w-full h-full object-cover opacity-50"
              muted loop playsInline autoPlay
            />
          ) : coach.cover_media ? (
            <img src={coach.cover_media} alt="" className="w-full h-full object-cover opacity-40" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D14] via-[#0D0D14]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-24" />
        </div>

        {/* Top navigation */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 z-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
            <button className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-all">
              <Bookmark className="h-5 w-5" />
            </button>
            <ShareCoachProfile coachId={coachId!} coachName={coach.coach_name} className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-all" />
          </motion.div>
        </div>

        {/* Sport badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-14 left-4 z-10"
        >
          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold capitalize border", theme.badge)}>
            <Flame className="h-3 w-3" />{coach.sport}
          </span>
        </motion.div>

        {/* Profile info overlay */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto px-5 relative -mt-24"
        >
          <div className="flex items-end gap-4">
            {/* Avatar with sport-colored ring */}
            <div className="relative flex-shrink-0">
              <div className={cn("p-[3px] rounded-full ring-2", theme.ring)} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}88)` }}>
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-[3px] border-[#0D0D14]">
                  <AvatarImage src={coach.image_url || coach.profile_avatar || undefined} alt={coach.coach_name} />
                  <AvatarFallback className="text-2xl bg-white/10 text-white font-bold">
                    {coach.coach_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              {coach.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-[#0D0D14] rounded-full p-0.5">
                  <div className="rounded-full p-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30">
                    <Star className="h-3.5 w-3.5 text-white fill-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{coach.coach_name}</h1>
                {coach.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-yellow-400/30 text-[10px] font-bold text-yellow-400">
                    <Star className="h-2.5 w-2.5 fill-yellow-400" />Verified Coach
                  </span>
                )}
              </div>
              {coach.tagline && (
                <p className="text-white/50 text-sm mt-0.5 line-clamp-1">{coach.tagline}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="font-bold text-white">{fmt(coach.followers || 0)} <span className="font-normal text-white/40">followers</span></span>
                {averageRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-white">{averageRating.toFixed(1)}</span>
                    <span className="text-white/40">({totalReviews})</span>
                  </span>
                )}
                {coach.location && (
                  <span className="flex items-center gap-1 text-white/40">
                    <MapPin className="h-3 w-3" />{coach.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════ PRICE + BOOK BUTTON (impossible to miss) ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="max-w-3xl mx-auto px-5 pt-6 pb-2 space-y-3"
      >
        {/* Price display */}
        {coach.price && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-white/40 text-sm">from</span>
            <span className="text-2xl font-bold text-white">₪{coach.price}</span>
            <span className="text-white/40 text-sm">/ session</span>
          </div>
        )}

        {/* Full-width Book Button — 56px height, teal gradient */}
        <button
          onClick={() => user ? navigate(`/book/${coachId}`) : navigate("/login")}
          className="w-full h-14 rounded-2xl font-bold text-base text-white shadow-xl active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#00D4AA] to-[#00B894] shadow-[#00D4AA]/25"
        >
          <Calendar className="h-5 w-5" />
          Book Session
        </button>

        {/* Secondary actions */}
        <div className="flex gap-2.5">
          <button
            onClick={() => user ? toggleFollow() : navigate("/login")}
            disabled={followLoading}
            className={cn(
              "flex-1 h-12 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2",
              following
                ? "bg-white/10 text-white border border-white/10"
                : "bg-white text-[#0D0D14]"
            )}
          >
            <Heart className={cn("h-4 w-4", following && "fill-red-500 text-red-500")} />
            {following ? "Following" : "Follow"}
          </button>
          {coach.user_id && (
            <button
              onClick={() => handleAction(`/chat/${coach.user_id}`)}
              className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all flex-shrink-0"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Next available slot */}
      {nextAvailable && (
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="max-w-3xl mx-auto px-5 pb-2 pt-2">
          <button
            onClick={() => user ? navigate(`/book/${coachId}`) : navigate("/login")}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary + "20" }}>
              <Zap className="h-5 w-5" style={{ color: theme.primary }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Next Available</p>
              <p className="text-sm font-semibold text-white">
                {nextAvailable.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {nextAvailable.label}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </button>
        </motion.div>
      )}

      {/* ═══════ HIGHLIGHTS ROW (Instagram stories style) ═══════ */}
      {highlights.length > 0 && (
        <div className="max-w-3xl mx-auto px-5 py-5">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
            {highlights.map((h, i) => (
              <HighlightCircle key={h.label} label={h.label} icon={h.icon} color={theme.primary} delay={0.3 + i * 0.06} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════ YOUTUBE-STYLE TAB BAR (sticky) ═══════ */}
      <div ref={tabBarRef} className="sticky top-0 z-30 bg-[#0D0D14]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto flex px-5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3.5 relative transition-all",
                  isActive ? "text-white" : "text-white/30 hover:text-white/50"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-[20%] right-[20%] h-[3px] rounded-full"
                    style={{ backgroundColor: theme.primary }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════ TAB CONTENT ═══════ */}
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {/* ── VIDEOS TAB ── */}
          {activeTab === "videos" && (
            <motion.div key="videos" {...fadeUp} className="px-4 pt-5 pb-8">
              {videosLoading ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-[9/16] rounded-2xl bg-white/5" />)}
                </div>
              ) : videoItems.length === 0 ? (
                <div className="text-center py-20">
                  <Video className="h-14 w-14 text-white/10 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white/40">No videos yet</p>
                  <p className="text-xs text-white/20 mt-1">Training content will appear here</p>
                </div>
              ) : (
                <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-2 gap-2.5">
                  {videoItems.map((video) => (
                    <VideoThumb
                      key={video.id}
                      video={video}
                      sportColor={theme.primary}
                      onClick={() => navigate(`/reels?v=${video.id}`)}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── POSTS TAB (Instagram 3-col grid) ── */}
          {activeTab === "posts" && (
            <motion.div key="posts" {...fadeUp} className="px-4 pt-5 pb-8">
              {videosLoading ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="aspect-square rounded-xl bg-white/5" />)}
                </div>
              ) : postItems.length === 0 ? (
                <div className="text-center py-20">
                  <ImageIcon className="h-14 w-14 text-white/10 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white/40">No posts yet</p>
                  <p className="text-xs text-white/20 mt-1">Photos and content will appear here</p>
                </div>
              ) : (
                <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-3 gap-1.5">
                  {postItems.map((item) => (
                    <PostThumb
                      key={item.id}
                      item={item}
                      onClick={() => {
                        const isVid = /\.(mp4|mov|webm)(\?|$)/i.test(item.media_url);
                        setPlayingMedia({ url: item.media_url, isVideo: isVid });
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── ABOUT TAB ── */}
          {activeTab === "about" && (
            <motion.div key="about" {...fadeUp} className="px-5 pt-5 pb-8 space-y-4">
              {/* Bio */}
              {bio && (
                <motion.div variants={cardVariant} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: theme.primary }} />About
                  </h3>
                  <p className={cn("text-sm text-white/60 leading-relaxed", !showFullBio && bio.length > 200 && "line-clamp-3")}>
                    {bio}
                  </p>
                  {bio.length > 200 && (
                    <button onClick={() => setShowFullBio(!showFullBio)} className="text-xs font-semibold mt-2 flex items-center gap-1" style={{ color: theme.primary }}>
                      {showFullBio ? "Less" : "Read more"}
                      <ChevronDown className={cn("h-3 w-3 transition-transform", showFullBio && "rotate-180")} />
                    </button>
                  )}
                </motion.div>
              )}

              {/* Quick stats grid */}
              <motion.div variants={cardVariant} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Zap, label: "Sport", value: coach.sport },
                    { icon: MapPin, label: "Location", value: coach.location || "—" },
                    { icon: Clock, label: "Experience", value: coach.years_experience ? `${coach.years_experience}+ years` : "—" },
                    { icon: Timer, label: "Session", value: coach.session_duration ? `${coach.session_duration} min` : "60 min" },
                    { icon: Calendar, label: "Sessions", value: coach.total_sessions ? `${coach.total_sessions}+` : "—" },
                    { icon: MessageCircle, label: "Response", value: coach.response_time || "—" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        <stat.icon className="h-4 w-4 text-white/40" />
                      </div>
                      <div>
                        <p className="text-[9px] text-white/30 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-xs font-semibold text-white capitalize">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Specialties */}
              {coach.specialties && coach.specialties.length > 0 && (
                <motion.div variants={cardVariant} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" style={{ color: theme.primary }} />Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.map((s: string) => (
                      <span key={s} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ borderColor: theme.primary + "30", color: theme.primary, backgroundColor: theme.primary + "10" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Certifications */}
              {coach.certifications && coach.certifications.length > 0 && (
                <motion.div variants={cardVariant} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" style={{ color: theme.primary }} />Certifications
                  </h3>
                  <div className="space-y-2.5">
                    {coach.certifications.map((c: string) => (
                      <div key={c} className="flex items-center gap-2.5">
                        <Award className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
                        <span className="text-sm text-white/60">{c}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Languages */}
              {coach.languages && coach.languages.length > 0 && (
                <motion.div variants={cardVariant} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" style={{ color: theme.primary }} />Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {coach.languages.map((l: string) => (
                      <Badge key={l} className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-white/70 border-white/10">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Training details */}
              {(coach.training_style || coach.ideal_for) && (
                <motion.div variants={cardVariant} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-4">
                  {coach.training_style && (
                    <div>
                      <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Training Style</h3>
                      <p className="text-sm text-white/70">{coach.training_style}</p>
                    </div>
                  )}
                  {coach.ideal_for && (
                    <div>
                      <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Ideal For</h3>
                      <p className="text-sm text-white/70">{coach.ideal_for}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Availability grid */}
              {availability.length > 0 && (
                <motion.div variants={cardVariant} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" style={{ color: theme.primary }} />Weekly Availability
                  </h3>
                  <div className="grid grid-cols-7 gap-2">
                    {DAY_LABELS.map((day, i) => {
                      const hasSlots = availableDays.has(i);
                      return (
                        <div key={day} className={cn("flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs transition-colors", hasSlots ? "bg-white/5" : "bg-transparent")}>
                          <span className={hasSlots ? "text-white font-semibold" : "text-white/20"}>{day}</span>
                          <div className={cn("w-2 h-2 rounded-full")} style={{ backgroundColor: hasSlots ? theme.primary : "rgba(255,255,255,0.1)" }} />
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => user ? navigate(`/book/${coachId}`) : navigate("/login")}
                    className="w-full mt-4 h-11 rounded-xl border border-white/10 text-sm font-semibold text-white/70 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />View All Times
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── REVIEWS TAB ── */}
          {activeTab === "reviews" && (
            <motion.div key="reviews" {...fadeUp} className="px-5 pt-5 pb-8">
              {totalReviews > 0 ? (
                <div className="space-y-4">
                  {/* Rating Overview */}
                  <motion.div variants={cardVariant} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-white">{averageRating.toFixed(1)}</p>
                        <RatingStars rating={averageRating} size="md" />
                        <p className="text-xs text-white/30 mt-1.5">{totalReviews} reviews</p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <RatingBar
                            key={star}
                            star={star}
                            count={stats.distribution[star as 1|2|3|4|5] || 0}
                            total={totalReviews}
                            color={theme.primary}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Review list */}
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3">
                    {reviews.slice(0, 10).map((review) => (
                      <motion.div key={review.id} variants={cardVariant} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-xs bg-white/10 text-white">
                              {review.user_name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm text-white truncate">{review.user_name || "Anonymous"}</p>
                              <RatingStars rating={review.rating} />
                            </div>
                            {review.comment && (
                              <p className="text-sm text-white/50 mt-1.5 leading-relaxed">{review.comment}</p>
                            )}
                            <p className="text-[11px] text-white/20 mt-2">
                              {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <Star className="h-14 w-14 text-white/10 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white/40">No reviews yet</p>
                  <p className="text-xs text-white/20 mt-1">Be the first to train with {coach.coach_name}!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STORE TAB ── */}
          {activeTab === "store" && (
            <motion.div key="store" {...fadeUp} className="pt-2 pb-8">
              {products.length > 0 ? (
                <CoachStore products={products} coachName={coach.coach_name} coachId={coachId!} />
              ) : (
                <div className="text-center py-20 px-5">
                  <ShoppingBag className="h-14 w-14 text-white/10 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white/40">No products yet</p>
                  <p className="text-xs text-white/20 mt-1">{coach.coach_name}'s store is coming soon</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════ MEDIA PLAYER MODAL ═══════ */}
      <AnimatePresence>
        {playingMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setPlayingMedia(null)}
          >
            <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10 active:scale-90 transition-all">
              ✕
            </button>
            <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
              {playingMedia.isVideo ? (
                <video src={playingMedia.url} className="w-full rounded-2xl" controls autoPlay />
              ) : (
                <img src={playingMedia.url} alt="" className="w-full rounded-2xl object-contain max-h-[80vh]" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════ */
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-[#0D0D14]">
    <div className="h-56 bg-white/5" />
    <div className="max-w-3xl mx-auto px-5 -mt-24 space-y-6">
      <div className="flex items-end gap-4">
        <Skeleton className="h-28 w-28 rounded-full bg-white/5" />
        <div className="space-y-2 pb-1">
          <Skeleton className="h-7 w-48 bg-white/5" />
          <Skeleton className="h-4 w-32 bg-white/5" />
          <Skeleton className="h-4 w-24 bg-white/5" />
        </div>
      </div>
      <div className="flex gap-2.5">
        <Skeleton className="h-14 flex-1 rounded-2xl bg-white/5" />
        <Skeleton className="h-14 w-28 rounded-2xl bg-white/5" />
        <Skeleton className="h-14 w-14 rounded-2xl bg-white/5" />
      </div>
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-16 w-16 rounded-full bg-white/5" />
            <Skeleton className="h-3 w-12 bg-white/5" />
          </div>
        ))}
      </div>
      <div className="flex gap-0 border-b border-white/5 pb-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 py-3">
            <Skeleton className="h-5 w-5 rounded bg-white/5" />
            <Skeleton className="h-3 w-10 bg-white/5" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-[9/16] rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  </div>
);

export default PublicCoachProfile;
