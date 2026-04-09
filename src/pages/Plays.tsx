import { useState, useRef, useEffect, memo } from "react";
import { Play, Eye, Heart, Clock, Plus, Search, Flame, TrendingUp, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useSmartFeed } from "@/hooks/use-smart-feed";
import type { FeedVideo } from "@/hooks/use-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

type ContentFilter = "all" | "coaches" | "players";

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`
    : n.toString();

const SPORT_COLORS: Record<string, string> = {
  padel: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  tennis: "bg-green-500/15 text-green-400 border-green-500/20",
  fitness: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  boxing: "bg-red-500/15 text-red-400 border-red-500/20",
  soccer: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  basketball: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  yoga: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  swimming: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  running: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  mma: "bg-red-600/15 text-red-500 border-red-600/20",
  crossfit: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
};

const Plays = () => {
  const navigate = useNavigate();
  const { videos: dbVideos, loading } = useSmartFeed();
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const allVideos: FeedVideo[] = (() => {
    const dbVideoOnly = (dbVideos || []).filter((v) => {
      if (!v.media_url) return false;
      if (v.media_type !== "video") return false;
      if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(v.media_url)) return false;
      return true;
    });

    let filtered = dbVideoOnly;
    if (filter === "coaches") filtered = dbVideoOnly.filter((v) => ["training", "tips", "interview"].includes((v as unknown as Record<string, string>).category || "training"));
    if (filter === "players") filtered = dbVideoOnly.filter((v) => ["highlights", "moments"].includes((v as unknown as Record<string, string>).category || ""));

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((v) =>
        v.title?.toLowerCase().includes(q) ||
        v.coach_name?.toLowerCase().includes(q) ||
        v.sport?.toLowerCase().includes(q)
      );
    }

    return filtered;
  })();

  // Featured video = first one
  const featured = allVideos[0];
  const gridVideos = allVideos.slice(1);

  // Trending: top 4 by views
  const trending = [...allVideos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);

  if (loading && allVideos.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-10 w-full rounded-xl mb-4" />
          <div className="flex gap-2 mb-5">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="aspect-[16/9] w-full rounded-2xl mb-6" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[9/14] rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!loading && allVideos.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Film className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="space-y-1.5 mt-2">
          <p className="text-foreground font-bold text-lg">No videos yet</p>
          <p className="text-muted-foreground text-sm max-w-[260px] leading-relaxed">
            Be the first to upload a coaching video and inspire the community
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-upload-flow"))}
          className="mt-3 inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-full active:scale-95 transition-transform shadow-[0_2px_12px_rgba(0,212,170,0.3)]"
        >
          <Plus className="h-4 w-4" />
          Upload Video
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/5">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-xl font-bold text-foreground">Plays</h1>
              <span className="text-xs text-muted-foreground/60 font-medium">{allVideos.length} videos</span>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-upload-flow"))}
              className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary active:scale-90 transition-transform"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos, coaches, sports..."
              className="w-full bg-secondary/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:bg-secondary/60 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-2">
            {(["all", "coaches", "players"] as ContentFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border",
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_8px_rgba(0,212,170,0.2)]"
                    : "bg-transparent text-foreground/60 border-border/20 hover:border-border/40"
                )}
              >
                {f === "all" ? "For You" : f === "coaches" ? "Coaches" : "Players"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Featured video */}
        {featured && (
          <section>
            <FeaturedCard video={featured} />
          </section>
        )}

        {/* Trending section */}
        {trending.length >= 2 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Trending Now</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
              {trending.map((video) => (
                <TrendingCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        )}

        {/* Video grid */}
        {gridVideos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground">All Videos</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {gridVideos.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <VideoGridCard
                    video={video}
                    isHovered={hoveredId === video.id}
                    onHoverStart={() => setHoveredId(video.id)}
                    onHoverEnd={() => setHoveredId(null)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {gridVideos.length === 0 && allVideos.length <= 1 && (
          <p className="text-center text-sm text-muted-foreground/60 mt-8">No more videos to show</p>
        )}
      </div>
    </div>
  );
};

/* ─── Featured Card ─── */
const FeaturedCard = ({ video }: { video: FeedVideo }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {});
    setIsPlaying(true);
  };

  const handleMouseLeave = () => {
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const sportStyle = SPORT_COLORS[(video.sport || "").toLowerCase()] || "bg-primary/15 text-primary border-primary/20";

  return (
    <button
      onClick={() => navigate(`/reels`)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden group shadow-lg"
    >
      <video
        ref={videoRef}
        src={video.media_url}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        muted playsInline preload="metadata"
        loop
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      {/* Play icon */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Featured badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
          Featured
        </span>
        {video.sport && (
          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm", sportStyle)}>
            {video.sport}
          </span>
        )}
      </div>

      {/* Views badge */}
      <div className="absolute top-3 right-3">
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80 text-[10px] font-semibold">
          <Eye className="h-3 w-3" />{fmt(video.views || 0)}
        </span>
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0 shadow-md">
            {video.coach_image ? (
              <img src={video.coach_image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {video.coach_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-left min-w-0">
            <p className="text-white font-bold text-sm truncate">{video.coach_name}</p>
            {video.title && (
              <p className="text-white/70 text-xs line-clamp-1 mt-0.5">{video.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-white/50 text-[11px] font-medium">
            <Heart className="h-3 w-3" />{fmt(video.likes_count)}
          </span>
        </div>
      </div>
    </button>
  );
};

/* ─── Trending Card (horizontal scroll) ─── */
const TrendingCard = memo(({ video }: { video: FeedVideo }) => {
  const navigate = useNavigate();
  const sportStyle = SPORT_COLORS[(video.sport || "").toLowerCase()] || "bg-primary/15 text-primary border-primary/20";

  return (
    <button
      onClick={() => navigate(`/reels`)}
      className="flex-shrink-0 w-[140px] group"
    >
      <div className="relative aspect-[9/13] rounded-xl overflow-hidden bg-secondary mb-2 shadow-sm">
        <video
          src={video.media_url}
          className="absolute inset-0 w-full h-full object-cover"
          muted playsInline preload="metadata"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Flame badge */}
        <div className="absolute top-2 left-2">
          <div className="h-5 w-5 rounded-full bg-orange-500/20 backdrop-blur-sm flex items-center justify-center">
            <Flame className="h-3 w-3 text-orange-400" />
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5 text-white text-[10px] font-semibold">
              <Eye className="h-2.5 w-2.5" />{fmt(video.views || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-0.5">
        <p className="text-foreground text-[12px] font-semibold line-clamp-1 leading-tight">
          {video.title || "Untitled"}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-muted-foreground text-[10px] truncate">{video.coach_name}</span>
        </div>
      </div>
    </button>
  );
});
TrendingCard.displayName = "TrendingCard";

/* ─── Grid Card ─── */
interface VideoGridCardProps {
  video: FeedVideo;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

const VideoGridCard = memo(({ video, isHovered, onHoverStart, onHoverEnd }: VideoGridCardProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sportStyle = SPORT_COLORS[(video.sport || "").toLowerCase()] || "bg-primary/15 text-primary border-primary/20";

  useEffect(() => {
    if (isHovered) {
      videoRef.current?.play().catch(() => {});
    } else {
      const el = videoRef.current;
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
    }
  }, [isHovered]);

  return (
    <button
      onClick={() => navigate(`/reels`)}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className="w-full text-left group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/14] rounded-xl overflow-hidden bg-secondary mb-2 shadow-sm">
        <video
          ref={videoRef}
          src={video.media_url}
          className="absolute inset-0 w-full h-full object-cover"
          muted playsInline preload="metadata"
          loop
        />

        {/* Hover play overlay */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
          isHovered ? "opacity-0" : "opacity-100"
        )}>
          <div className="h-10 w-10 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-4 w-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Stats overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-white text-[10px] font-semibold drop-shadow-sm">
            <Eye className="h-3 w-3" />{fmt(video.views || 0)}
          </span>
          <span className="flex items-center gap-0.5 text-white text-[10px] font-semibold drop-shadow-sm">
            <Heart className="h-3 w-3" />{fmt(video.likes_count)}
          </span>
        </div>

        {/* Sport badge - top left */}
        {video.sport && (
          <div className="absolute top-2 left-2">
            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border backdrop-blur-sm", sportStyle)}>
              {video.sport}
            </span>
          </div>
        )}

        {/* Coach avatar - top right */}
        <div className="absolute top-2 right-2">
          <div className="h-7 w-7 rounded-full overflow-hidden border-[1.5px] border-white/30 shadow-sm">
            {video.coach_image ? (
              <img src={video.coach_image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-white/20 flex items-center justify-center text-white text-[9px] font-bold">
                {video.coach_name?.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-0.5">
        <p className="text-foreground text-[13px] font-semibold line-clamp-1 leading-tight">
          {video.title || "Untitled"}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-muted-foreground text-[11px] font-medium truncate">{video.coach_name}</span>
          {video.sport && (
            <>
              <span className="text-muted-foreground/30 text-[10px]">·</span>
              <span className="text-muted-foreground/70 text-[11px]">{video.sport}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
});
VideoGridCard.displayName = "VideoGridCard";

export default Plays;
