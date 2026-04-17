import { Fragment, useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Star, Calendar, Users, MessageCircle, Heart, Share2,
  MapPin, Clock, Award, CheckCircle2, Play, ChevronRight,
  Trophy, Zap, Shield, ArrowLeft, Bookmark, Eye, Video,
  Image as ImageIcon, ShoppingBag, Globe, Timer, Flame,
  ChevronDown, TrendingUp, Sparkles, Package, Users2, X,
  GripVertical, EyeOff, Plus, Trash2, Save, Undo2, Activity, Pencil,
  ArrowUp, ArrowDown, LayoutGrid, Type, Hash, Square, Minus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestGate } from "@/contexts/GuestGateContext";
import { useCoachPublicProfile } from "@/hooks/use-coach-public-profile";
import { useCoachReviews } from "@/hooks/use-coach-reviews";
import { useCoachVideos } from "@/hooks/use-coach-videos";
import { useFollow } from "@/hooks/use-follow";
import { useFollowerCount } from "@/hooks/use-follower-counts";
import { useProfileViewTracker } from "@/hooks/use-rate-limits";
import {
  useAvailability, useBlockedSlots, useBookedSlots, getNextAvailableFromSlots,
} from "@/hooks/use-availability";
import { useCoachProducts } from "@/hooks/use-products";
import { useHubSettings, getThemeColors, type PinnedItem } from "@/hooks/use-hub-settings";
import { usePageSections, SECTION_OPTIONS, type PageSection } from "@/hooks/use-page-sections";
import { supabase } from "@/integrations/supabase/client";
import CoachStore from "@/components/CoachStore";
import CoachCommunity from "@/components/CoachCommunity";
import CoachPackagesSection from "@/components/CoachPackagesSection";
import BookingCalendar from "@/components/BookingCalendar";
import OpenTrainings from "@/components/OpenTrainings";
import { BookingModal } from "@/components/BookingModal";
import FollowersModal from "@/components/FollowersModal";
import HubSettingsEditor from "@/components/HubSettingsEditor";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ══════════════ SPORT THEMES ══════════════ */
const SPORT_THEMES: Record<string, { primary: string; gradient: string; badge: string }> = {
  boxing:         { primary: "#EF4444", gradient: "from-red-600 to-red-900",       badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  yoga:           { primary: "#A855F7", gradient: "from-purple-600 to-purple-900", badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  padel:          { primary: "#00D4AA", gradient: "from-teal-500 to-teal-800",     badge: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
  tennis:         { primary: "#22C55E", gradient: "from-green-500 to-green-800",   badge: "bg-green-500/15 text-green-400 border-green-500/30" },
  fitness:        { primary: "#FF6B2C", gradient: "from-orange-500 to-orange-800", badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  soccer:         { primary: "#3B82F6", gradient: "from-blue-500 to-blue-800",     badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  basketball:     { primary: "#F97316", gradient: "from-orange-400 to-orange-700", badge: "bg-orange-400/15 text-orange-300 border-orange-400/30" },
  swimming:       { primary: "#06B6D4", gradient: "from-cyan-500 to-cyan-800",     badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  running:        { primary: "#EAB308", gradient: "from-yellow-500 to-yellow-800", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  mma:            { primary: "#DC2626", gradient: "from-red-700 to-red-950",       badge: "bg-red-600/15 text-red-400 border-red-600/30" },
  crossfit:       { primary: "#F59E0B", gradient: "from-amber-500 to-amber-800",   badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  "martial arts": { primary: "#991B1B", gradient: "from-red-800 to-red-950",       badge: "bg-red-800/15 text-red-300 border-red-800/30" },
};
const DEFAULT_THEME = { primary: "#00D4AA", gradient: "from-[#1A1A2E] to-[#0F3460]", badge: "bg-teal-500/15 text-teal-400 border-teal-500/30" };
const getSportTheme = (sport?: string) => (sport && SPORT_THEMES[sport.toLowerCase()]) || DEFAULT_THEME;

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`
  : String(n);

/* ══════════════ SUB-COMPONENTS ══════════════ */

const RatingStars = memo(({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(cls, i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")}
        />
      ))}
    </div>
  );
});
RatingStars.displayName = "RatingStars";

const RatingBar = ({ star, count, total, color }: { star: number; count: number; total: number; color: string }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-muted-foreground text-xs">{star}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 * (5 - star) }}
        />
      </div>
      <span className="w-6 text-right text-muted-foreground text-xs">{count}</span>
    </div>
  );
};

type MediaItem = {
  id: string;
  title: string;
  description?: string | null;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  views: number;
  created_at?: string;
};

/* Video thumbnail with inline expand-to-play */
const VideoThumb = memo(({ video, sportColor }: { video: MediaItem; sportColor: string }) => {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const el = previewRef.current;
    if (!el || expanded) return;
    const obs = new IntersectionObserver(
      ([e]) => { e.isIntersecting ? el.play().catch(() => {}) : el.pause(); },
      { threshold: 0.4 }
    );
    obs.observe(el);
    const onMeta = () => {
      if (el.duration && isFinite(el.duration)) {
        const m = Math.floor(el.duration / 60);
        const s = Math.floor(el.duration % 60);
        setDuration(`${m}:${s.toString().padStart(2, "0")}`);
      }
    };
    el.addEventListener("loadedmetadata", onMeta);
    return () => { obs.disconnect(); el.removeEventListener("loadedmetadata", onMeta); };
  }, [expanded]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative rounded-2xl overflow-hidden bg-white/5 group",
        expanded ? "aspect-video col-span-2" : "aspect-[9/16]"
      )}
    >
      {expanded ? (
        <video
          src={video.media_url}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          controls
          autoPlay
          playsInline
        />
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute inset-0 w-full h-full active:scale-[0.97] transition-transform"
        >
          <video
            ref={previewRef}
            src={video.media_url}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {duration && (
              <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white tabular-nums">
                {duration}
              </span>
            )}
            <div className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-3 w-3 text-white fill-white ml-[1px]" />
            </div>
          </div>
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
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: sportColor + "CC" }}
            >
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </button>
      )}
      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center z-10"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
});
VideoThumb.displayName = "VideoThumb";

/* Large featured video — spotlight at top of Media section */
const FeaturedVideo = memo(({ video, sportColor, onExpand }: {
  video: MediaItem;
  sportColor: string;
  onExpand: () => void;
}) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { e.isIntersecting ? el.play().catch(() => {}) : el.pause(); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <motion.button
      type="button"
      onClick={onExpand}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black group active:scale-[0.99] transition-transform shadow-2xl"
    >
      <video
        ref={ref}
        src={video.media_url}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/20 backdrop-blur-md"
          style={{ backgroundColor: sportColor + "CC" }}
        >
          Featured
        </span>
        {video.views > 0 && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white">
            <Eye className="h-3 w-3" />{fmt(video.views)}
          </span>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-left">
        <p className="text-white font-bold text-base md:text-2xl leading-tight line-clamp-2 drop-shadow-lg">
          {video.title}
        </p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div
          className="h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm"
          style={{ backgroundColor: sportColor + "E6" }}
        >
          <Play className="h-7 w-7 md:h-8 md:w-8 text-white fill-white ml-1" />
        </div>
      </div>
    </motion.button>
  );
});
FeaturedVideo.displayName = "FeaturedVideo";

/* Rotating live-activity pill */
const ActivityPulse = ({ events, color }: { events: string[]; color: string }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (events.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % events.length), 4200);
    return () => clearInterval(t);
  }, [events.length]);
  if (events.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span
        className="relative flex h-2 w-2 flex-shrink-0"
        style={{ color }}
      >
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[11px] font-semibold text-foreground/80 truncate"
        >
          {events[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

/* Extract dominant vivid color from an image URL (browser-only) */
const extractVividColor = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 60;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0, g = 0, b = 0, c = 0;
        let rv = 0, gv = 0, bv = 0, cv = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2], pa = data[i + 3];
          if (pa < 128) continue;
          r += pr; g += pg; b += pb; c++;
          const mx = Math.max(pr, pg, pb), mn = Math.min(pr, pg, pb);
          if (mx - mn > 45 && mx > 60 && mx < 240) {
            rv += pr; gv += pg; bv += pb; cv++;
          }
        }
        if (c === 0) return resolve(null);
        const fr = cv > 8 ? Math.round(rv / cv) : Math.round(r / c);
        const fg = cv > 8 ? Math.round(gv / cv) : Math.round(g / c);
        const fb = cv > 8 ? Math.round(bv / cv) : Math.round(b / c);
        const hex = `#${fr.toString(16).padStart(2, "0")}${fg.toString(16).padStart(2, "0")}${fb.toString(16).padStart(2, "0")}`;
        resolve(hex);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

/* Small square thumbnail (for compact grids) */
const PostThumb = memo(({ item, onClick }: { item: MediaItem; onClick: () => void }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3 }}
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
    {item.views > 0 && (
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="flex items-center gap-1 text-white text-xs font-semibold">
          <Eye className="h-3.5 w-3.5" />{fmt(item.views)}
        </span>
      </div>
    )}
  </motion.button>
));
PostThumb.displayName = "PostThumb";

/* Full post card — image on top, then title, description, meta row */
const PostCard = memo(({ item, onClick }: { item: MediaItem; onClick: () => void }) => {
  const createdLabel = item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="bg-card/60 border border-border rounded-2xl overflow-hidden flex flex-col hover:border-border transition-colors"
    >
      <button
        type="button"
        onClick={onClick}
        className="relative w-full aspect-square bg-muted/30 overflow-hidden active:scale-[0.99] transition-transform group"
      >
        <img
          src={item.thumbnail_url || item.media_url}
          alt={item.title || ""}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />
      </button>
      <div className="p-4 space-y-2">
        {item.title && (
          <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{item.title}</h4>
        )}
        {item.description && (
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground/80">
          {item.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {fmt(item.views)}
            </span>
          )}
          {createdLabel && (
            <>
              {item.views > 0 && <span className="opacity-40">·</span>}
              <span>{createdLabel}</span>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
});
PostCard.displayName = "PostCard";

/* Section wrapper with header + id for scroll-spy */
const HubSection = ({
  id, icon: Icon, title, actionLabel, onAction, color, children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  color: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-20 px-4 md:px-6 py-8 w-full">
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: color + "20" }}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{title}</h2>
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {actionLabel} <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      {children}
    </div>
  </section>
);

/* Weekly availability heatmap */
const AvailabilityHeatmap = ({
  availability, color, onSlotClick,
}: {
  availability: Array<{ day_of_week: number; start_time: string; is_active?: boolean }>;
  color: string;
  onSlotClick: () => void;
}) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = [8, 10, 12, 14, 16, 18, 20];
  const grid = useMemo(() => {
    const g: Record<number, Set<number>> = {};
    availability.forEach((s) => {
      if (s.is_active === false) return;
      const hour = parseInt(s.start_time.slice(0, 2), 10);
      const dow = s.day_of_week === 0 ? 6 : s.day_of_week - 1;
      if (!g[dow]) g[dow] = new Set();
      g[dow].add(hour);
    });
    return g;
  }, [availability]);

  return (
    <div className="bg-card/50 border border-border rounded-2xl p-4 overflow-x-auto">
      <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1.5 min-w-[420px]">
        <div />
        {days.map((d) => (
          <div key={d} className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
        {hours.map((h) => (
          <Fragment key={`row-${h}`}>
            <div className="text-[10px] font-semibold text-muted-foreground text-right pr-2 flex items-center justify-end">
              {h % 12 || 12}{h >= 12 ? "pm" : "am"}
            </div>
            {days.map((_, d) => {
              const available = grid[d]?.has(h) || grid[d]?.has(h + 1);
              return (
                <button
                  key={`${h}-${d}`}
                  onClick={available ? onSlotClick : undefined}
                  disabled={!available}
                  className={cn(
                    "h-7 rounded-md transition-all border",
                    available
                      ? "cursor-pointer hover:scale-110 active:scale-95"
                      : "bg-muted/40 border-border/30 opacity-60 cursor-default"
                  )}
                  style={available ? {
                    backgroundColor: color + "40",
                    borderColor: color + "80",
                  } : undefined}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

type SimilarCoach = {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  location: string | null;
  price: number | null;
  rating: number | null;
};

const SimilarCoachesRail = ({ coaches }: { coaches: SimilarCoach[] }) => {
  if (coaches.length === 0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:-mx-6 md:px-6 snap-x">
      {coaches.map((c) => (
        <Link
          key={c.id}
          to={`/coach/${c.id}`}
          className="flex-shrink-0 w-[160px] rounded-2xl overflow-hidden bg-card border border-border/30 group snap-start"
        >
          <div className="aspect-[4/5] bg-muted relative overflow-hidden">
            {c.image_url ? (
              <img
                src={c.image_url}
                alt={c.coach_name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <p className="text-white text-xs font-bold leading-tight line-clamp-1">{c.coach_name}</p>
              <p className="text-white/70 text-[10px] capitalize">{c.sport}</p>
            </div>
          </div>
          <div className="px-2.5 py-2 flex items-center justify-between">
            {c.rating ? (
              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {c.rating.toFixed(1)}
              </span>
            ) : <span />}
            {c.price && (
              <span className="text-[11px] font-bold" style={{ color: "#FF8C4A" }}>₪{c.price}</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

/* ══════════════ MAIN ══════════════ */

interface PublicCoachProfileProps {
  isPreview?: boolean;
  previewCoachId?: string;
  isEditing?: boolean;
  onExitEdit?: () => void;
}

const HUB_TABS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: "media",     label: "Media",     icon: Video },
  { id: "about",     label: "About",     icon: Award },
  { id: "reviews",   label: "Reviews",   icon: Star },
  { id: "schedule",  label: "Schedule",  icon: Calendar },
  { id: "packages",  label: "Packages",  icon: Package },
  { id: "store",     label: "Store",     icon: ShoppingBag },
  { id: "community", label: "Community", icon: Users2 },
];

const PublicCoachProfile = ({
  isPreview = false,
  previewCoachId,
  isEditing: isEditingProp = false,
  onExitEdit,
}: PublicCoachProfileProps = {}) => {
  const [localEditing, setLocalEditing] = useState(false);
  const isEditing = isEditingProp || localEditing;
  const { id: routeId } = useParams<{ id: string }>();
  const coachId = previewCoachId || routeId;
  const { user } = useAuth();
  const { requireAuth } = useGuestGate();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("media");
  const [showFullBio, setShowFullBio] = useState(false);
  const [reviewsShown, setReviewsShown] = useState(10);
  const [playingMedia, setPlayingMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersTab, setFollowersTab] = useState<"followers" | "following">("followers");
  const [showBottomBar, setShowBottomBar] = useState(false);
  const [similarCoaches, setSimilarCoaches] = useState<SimilarCoach[]>([]);
  const [extractedColor, setExtractedColor] = useState<string | null>(null);
  const [activityEvents, setActivityEvents] = useState<string[]>([]);
  const [localSections, setLocalSections] = useState<PageSection[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [figureUrl, setFigureUrl] = useState<string | null>(null);
  const [figureUploading, setFigureUploading] = useState(false);
  const figureFileRef = useRef<HTMLInputElement>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const { data: coach, isLoading, error } = useCoachPublicProfile(coachId);
  const { reviews, stats, loading: reviewsLoading } = useCoachReviews(coachId);
  const { videos: allContent, loading: videosLoading } = useCoachVideos(coachId);
  const { following, toggleFollow, loading: followLoading } = useFollow(coachId);
  const { followerCount, refreshCount } = useFollowerCount(coachId);
  const { trackView } = useProfileViewTracker();
  const { availability } = useAvailability(coachId);
  const { blocked } = useBlockedSlots(coachId);
  const { bookedMap } = useBookedSlots(coachId);
  const { products } = useCoachProducts(coachId);
  const { settings: hubSettings } = useHubSettings(coach?.user_id);
  const hubTheme = getThemeColors(hubSettings.theme_preset, hubSettings.accent_color);
  const { sections: savedSections, saveSections, loadSections } = usePageSections(coachId);

  const sportTheme = getSportTheme(coach?.sport);
  const theme = useMemo(
    () => (extractedColor ? { ...sportTheme, primary: extractedColor } : sportTheme),
    [extractedColor, sportTheme]
  );

  /* Parallax — window scroll drives hero transforms */
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 400], [1.05, 1.2]);
  const heroY = useTransform(scrollY, [0, 400], [0, -40]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.4]);
  const profileCardY = useTransform(scrollY, [0, 300], [0, -12]);

  /* Split content into videos and image posts */
  const videoItems = useMemo<MediaItem[]>(() =>
    (allContent || []).filter((v: any) =>
      v.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(v.media_url || "")
    ), [allContent]);
  const postItems = useMemo<MediaItem[]>(() =>
    (allContent || []).filter((v: any) =>
      v.media_type === "image" || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(v.media_url || "")
    ), [allContent]);

  const averageRating = coach && stats.count > 0 ? stats.average : (coach?.rating || 0);
  const totalReviews = stats.count || 0;
  const bio = coach?.bio || "";

  const followers = followerCount > 0 ? followerCount : (coach?.followers || 0);
  const price = coach?.price || 0;
  const sessionDuration = coach?.session_duration || 60;

  const nextAvailable = availability.length > 0
    ? getNextAvailableFromSlots(availability, bookedMap, blocked)
    : null;

  const isOwner = !!user && !!coach && coach.user_id === user.id;
  const isEditable = isOwner && isEditing;

  const isOnline = useMemo(() => {
    const last = coach?.updated_at ? new Date(coach.updated_at) : null;
    if (!last) return false;
    return (Date.now() - last.getTime()) / (1000 * 60 * 60) <= 24;
  }, [coach?.updated_at]);

  const topReviews = useMemo(() => {
    if (!reviews.length) return [];
    return [...reviews]
      .sort((a, b) => ((b as any).helpful_count || 0) - ((a as any).helpful_count || 0))
      .slice(0, 2);
  }, [reviews]);

  /* Preview-aware action wrapper */
  const previewAction = useCallback(
    (action: () => void, tooltipMsg?: string) => {
      if (isPreview) {
        if (tooltipMsg) toast.info(tooltipMsg, { duration: 2000 });
        return;
      }
      action();
    },
    [isPreview]
  );

  /* Track profile view (not in preview mode) */
  useEffect(() => {
    if (isPreview || !coachId) return;
    trackView(coachId);
  }, [coachId, isPreview, trackView]);

  /* Extract dominant vivid color from cover image */
  useEffect(() => {
    const url = coach?.cover_media;
    if (!url) { setExtractedColor(null); return; }
    let cancelled = false;
    extractVividColor(url).then((c) => { if (!cancelled && c) setExtractedColor(c); });
    return () => { cancelled = true; };
  }, [coach?.cover_media]);

  /* Seed figure URL from hub settings when it loads */
  useEffect(() => {
    const fromHub = (hubSettings as any)?.figure_url as string | undefined;
    if (fromHub) setFigureUrl(fromHub);
  }, [hubSettings]);

  /* Live activity events — aggregate recent counts into display strings.
     Each query is individually error-tolerant so a missing table/column
     never breaks the page. */
  useEffect(() => {
    if (!coachId || !coach) return;
    let cancelled = false;
    (async () => {
      const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const safeCount = async (promise: Promise<{ count: number | null; error: unknown }>): Promise<number> => {
        try {
          const res = await promise;
          if (res.error) return 0;
          return res.count ?? 0;
        } catch {
          return 0;
        }
      };

      const [bCount, fCount, vCount] = await Promise.all([
        safeCount(
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("coach_id", coachId)
            .gte("created_at", since24) as unknown as Promise<{ count: number | null; error: unknown }>
        ),
        safeCount(
          supabase
            .from("user_follows")
            .select("id", { count: "exact", head: true })
            .eq("coach_id", coachId)
            .gte("created_at", since7d) as unknown as Promise<{ count: number | null; error: unknown }>
        ),
        safeCount(
          supabase
            .from("profile_views")
            .select("id", { count: "exact", head: true })
            .eq("coach_profile_id", coachId)
            .gte("created_at", since24) as unknown as Promise<{ count: number | null; error: unknown }>
        ),
      ]);

      if (cancelled) return;
      const events: string[] = [];
      if (bCount > 0) events.push(`${bCount} ${bCount === 1 ? "session" : "sessions"} booked in the last 24h`);
      if (vCount > 0) events.push(`${vCount} ${vCount === 1 ? "person" : "people"} viewed this profile today`);
      if (fCount > 0) events.push(`${fCount} new ${fCount === 1 ? "follower" : "followers"} this week`);
      if (coach.response_time) events.push(`Usually responds in ${coach.response_time}`);
      if (isOnline) events.push("Active in the last 24h");
      if (events.length === 0 && totalReviews > 0) {
        events.push(`Rated ${averageRating.toFixed(1)} by ${totalReviews} ${totalReviews === 1 ? "athlete" : "athletes"}`);
      }
      setActivityEvents(events);
    })();
    return () => { cancelled = true; };
  }, [coachId, coach, isOnline, averageRating, totalReviews]);

  /* Sync local sections from saved sections for edit mode */
  useEffect(() => {
    if (savedSections.length === 0) return;
    setLocalSections(savedSections);
  }, [savedSections]);

  /* Reset dirty when exiting edit mode */
  useEffect(() => {
    if (!isEditing) setLocalSections(savedSections);
  }, [isEditing, savedSections]);

  /* Section editing helpers */
  const reorderSection = useCallback((from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setLocalSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((s, i) => ({ ...s, position: i }));
    });
  }, []);

  const toggleSectionVisible = useCallback((idx: number) => {
    setLocalSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, is_visible: !s.is_visible } : s))
    );
  }, []);

  const addSectionOfType = useCallback((type: string) => {
    setLocalSections((prev) => {
      // If section already exists (just hidden), unhide it
      const existing = prev.findIndex((s) => s.section_type === type);
      if (existing >= 0) {
        return prev.map((s, i) => (i === existing ? { ...s, is_visible: true } : s));
      }
      return [
        ...prev,
        {
          id: `new-${Date.now()}`,
          coach_id: coachId || "",
          section_type: type,
          position: prev.length,
          layout_size: "full",
          is_visible: true,
          config: {},
        },
      ];
    });
    setAddSheetOpen(false);
  }, [coachId]);

  const handleSaveLayout = useCallback(async () => {
    setSaving(true);
    await saveSections(localSections);
    setSaving(false);
  }, [localSections, saveSections]);

  const handleRevertLayout = useCallback(() => {
    setLocalSections(savedSections);
    toast.info("Reverted to saved layout");
  }, [savedSections]);

  const handleExitEdit = useCallback(() => {
    setLocalEditing(false);
    onExitEdit?.();
  }, [onExitEdit]);

  const isDirty = useMemo(() => {
    if (savedSections.length !== localSections.length) return true;
    return savedSections.some(
      (s, i) =>
        s.section_type !== localSections[i]?.section_type ||
        s.is_visible !== localSections[i]?.is_visible
    );
  }, [savedSections, localSections]);

  /* Which sections actually render, in order */
  const sectionsToRender = useMemo(() => {
    const source = isEditing ? localSections : savedSections;
    if (source.length === 0) return [];
    return isEditing ? source : source.filter((s) => s.is_visible);
  }, [isEditing, localSections, savedSections]);

  const hiddenSectionTypes = useMemo(
    () => SECTION_OPTIONS.filter((o) => !localSections.some((s) => s.section_type === o.type && s.is_visible)),
    [localSections]
  );

  /* Fetch similar coaches (same sport, different id) */
  useEffect(() => {
    if (!coach?.sport || !coachId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, location, price, rating")
        .eq("sport", coach.sport)
        .neq("id", coachId)
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(8);
      if (!cancelled && data) setSimilarCoaches(data as SimilarCoach[]);
    })();
    return () => { cancelled = true; };
  }, [coach?.sport, coachId]);

  /* SEO meta tags (skip in preview) */
  useEffect(() => {
    if (!coach || isPreview) return;
    const title = `${coach.coach_name} — ${coach.sport || "Fitness"} Coach | Circlo`;
    document.title = title;
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      coach.tagline ||
        `${coach.coach_name} is a ${coach.sport || "fitness"} coach on Circlo. ${
          totalReviews > 0 ? `Rated ${averageRating.toFixed(1)}/5 by ${totalReviews} athletes.` : ""
        } Book a session today.`
    );
    const setMeta = (prop: string, val: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      el.setAttribute("content", val);
    };
    setMeta("og:title", title);
    setMeta("og:url", `https://circloclub.com/coach/${coachId}`);
    if (coach.image_url) setMeta("og:image", coach.image_url);
    return () => {
      document.title = "Circlo";
    };
  }, [coach?.coach_name, coach?.sport, coach?.tagline, coach?.image_url, totalReviews, averageRating, coachId, isPreview]);

  /* Scroll-spy: observe section visibility to highlight active tab */
  useEffect(() => {
    if (!coach) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    HUB_TABS.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [coach]);

  /* Show bottom bar once hero CTA scrolls out of view */
  useEffect(() => {
    const el = heroCtaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowBottomBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [coach]);

  const handleTabClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleShare = async () => {
    const shareUrl = `https://circloclub.com/coach/${coachId}`;
    const shareData = { title: `${coach?.coach_name} — Circlo`, url: shareUrl };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
      toast.success("Link copied to clipboard!");
    }
  };

  const handleBook = () =>
    previewAction(() => {
      requireAuth(!!user, () => setBookingOpen(true), `/book/${coachId}`);
    }, "Preview only — users can tap this to book");
  const handleFollow = () =>
    previewAction(async () => {
      requireAuth(
        !!user,
        async () => { await toggleFollow(); refreshCount(); },
        `/coach/${coachId}`,
      );
    }, "Preview only — users can tap this to follow");
  const handleMessage = () =>
    previewAction(() => {
      requireAuth(
        !!user,
        () => { if (coach?.user_id) navigate(`/chat/${coach.user_id}`); },
        `/coach/${coachId}`,
      );
    }, "Preview only — users can tap this to message you");

  if (isLoading) return <ProfileSkeleton />;

  if (error || !coach) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Coach Not Found</h1>
          <p className="text-muted-foreground">This profile may have been removed.</p>
          <button
            onClick={() => navigate("/discover")}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            Browse Coaches
          </button>
        </div>
      </div>
    );
  }

  const bioIsLong = bio.length > 180;
  const displayedReviews = reviews.slice(0, reviewsShown);

  /* ── Layout style → visible differences (width, gap, density) ── */
  const layoutStyle = (hubSettings.layout_style as string) || "default";
  const layoutConfig = {
    default:        { wrap: "max-w-6xl",  gap: "gap-4",  density: "" },
    grid:           { wrap: "max-w-7xl",  gap: "gap-3",  density: "[&_section]:py-5" },
    magazine:       { wrap: "max-w-5xl",  gap: "gap-6",  density: "[&_section]:py-12 [&_h2]:text-2xl [&_h2]:md:text-3xl" },
    "minimal-card": { wrap: "max-w-4xl",  gap: "gap-3",  density: "[&_section]:py-5" },
  } as const;
  const layoutPreset =
    layoutConfig[layoutStyle as keyof typeof layoutConfig] ?? layoutConfig.default;
  const layoutWrapClass = layoutPreset.wrap;
  const layoutGapClass = cn(layoutPreset.gap, layoutPreset.density);

  /* ── Section size helper (plain fn — no hook) ── */
  type SectionSize = "quarter" | "half" | "full";
  const setSectionSize = (idx: number, size: SectionSize) => {
    setLocalSections((prev) => prev.map((s, i) => (i === idx ? { ...s, layout_size: size } : s)));
  };

  /* ── Custom-section element helpers (plain fns — no hooks) ── */
  type CustomElement =
    | { id: string; type: "heading"; text: string }
    | { id: string; type: "text"; content: string }
    | { id: string; type: "image"; url: string; caption?: string }
    | { id: string; type: "button"; label: string; url: string }
    | { id: string; type: "divider" };

  const genElId = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const updateSectionConfig = (
    idx: number,
    updater: (cfg: Record<string, unknown>) => Record<string, unknown>
  ) => {
    setLocalSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, config: updater(s.config || {}) } : s))
    );
  };

  const addCustomElement = (sectionId: string, type: CustomElement["type"]) => {
    const idx = localSections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const newEl: CustomElement =
      type === "heading"
        ? { id: genElId(), type, text: "New heading" }
        : type === "text"
        ? { id: genElId(), type, content: "Write something here…" }
        : type === "image"
        ? { id: genElId(), type, url: "" }
        : type === "button"
        ? { id: genElId(), type, label: "Click me", url: "" }
        : { id: genElId(), type: "divider" };
    updateSectionConfig(idx, (cfg) => ({
      ...cfg,
      elements: [...(((cfg.elements as CustomElement[]) || [])), newEl],
    }));
  };

  const updateCustomElement = (sectionId: string, elId: string, patch: Partial<CustomElement>) => {
    const idx = localSections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    updateSectionConfig(idx, (cfg) => ({
      ...cfg,
      elements: ((cfg.elements as CustomElement[]) || []).map((e) =>
        e.id === elId ? ({ ...e, ...patch } as CustomElement) : e
      ),
    }));
  };

  const removeCustomElement = (sectionId: string, elId: string) => {
    const idx = localSections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    updateSectionConfig(idx, (cfg) => ({
      ...cfg,
      elements: ((cfg.elements as CustomElement[]) || []).filter((e) => e.id !== elId),
    }));
  };

  const moveCustomElement = (sectionId: string, from: number, direction: -1 | 1) => {
    const idx = localSections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    updateSectionConfig(idx, (cfg) => {
      const els = [...((cfg.elements as CustomElement[]) || [])];
      const to = from + direction;
      if (to < 0 || to >= els.length) return cfg;
      const [moved] = els.splice(from, 1);
      els.splice(to, 0, moved);
      return { ...cfg, elements: els };
    });
  };

  /* Add an empty custom section */
  const addCustomSection = () => {
    setLocalSections((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        coach_id: coachId || "",
        section_type: "custom",
        position: prev.length,
        layout_size: "full",
        is_visible: true,
        config: {
          title: "Custom Section",
          elements: [
            { id: genElId(), type: "heading", text: "A new section" },
            { id: genElId(), type: "text", content: "Add whatever you want here." },
          ],
        },
      },
    ]);
    setAddSheetOpen(false);
  };

  /* ── Figure image upload helpers (plain fns — no hooks) ── */
  const handleFigureUpload = async (file: File) => {
    if (!coach?.user_id) {
      toast.error("Missing coach profile — reload and try again");
      return;
    }
    if (!user || user.id !== coach.user_id) {
      toast.error("You can only upload a figure to your own profile");
      return;
    }
    setFigureUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${coach.user_id}/figure-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("coach-videos")
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        console.error("[figure upload] storage error:", upErr);
        toast.error(`Upload failed: ${upErr.message}`);
        return;
      }
      const { data: urlData } = supabase.storage.from("coach-videos").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      setFigureUrl(publicUrl);
      const { error: upsertErr } = await supabase
        .from("coach_hub_settings")
        .upsert(
          { coach_id: coach.user_id, figure_url: publicUrl } as any,
          { onConflict: "coach_id" }
        );
      if (upsertErr) {
        console.error("[figure upload] persist error:", upsertErr);
        toast.error(`Figure saved to storage but DB write failed: ${upsertErr.message}`);
        return;
      }
      // Rehydrate the hub settings so the figure survives navigation
      // refreshHubSettings removed — figure_url is already set in local state
      toast.success("Figure saved");
    } catch (err) {
      console.error("[figure upload] unexpected:", err);
      toast.error("Upload failed — check console");
    } finally {
      setFigureUploading(false);
    }
  };

  const removeFigure = async () => {
    setFigureUrl(null);
    if (coach?.user_id) {
      try {
        const { error } = await supabase
          .from("coach_hub_settings")
          .upsert({ coach_id: coach.user_id, figure_url: null } as any, { onConflict: "coach_id" });
        if (error) {
          console.error("[figure remove] error:", error);
          toast.error(`Failed to remove figure: ${error.message}`);
          return;
        }
        // figure state already updated locally
        toast.success("Figure removed");
      } catch (err) {
        console.error("[figure remove] unexpected:", err);
      }
    }
  };

  /* ── Custom element / section renderers ── */
  const renderCustomElement = (el: CustomElement) => {
    switch (el.type) {
      case "heading":
        return (
          <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{el.text || "Heading"}</h3>
        );
      case "text":
        return (
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {el.content || "Text…"}
          </p>
        );
      case "image":
        return el.url ? (
          <figure>
            <img src={el.url} alt={el.caption || ""} className="w-full rounded-2xl" loading="lazy" />
            {el.caption && (
              <figcaption className="text-xs text-muted-foreground mt-2 text-center">{el.caption}</figcaption>
            )}
          </figure>
        ) : (
          <div className="aspect-video bg-muted/40 rounded-2xl flex items-center justify-center text-muted-foreground text-xs border border-dashed border-border">
            Image placeholder — paste a URL
          </div>
        );
      case "button":
        return (
          <a
            href={el.url || "#"}
            target={el.url ? "_blank" : undefined}
            rel={el.url ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold text-white hover:brightness-110 transition-all active:scale-95 shadow-md"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}CC)`,
            }}
          >
            {el.label || "Button"}
          </a>
        );
      case "divider":
        return <hr className="border-border/40" />;
    }
  };

  const renderCustomSection = (section: PageSection) => {
    const elements = ((section.config?.elements as CustomElement[]) || []);
    const title = (section.config?.title as string) || "Custom Section";
    return (
      <HubSection id={`custom-${section.id}`} icon={LayoutGrid} title={title} color={theme.primary}>
        {isEditing && (
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setEditingSectionId(section.id)}
              className="h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit content
            </button>
          </div>
        )}
        {elements.length === 0 ? (
          <div className="text-center py-12 bg-card/50 rounded-2xl border border-dashed border-border">
            <LayoutGrid className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No content yet</p>
            {isEditing && (
              <p className="text-xs text-muted-foreground/60 mt-1">Click "Edit content" to add elements</p>
            )}
          </div>
        ) : (
          <div className="bg-card/60 border border-border rounded-2xl p-5 md:p-6 space-y-4">
            {elements.map((el) => (
              <div key={el.id}>{renderCustomElement(el)}</div>
            ))}
          </div>
        )}
      </HubSection>
    );
  };

  /* Wraps a section with drag/visibility/order/size chrome driven by localSections */
  const sectionSlot = (type: string, node: React.ReactNode, sectionId?: string) => {
    const idx = sectionId
      ? localSections.findIndex((s) => s.id === sectionId)
      : localSections.findIndex((s) => s.section_type === type);
    if (idx < 0) return null;
    const section = localSections[idx];
    const visible = section.is_visible;
    if (!isEditing && !visible) return null;

    const opt =
      type === "custom"
        ? { label: "Custom", type: "custom" }
        : SECTION_OPTIONS.find((o) => o.type === type);
    const isDragged = dragIndex === idx;
    const isHovered = hoverIndex === idx && dragIndex !== null && dragIndex !== idx;
    const size = (section.layout_size as SectionSize) || "full";
    const spanClass =
      size === "quarter"
        ? "w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
        : size === "half"
        ? "w-full md:w-[calc(50%-0.5rem)]"
        : "w-full";
    const canMoveUp = idx > 0;
    const canMoveDown = idx < localSections.length - 1;

    return (
      <div
        key={section.id}
        style={{ order: idx }}
        draggable={isEditing}
        onDragStart={
          isEditing
            ? (e) => {
                setDragIndex(idx);
                e.dataTransfer.effectAllowed = "move";
              }
            : undefined
        }
        onDragOver={
          isEditing
            ? (e) => {
                e.preventDefault();
                setHoverIndex(idx);
              }
            : undefined
        }
        onDragEnd={isEditing ? () => { setDragIndex(null); setHoverIndex(null); } : undefined}
        onDrop={
          isEditing
            ? (e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== idx) reorderSection(dragIndex, idx);
                setDragIndex(null);
                setHoverIndex(null);
              }
            : undefined
        }
        className={cn(
          spanClass,
          "relative",
          isEditing && "border-2 border-dashed border-transparent rounded-3xl transition-all",
          isEditing && isDragged && "opacity-30",
          isEditing && isHovered && "border-primary bg-primary/5",
          isEditing && !visible && "opacity-50"
        )}
      >
        {isEditing && (
          <div className="sticky top-14 z-30 px-4 md:px-6 pt-2 pb-1 pointer-events-none">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              {/* Label + drag handle + hidden tag */}
              <div
                className="inline-flex items-center gap-2 bg-card/95 backdrop-blur-xl border rounded-full pl-2 pr-3 py-1.5 cursor-grab shadow-lg pointer-events-auto active:cursor-grabbing"
                style={{ borderColor: theme.primary + "60" }}
              >
                <GripVertical className="h-4 w-4" style={{ color: theme.primary }} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  {opt?.label || type}
                </span>
                {!visible && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                    HIDDEN
                  </span>
                )}
              </div>

              {/* Controls cluster */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                {/* Size chooser */}
                <div className="inline-flex items-center gap-0.5 bg-card/95 backdrop-blur-xl border border-border rounded-full p-0.5 shadow-lg">
                  {(
                    [
                      { key: "full", label: "Full" },
                      { key: "half", label: "½" },
                      { key: "quarter", label: "¼" },
                    ] as { key: SectionSize; label: string }[]
                  ).map((opt2) => (
                    <button
                      key={opt2.key}
                      onClick={() => setSectionSize(idx, opt2.key)}
                      className={cn(
                        "h-7 px-2.5 rounded-full text-[10px] font-bold transition-colors",
                        size === opt2.key
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      style={size === opt2.key ? { backgroundColor: theme.primary } : undefined}
                      title={`${opt2.label} width`}
                    >
                      {opt2.label}
                    </button>
                  ))}
                </div>

                {/* Up/Down arrows */}
                <div className="inline-flex items-center gap-0.5 bg-card/95 backdrop-blur-xl border border-border rounded-full p-0.5 shadow-lg">
                  <button
                    onClick={() => canMoveUp && reorderSection(idx, idx - 1)}
                    disabled={!canMoveUp}
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center transition-colors",
                      canMoveUp ? "text-foreground hover:bg-muted" : "text-muted-foreground/30 cursor-not-allowed"
                    )}
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => canMoveDown && reorderSection(idx, idx + 1)}
                    disabled={!canMoveDown}
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center transition-colors",
                      canMoveDown ? "text-foreground hover:bg-muted" : "text-muted-foreground/30 cursor-not-allowed"
                    )}
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Visibility toggle */}
                <button
                  onClick={() => toggleSectionVisible(idx)}
                  className="h-8 w-8 rounded-full bg-card/95 backdrop-blur-xl border border-border flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
                  title={visible ? "Hide section" : "Show section"}
                >
                  {visible ? (
                    <Eye className="h-4 w-4 text-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {node}
      </div>
    );
  };

  return (
    <div className={cn("relative min-h-screen bg-background text-foreground overflow-hidden", !isPreview && "pb-24 md:pb-20")}>
      {/* ══════ ANIMATED BACKGROUND (colored gradient blobs) ══════ */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute rounded-full blur-3xl opacity-30"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${theme.primary}88, transparent 70%)`,
            width: "70vw",
            height: "70vw",
            left: "-15%",
            top: "-20%",
          }}
          animate={{ x: [0, 80, -40, 0], y: [0, -60, 100, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full blur-3xl opacity-25"
          style={{
            background: `radial-gradient(circle at 70% 70%, #FF6B2C88, transparent 70%)`,
            width: "60vw",
            height: "60vw",
            right: "-10%",
            top: "30%",
          }}
          animate={{ x: [0, -100, 50, 0], y: [0, 80, -60, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${theme.primary}66, transparent 70%)`,
            width: "55vw",
            height: "55vw",
            left: "20%",
            bottom: "-15%",
          }}
          animate={{ x: [0, 60, -80, 0], y: [0, -70, 50, 0] }}
          transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Subtle grid pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hub-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 L0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hub-grid)" />
        </svg>
      </div>

      {/* Main content sits above the background */}
      <div className="relative z-[1]">

      {/* ══════ EDIT MODE TOOLBAR ══════ */}
      <AnimatePresence>
        {isEditing && isOwner && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="sticky top-0 z-[60] bg-background/95 backdrop-blur-xl border-b border-border shadow-lg"
          >
            <div className="flex items-center gap-3 px-4 md:px-6 py-3 max-w-6xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Pencil className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-foreground leading-none">Edit Hub</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Drag sections to reorder · Toggle visibility · Add sections</p>
                </div>
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setAddSheetOpen(true)}
                className="h-9 px-3 rounded-full bg-card border border-border flex items-center gap-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add section</span>
              </button>
              <button
                onClick={() => figureFileRef.current?.click()}
                disabled={figureUploading}
                className="h-9 px-3 rounded-full bg-card border border-border flex items-center gap-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                title="Upload a transparent PNG of your figure for the hero"
              >
                <ImageIcon className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                <span className="hidden sm:inline">{figureUploading ? "Uploading…" : figureUrl ? "Change figure" : "Upload figure"}</span>
              </button>
              {coach?.user_id && (
                <div className="inline-flex">
                  <HubSettingsEditor coachId={coach.user_id} />
                </div>
              )}
              {isDirty && (
                <button
                  onClick={handleRevertLayout}
                  className="h-9 px-3 rounded-full bg-card border border-border flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                  title="Revert to saved"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Revert</span>
                </button>
              )}
              <button
                onClick={handleSaveLayout}
                disabled={!isDirty || saving}
                className={cn(
                  "h-9 px-4 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all",
                  isDirty && !saving
                    ? "bg-primary text-primary-foreground hover:brightness-110 shadow-md"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleExitEdit}
                className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Exit edit mode"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ ADD SECTION SHEET ══════ */}
      <AnimatePresence>
        {addSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60"
              onClick={() => setAddSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[71] bg-background border-t border-border rounded-t-3xl max-h-[70vh] overflow-y-auto safe-area-bottom"
            >
              <div className="max-w-2xl mx-auto p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Add a section</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Tap to add. Hidden sections show as dimmed.</p>
                  </div>
                  <button
                    onClick={() => setAddSheetOpen(false)}
                    className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {SECTION_OPTIONS.map((opt) => {
                    const existing = localSections.find((s) => s.section_type === opt.type);
                    const isActive = !!existing && existing.is_visible;
                    const isHidden = !!existing && !existing.is_visible;
                    return (
                      <button
                        key={opt.type}
                        onClick={() => addSectionOfType(opt.type)}
                        disabled={isActive}
                        className={cn(
                          "text-left p-4 rounded-2xl border transition-all",
                          isActive
                            ? "bg-primary/10 border-primary/30 cursor-default"
                            : isHidden
                              ? "bg-card/50 border-border hover:bg-card hover:border-primary/30 active:scale-[0.98]"
                              : "bg-card border-border hover:bg-muted hover:border-primary/30 active:scale-[0.98]"
                        )}
                      >
                        <p className="text-sm font-bold text-foreground flex items-center gap-2">
                          {opt.label}
                          {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                          {isHidden && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{opt.description}</p>
                      </button>
                    );
                  })}
                  {/* Always allow adding another custom section */}
                  <button
                    onClick={addCustomSection}
                    className="text-left p-4 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 active:scale-[0.98] transition-all"
                  >
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      <LayoutGrid className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                      Custom section
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                      Freehand — build your own with headings, text, images, buttons
                    </p>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════ CUSTOM SECTION ELEMENT EDITOR ══════ */}
      <AnimatePresence>
        {editingSectionId && (() => {
          const section = localSections.find((s) => s.id === editingSectionId);
          if (!section || section.section_type !== "custom") return null;
          const idx = localSections.findIndex((s) => s.id === editingSectionId);
          const elements = ((section.config?.elements as CustomElement[]) || []);
          const title = (section.config?.title as string) || "Custom Section";
          return (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[75] bg-black/60"
                onClick={() => setEditingSectionId(null)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 z-[76] bg-background border-t border-border rounded-t-3xl max-h-[90vh] overflow-y-auto safe-area-bottom"
              >
                <div className="max-w-2xl mx-auto p-5 md:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Edit section content</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Add, reorder, or remove elements</p>
                    </div>
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4 text-foreground" />
                    </button>
                  </div>

                  {/* Section title */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Section title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) =>
                        updateSectionConfig(idx, (cfg) => ({ ...cfg, title: e.target.value }))
                      }
                      className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Elements list */}
                  <div className="space-y-2 mb-5">
                    {elements.length === 0 ? (
                      <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
                        <p className="text-xs text-muted-foreground">No elements yet — add one below</p>
                      </div>
                    ) : (
                      elements.map((el, i) => (
                        <div key={el.id} className="bg-card border border-border rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: theme.primary + "15", color: theme.primary }}
                            >
                              {el.type}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveCustomElement(editingSectionId!, i, -1)}
                                disabled={i === 0}
                                className="h-7 w-7 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/70"
                                title="Move up"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => moveCustomElement(editingSectionId!, i, 1)}
                                disabled={i === elements.length - 1}
                                className="h-7 w-7 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/70"
                                title="Move down"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => removeCustomElement(editingSectionId!, el.id)}
                                className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20"
                                title="Remove"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {el.type === "heading" && (
                            <input
                              type="text"
                              value={el.text}
                              onChange={(e) =>
                                updateCustomElement(editingSectionId!, el.id, { text: e.target.value } as any)
                              }
                              placeholder="Heading text"
                              className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary/50"
                            />
                          )}
                          {el.type === "text" && (
                            <textarea
                              value={el.content}
                              onChange={(e) =>
                                updateCustomElement(editingSectionId!, el.id, { content: e.target.value } as any)
                              }
                              placeholder="Your text…"
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:border-primary/50"
                            />
                          )}
                          {el.type === "image" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={el.url}
                                onChange={(e) =>
                                  updateCustomElement(editingSectionId!, el.id, { url: e.target.value } as any)
                                }
                                placeholder="Image URL (https://…)"
                                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary/50"
                              />
                              <input
                                type="text"
                                value={el.caption || ""}
                                onChange={(e) =>
                                  updateCustomElement(editingSectionId!, el.id, { caption: e.target.value } as any)
                                }
                                placeholder="Caption (optional)"
                                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary/50"
                              />
                            </div>
                          )}
                          {el.type === "button" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={el.label}
                                onChange={(e) =>
                                  updateCustomElement(editingSectionId!, el.id, { label: e.target.value } as any)
                                }
                                placeholder="Button label"
                                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary/50"
                              />
                              <input
                                type="text"
                                value={el.url}
                                onChange={(e) =>
                                  updateCustomElement(editingSectionId!, el.id, { url: e.target.value } as any)
                                }
                                placeholder="Button URL (https://…)"
                                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary/50"
                              />
                            </div>
                          )}
                          {el.type === "divider" && (
                            <p className="text-xs text-muted-foreground italic">A horizontal divider line.</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add element row */}
                  <div className="border-t border-border pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Add element
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { type: "heading" as const, label: "Heading", icon: Hash },
                          { type: "text" as const, label: "Text", icon: Type },
                          { type: "image" as const, label: "Image", icon: ImageIcon },
                          { type: "button" as const, label: "Button", icon: Square },
                          { type: "divider" as const, label: "Divider", icon: Minus },
                        ]
                      ).map(({ type: elType, label, icon: Icon }) => (
                        <button
                          key={elType}
                          onClick={() => addCustomElement(editingSectionId!, elType)}
                          className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/40 transition-all active:scale-95"
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ══════ HERO (compact 40vh with parallax) ══════ */}
      <div ref={heroRef} className="relative h-[40vh] min-h-[320px] max-h-[440px] w-full overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ scale: heroScale, y: heroY, opacity: heroOpacity, willChange: "transform" }}
        >
        {coach.intro_video_url ? (
          <video
            src={coach.intro_video_url}
            className="absolute inset-0 w-full h-full object-cover"
            muted loop playsInline autoPlay
          />
        ) : coach.cover_media ? (
          <img
            src={coach.cover_media}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #0d1117 0%, #1a0a00 50%, #2d1200 100%)" }}
          >
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="sport-grid-pub" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#FF6B2C" strokeWidth="0.8" />
                  <circle cx="20" cy="20" r="3" fill="#FF6B2C" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sport-grid-pub)" />
            </svg>
          </div>
        )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent h-24 pointer-events-none" />

        {/* Top nav overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 z-10 safe-area-top">
          {!isPreview ? (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
          ) : <div className="w-10" />}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
            {isOwner && !isEditing && (
              <button
                onClick={() => setLocalEditing(true)}
                className="h-10 px-3.5 rounded-full bg-primary/90 backdrop-blur-xl flex items-center gap-1.5 text-primary-foreground text-xs font-bold active:scale-95 transition-all shadow-lg"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Hub
              </button>
            )}
            <button
              onClick={() => previewAction(() => toast.success("Profile saved!"))}
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <Bookmark className="h-5 w-5" />
            </button>
            <button
              onClick={handleShare}
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </motion.div>
        </div>

        {/* Floating sport + online badges */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="absolute top-14 left-4 z-10 flex items-center gap-2"
        >
          {coach.sport && (
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold capitalize border", theme.badge)}>
              <Flame className="h-3 w-3" />{coach.sport}
            </span>
          )}
          {isOnline && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Online
            </span>
          )}
        </motion.div>

        {/* Hidden file input for the top-toolbar Upload figure button */}
        {isEditable && (
          <input
            ref={figureFileRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFigureUpload(file);
              e.target.value = "";
            }}
          />
        )}

        {/* ── FIGURE OVERLAY — any uploaded photo, feathered into the scene ── */}
        {figureUrl && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ y: heroY }}
            className="absolute inset-y-0 right-0 w-full md:w-[55%] lg:w-[50%] pointer-events-none select-none z-[5]"
          >
            {/* Soft color wash behind the figure, tinted by the page theme */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 65% 80% at 65% 45%, ${theme.primary}22, transparent 70%)`,
              }}
            />
            {/* The figure itself — radial mask feathers the edges into the
                hero so any photo (not just a transparent cutout) looks
                integrated instead of a hard rectangle. */}
            <img
              src={figureUrl}
              alt=""
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{
                WebkitMaskImage:
                  "radial-gradient(ellipse 70% 92% at 62% 40%, #000 42%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.3) 80%, transparent 100%)",
                maskImage:
                  "radial-gradient(ellipse 70% 92% at 62% 40%, #000 42%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.3) 80%, transparent 100%)",
                filter: `drop-shadow(0 20px 40px ${theme.primary}55) drop-shadow(0 0 60px rgba(0,0,0,0.35))`,
              }}
            />
          </motion.div>
        )}

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-white/60" />
        </motion.div>
      </div>

      {/* ══════ PROFILE CARD — overlaps hero bottom ══════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ y: profileCardY }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative -mt-14 md:-mt-16 px-4 md:px-6 z-20"
      >
        <div className="max-w-4xl mx-auto bg-card/95 backdrop-blur-xl border border-border/40 rounded-3xl p-5 md:p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div
                className="p-[3px] rounded-2xl"
                style={{
                  background: coach.is_verified
                    ? "linear-gradient(135deg, #FF6B2C, #FF8C4A, #FFB347)"
                    : `linear-gradient(135deg, ${theme.primary}, ${theme.primary}88)`,
                  boxShadow: coach.is_verified ? "0 0 24px rgba(255,107,44,0.4)" : undefined,
                }}
              >
                <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-[14px] border-[3px] border-card">
                  <AvatarImage
                    src={coach.image_url || coach.profile_avatar || undefined}
                    alt={coach.coach_name}
                    className="rounded-[11px] object-cover object-center"
                  />
                  <AvatarFallback className="rounded-[11px] text-2xl bg-muted font-bold">
                    {coach.coach_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              {coach.is_verified && (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card flex items-center justify-center shadow-lg"
                      >
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#FF8C4A] flex items-center justify-center">
                          <CheckCircle2 className="h-3 w-3 text-white fill-white" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-[11px] leading-snug">
                      Coach uploaded proof of professional liability insurance, reviewed by Circlo.
                      Circlo is a platform, not an endorser — coaches are independent professionals.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight tracking-tight line-clamp-1">
                {coach.coach_name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-1 text-[12px]">

                {averageRating > 0 && (
                  <span className="flex items-center gap-1 text-foreground font-semibold">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {averageRating.toFixed(1)}
                    <span className="text-muted-foreground font-normal">({totalReviews})</span>
                  </span>
                )}
                {coach.sport && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="capitalize text-muted-foreground">{coach.sport}</span>
                  </>
                )}
                {coach.location && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" />{coach.location}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => previewAction(() => { setFollowersTab("followers"); setFollowersOpen(true); })}
                className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors mt-0.5"
              >
                <Users className="h-3 w-3" />{fmt(followers)} followers
                {coach.total_sessions ? <span className="ml-1">· {coach.total_sessions} sessions</span> : null}
              </button>
            </div>
          </div>

          {coach.tagline && (
            <p className="text-sm text-muted-foreground/80 italic mt-4 leading-relaxed line-clamp-2">
              "{coach.tagline}"
            </p>
          )}

          {/* CTAs — primary Book uses Kinetic Pulse gradient (teal→orange per Stitch) */}
          <div ref={heroCtaRef} className="flex gap-2.5 mt-5">
            <button
              onClick={handleBook}
              className="flex-1 h-12 rounded-2xl font-bold text-sm text-white shadow-lg active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2 bg-gradient-kinetic"
              style={{
                boxShadow: "0 6px 20px rgba(0,212,170,0.28), 0 2px 8px rgba(255,107,44,0.18)",
              }}
            >
              <Calendar className="h-4 w-4" />
              Book{price ? ` · ₪${price}` : ""}
            </button>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={cn(
                "h-12 px-5 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] flex items-center gap-2",
                following
                  ? "bg-secondary text-foreground border border-border"
                  : "bg-foreground text-background"
              )}
            >
              <Heart className={cn("h-4 w-4", following && "fill-red-500 text-red-500")} />
              {following ? "Following" : "Follow"}
            </button>
            {coach.user_id && (
              <button
                onClick={handleMessage}
                className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground active:scale-90 transition-all flex-shrink-0"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══════ QUICK INFO STRIP ══════ */}
      <div className="px-4 md:px-6 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {price > 0 && (
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card border border-border text-[12px] font-semibold text-foreground">
                <Zap className="h-3.5 w-3.5" style={{ color: theme.primary }} /> ₪{price}/session
              </span>
            )}
            {coach.location && (
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card border border-border text-[12px] font-semibold text-foreground">
                <MapPin className="h-3.5 w-3.5" style={{ color: theme.primary }} /> {coach.location}
              </span>
            )}
            {coach.years_experience ? (
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card border border-border text-[12px] font-semibold text-foreground">
                <Trophy className="h-3.5 w-3.5" style={{ color: theme.primary }} /> {coach.years_experience}yr exp
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card border border-border text-[12px] font-semibold text-foreground">
              <Timer className="h-3.5 w-3.5" style={{ color: theme.primary }} /> {sessionDuration}min
            </span>
            {coach.response_time && (
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card border border-border text-[12px] font-semibold text-foreground">
                <Zap className="h-3.5 w-3.5" style={{ color: theme.primary }} /> {coach.response_time}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══════ SOCIAL PROOF STRIP + LIVE ACTIVITY ══════ */}
      <div className="px-4 md:px-6 pt-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-[12px] text-muted-foreground leading-relaxed flex-1 min-w-0">
            {coach.total_sessions ? <><span className="font-bold text-foreground">{coach.total_sessions}</span> sessions completed</> : null}
            {coach.total_sessions && totalReviews > 0 ? " · " : ""}
            {totalReviews > 0 ? <><span className="font-bold text-foreground">{totalReviews}</span> reviews</> : null}
            {(coach.total_sessions || totalReviews > 0) && followers > 0 ? " · " : ""}
            {followers > 0 ? <><span className="font-bold text-foreground">{fmt(followers)}</span> followers</> : null}
            {(coach.total_sessions || totalReviews > 0 || followers > 0) && coach.response_time ? " · " : ""}
            {coach.response_time ? <>responds in <span className="font-bold text-foreground">{coach.response_time}</span></> : null}
          </p>
          {activityEvents.length > 0 && (
            <div className="flex-shrink-0">
              <ActivityPulse events={activityEvents} color={theme.primary} />
            </div>
          )}
        </div>
      </div>

      {/* ══════ NEXT AVAILABLE ══════ */}
      {nextAvailable && (
        <div className="px-4 md:px-6 pt-4">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={handleBook}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-colors hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}08)`,
                borderColor: theme.primary + "40",
              }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.primary + "30" }}
              >
                <Zap className="h-5 w-5" style={{ color: theme.primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Next Available</p>
                <p className="text-sm font-bold text-foreground truncate">
                  {nextAvailable.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at {nextAvailable.label}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: theme.primary }}>
                Book slot <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ══════ ANNOUNCEMENT ══════ */}
      {hubSettings.announcement_active && hubSettings.announcement && (
        <div className="px-4 md:px-6 pt-4">
          <div className="max-w-6xl mx-auto">
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3 border"
              style={{ backgroundColor: hubTheme.accent + "12", borderColor: hubTheme.accent + "30" }}
            >
              <span className="text-lg">📢</span>
              <p className="text-sm font-medium text-foreground flex-1">{hubSettings.announcement}</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════ PINNED ══════ */}
      {(hubSettings.pinned_items || []).length > 0 && (
        <div className="px-4 md:px-6 pt-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Pinned</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(hubSettings.pinned_items as PinnedItem[]).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors active:scale-95"
                >
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">{item.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ STICKY SCROLL-SPY TAB BAR ══════ */}
      <div
        ref={tabBarRef}
        className={cn(
          "sticky z-30 bg-background/95 backdrop-blur-xl border-b border-border/40 mt-6",
          isEditing ? "top-14" : "top-0"
        )}
        style={{ willChange: "transform" }}
      >
        <div className="max-w-6xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex px-2 md:px-0 min-w-max md:min-w-0">
            {HUB_TABS.map((tab) => {
              const active = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "relative flex-1 md:flex-initial md:min-w-[96px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 px-4 transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                    {tab.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="hub-tab-indicator"
                      className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full"
                      style={{ backgroundColor: theme.primary }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════ SECTION STACK (layout-style-aware flex-wrap) ══════ */}
      <div className={cn("mx-auto px-0", layoutWrapClass)}>
      <div className={cn("flex flex-wrap", layoutGapClass, isEditing && "pt-2")}>
      {sectionSlot("media", (
      <HubSection id="media" icon={Video} title="Media" color={theme.primary}>
        {videosLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full aspect-video rounded-3xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-[9/16] rounded-2xl" />)}
            </div>
          </div>
        ) : videoItems.length === 0 && postItems.length === 0 ? (
          <div className="text-center py-16 bg-card/60 rounded-2xl border border-border">
            <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No content yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Training clips and photos will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Spotlight / Featured clip */}
            {videoItems.length > 0 && (
              <FeaturedVideo
                video={videoItems[0]}
                sportColor={theme.primary}
                onExpand={() => setPlayingMedia({ url: videoItems[0].media_url, isVideo: true })}
              />
            )}

            {/* Clips grid + Posts strip — side by side on desktop */}
            {(videoItems.length > 1 || postItems.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {videoItems.length > 1 && (
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Video className="h-3.5 w-3.5" /> More Clips
                      </h3>
                      <span className="text-[10px] text-muted-foreground">{videoItems.length - 1} videos</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      {videoItems.slice(1).map((video) => (
                        <VideoThumb key={video.id} video={video} sportColor={theme.primary} />
                      ))}
                    </div>
                  </div>
                )}

                {postItems.length > 0 && (
                  <div className={cn(videoItems.length > 1 ? "lg:col-span-1" : "lg:col-span-3")}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="h-3.5 w-3.5" /> Posts
                      </h3>
                      <span className="text-[10px] text-muted-foreground">{postItems.length}</span>
                    </div>
                    <div
                      className={cn(
                        "grid gap-4",
                        videoItems.length > 1
                          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-1"
                          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      )}
                    >
                      {postItems.map((item) => (
                        <PostCard
                          key={item.id}
                          item={item}
                          onClick={() => setPlayingMedia({ url: item.media_url, isVideo: false })}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </HubSection>
      ))}
      {sectionSlot("about", (
      <HubSection id="about" icon={Award} title="About" color={theme.primary}>
        <div
          className="grid gap-4 auto-rows-min w-full"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {/* Bio — spans 2 tracks */}
          {bio && (
            <div className="col-span-full md:col-span-2 bg-card/60 border border-border rounded-2xl p-5 md:p-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Story</h3>
              <p className={cn(
                "text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap",
                !showFullBio && bioIsLong && "line-clamp-5"
              )}>
                {bio}
              </p>
              {bioIsLong && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-xs font-semibold mt-3 flex items-center gap-1"
                  style={{ color: theme.primary }}
                >
                  {showFullBio ? "Show less" : "Read more"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showFullBio && "rotate-180")} />
                </button>
              )}
            </div>
          )}

          {/* At-a-glance stats panel */}
          <div className="bg-card/60 border border-border rounded-2xl p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">At a Glance</h3>
            <div className="space-y-3">
              {[
                { icon: Zap, label: "Sport", value: coach.sport || "—" },
                { icon: MapPin, label: "Location", value: coach.location || "—" },
                { icon: Clock, label: "Experience", value: coach.years_experience ? `${coach.years_experience}+ yr` : "—" },
                { icon: Calendar, label: "Sessions", value: coach.total_sessions ? `${coach.total_sessions}+` : "—" },
                { icon: Timer, label: "Session", value: `${sessionDuration} min` },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: theme.primary + "15" }}
                  >
                    <stat.icon className="h-4 w-4" style={{ color: theme.primary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-[13px] font-semibold text-foreground capitalize truncate">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Specialties — spans 2 tracks */}
          {coach.specialties && coach.specialties.length > 0 && (
            <div className="col-span-full md:col-span-2 bg-card/60 border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5" style={{ color: theme.primary }} /> Specialties
              </h3>
              <div className="flex flex-wrap gap-2">
                {coach.specialties.map((s: string) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                    style={{
                      borderColor: theme.primary + "40",
                      color: theme.primary,
                      backgroundColor: theme.primary + "12",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {coach.languages && coach.languages.length > 0 && (
            <div className="bg-card/60 border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" style={{ color: theme.primary }} /> Languages
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {coach.languages.map((l: string) => (
                  <Badge key={l} variant="secondary" className="px-2.5 py-1 text-[11px] rounded-full font-semibold">
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Training Style */}
          {coach.training_style && (
            <div className="bg-card/60 border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Flame className="h-3.5 w-3.5" style={{ color: theme.primary }} /> Training Style
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{coach.training_style}</p>
            </div>
          )}

          {/* Ideal For */}
          {coach.ideal_for && (
            <div className="bg-card/60 border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" style={{ color: theme.primary }} /> Ideal For
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{coach.ideal_for}</p>
            </div>
          )}

          {/* Certifications & Achievements */}
          {((coach.certifications && coach.certifications.length > 0) || (coach.achievements && coach.achievements.length > 0)) && (
            <div className="bg-card/60 border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" style={{ color: theme.primary }} /> Credentials
              </h3>
              <div className="space-y-2">
                {(coach.certifications || []).map((c: string, i: number) => (
                  <div key={`c-${i}`} className="flex items-start gap-2">
                    <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
                    <span className="text-[12px] text-foreground/80 leading-snug">{c}</span>
                  </div>
                ))}
                {(coach.achievements || []).map((a: string, i: number) => (
                  <div key={`a-${i}`} className="flex items-start gap-2">
                    <Award className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                    <span className="text-[12px] text-foreground/80 leading-snug">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top reviews — spans every track */}
          {topReviews.length > 0 && (
            <div className="col-span-full bg-card/60 border border-border rounded-2xl p-5 md:p-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> What Athletes Say
              </h3>
              <div className="grid md:grid-cols-2 gap-5">
                {topReviews.map((review) => (
                  <div key={review.id} className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-muted text-foreground font-bold">
                        {review.user_name?.charAt(0)?.toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm text-foreground truncate">{review.user_name || "Athlete"}</p>
                        <RatingStars rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">{review.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </HubSection>
      ))}
      {sectionSlot("reviews", (
      <HubSection id="reviews" icon={Star} title="Reviews" color={theme.primary}>
        {reviewsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 rounded-2xl" />
            <div className="lg:col-span-2 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          </div>
        ) : totalReviews > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Summary card — sticky on desktop */}
            <div className="lg:col-span-1">
              <div className="bg-card/60 border border-border rounded-2xl p-5 md:p-6 lg:sticky lg:top-24">
                <div className="text-center mb-5">
                  <p className="text-5xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
                  <div className="flex justify-center mt-1">
                    <RatingStars rating={averageRating} size="md" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{totalReviews} reviews</p>
                </div>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <RatingBar
                      key={star}
                      star={star}
                      count={stats.distribution[star as 1 | 2 | 3 | 4 | 5] || 0}
                      total={totalReviews}
                      color={theme.primary}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews list — col-span-2 */}
            <div className="lg:col-span-2 space-y-3">
              {displayedReviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-card/60 border border-border rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs bg-muted text-foreground">
                        {review.user_name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">{review.user_name || "Anonymous"}</p>
                        <RatingStars rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">{review.comment}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground/60 mt-2">
                        {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {reviewsShown < totalReviews && (
                <button
                  onClick={() => setReviewsShown((n) => n + 10)}
                  className="w-full h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  Show {Math.min(10, totalReviews - reviewsShown)} more reviews
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-card/60 rounded-2xl border border-border">
            <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to train with {coach.coach_name}!</p>
          </div>
        )}
      </HubSection>
      ))}
      {sectionSlot("schedule", (
      <HubSection id="schedule" icon={Calendar} title="Schedule" color={theme.primary}>
        <div className="space-y-5">
          {availability.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weekly Availability</h3>
                <span className="text-[10px] text-muted-foreground">Tap a slot to book</span>
              </div>
              <AvailabilityHeatmap
                availability={availability as any}
                color={theme.primary}
                onSlotClick={handleBook}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-card/60 border border-border rounded-2xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Book a session</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">₪{price}</span>
                  <span className="text-[10px] text-muted-foreground">/ {sessionDuration}min</span>
                </div>
              </div>
              <BookingCalendar
                coachId={coachId!}
                coachProfileId={coachId}
                onSlotSelect={(date, time) => {
                  if (isPreview) {
                    toast.info("Preview only — users can tap this to book");
                    return;
                  }
                  setSelectedDate(date);
                  setSelectedTime(time);
                  setBookingOpen(true);
                }}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />
            </div>

            {coachId && (
              <div className="lg:col-span-2 bg-card/60 border border-border rounded-2xl p-5 md:p-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Open trainings</h3>
                <OpenTrainings
                  coachProfileId={coachId}
                  onJoin={() => previewAction(() => setBookingOpen(true), "Preview only — users can tap this to join")}
                />
              </div>
            )}
          </div>
        </div>
      </HubSection>
      ))}
      {sectionSlot("packages", (
      <HubSection id="packages" icon={Package} title="Packages" color={theme.primary}>
        {coachId && (
          <CoachPackagesSection
            coachId={coachId}
            coachName={coach.coach_name}
            onBookWithPackage={handleBook}
          />
        )}
      </HubSection>
      ))}
      {sectionSlot("store", (
      <HubSection id="store" icon={ShoppingBag} title="Store" color={theme.primary}>
        {products.length > 0 ? (
          <CoachStore products={products} coachName={coach.coach_name} coachId={coachId!} />
        ) : (
          <div className="text-center py-16 bg-card/30 rounded-2xl border border-border">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No products yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{coach.coach_name}'s store is coming soon</p>
          </div>
        )}
      </HubSection>
      ))}
      {sectionSlot("community", (
      <HubSection id="community" icon={Users2 as any} title="Community" color={theme.primary}>
        {coachId ? (
          <div className="rounded-2xl overflow-hidden">
            <CoachCommunity coachId={coachId} coachName={coach.coach_name} />
          </div>
        ) : null}
      </HubSection>
      ))}

      {/* Custom sections — render each by id */}
      {localSections
        .filter((s) => s.section_type === "custom")
        .map((s) => (
          <Fragment key={s.id}>{sectionSlot("custom", renderCustomSection(s), s.id)}</Fragment>
        ))}
      </div>
      </div>

      {/* ══════ SIMILAR COACHES RAIL ══════ */}
      {similarCoaches.length > 0 && (
        <section className="px-4 md:px-6 py-8 bg-card/20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: theme.primary + "20" }}
              >
                <Users className="h-4 w-4" style={{ color: theme.primary }} />
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Coaches like {coach.coach_name.split(" ")[0]}
              </h2>
            </div>
            <SimilarCoachesRail coaches={similarCoaches} />
          </div>
        </section>
      )}

      {/* Hub Settings is now mounted in the top edit toolbar */}

      {/* ══════ STICKY BOTTOM BAR ══════ */}
      <AnimatePresence>
        {!isPreview && showBottomBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40"
            style={{ willChange: "transform" }}
          >
            <div className="mx-3 mb-2 md:mx-0 md:mb-0 md:rounded-none rounded-2xl overflow-hidden bg-background/95 backdrop-blur-xl border border-border md:border-t md:border-x-0 md:border-b-0 shadow-2xl">
              <div className="flex items-center gap-3 px-4 py-3 max-w-6xl mx-auto safe-area-bottom">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-foreground">₪{price}</span>
                    <span className="text-[10px] text-muted-foreground">/{sessionDuration}min</span>
                    {averageRating > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px] ml-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{coach.coach_name}</p>
                </div>
                <button
                  onClick={handleFollow}
                  className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0",
                    following ? "bg-secondary" : "bg-muted"
                  )}
                >
                  <Heart className={cn("h-5 w-5", following ? "fill-red-500 text-red-500" : "text-foreground")} />
                </button>
                <button
                  onClick={handleBook}
                  className="h-11 px-6 rounded-xl font-bold text-sm text-white flex items-center gap-2 active:scale-95 transition-all flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #FF6B2C, #FF8C4A)",
                    boxShadow: "0 4px 16px rgba(255,107,44,0.4)",
                  }}
                >
                  <Calendar className="h-4 w-4" />
                  Book now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ MODALS ══════ */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        coachId={coachId!}
        coachProfileId={coachId}
        coachName={coach.coach_name}
        coachImage={coach.image_url || undefined}
        sport={coach.sport}
        sessionDuration={sessionDuration}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        sessionType="individual"
        price={price}
      />

      {playingMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setPlayingMedia(null)}
        >
          <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10">
            <X className="h-5 w-5" />
          </button>
          <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            {playingMedia.isVideo ? (
              <video src={playingMedia.url} className="w-full rounded-2xl" controls autoPlay />
            ) : (
              <img src={playingMedia.url} alt="" className="w-full rounded-2xl object-contain max-h-[80vh]" />
            )}
          </div>
        </div>
      )}

      <FollowersModal
        open={followersOpen}
        onClose={() => setFollowersOpen(false)}
        coachId={coachId}
        userId={user?.id}
        initialTab={followersTab}
      />
      </div>{/* end z-[1] content wrapper */}
    </div>
  );
};

/* ══════════════ LOADING SKELETON ══════════════ */
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Skeleton className="h-[40vh] min-h-[320px] max-h-[440px] rounded-none" />
    <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-14 relative z-10">
      <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2.5">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-12 w-24 rounded-2xl" />
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      </div>
    </div>
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  </div>
);

export default PublicCoachProfile;
