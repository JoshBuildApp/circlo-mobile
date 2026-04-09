import { useRef, useEffect, useState, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, Bookmark, Play, Share2,
  Calendar, CheckCircle2, Trash2,
} from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { CoachAvatar } from "@/components/ui/coach-avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { trackView } from "@/hooks/use-feed";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

export interface EngagementCardData {
  id: string;
  coachId: string;
  coachName: string;
  sport: string;
  image: string;
  contentImage?: string;
  videoSrc: string;
  caption: string;
  likes: number;
  views: number;
  commentsCount?: number;
  isDb?: boolean;
  rating?: number;
  price?: number;
  followers?: number;
  isVerified?: boolean;
}

interface EngagementCardProps {
  item: EngagementCardData;
  variant?: "full" | "compact" | "hero";
  initialLiked?: boolean;
  initialLikeCount?: number;
  initialFollowing?: boolean;
  onPostClick?: (item: EngagementCardData) => void;
  /** Index in the feed — first 2 items use eager loading */
  index?: number;
}

const EngagementCard = memo(({ item, variant = "full", initialLiked, initialLikeCount, initialFollowing, onPostClick, index = 99 }: EngagementCardProps) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewTracked, setViewTracked] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [likesCount, setLikesCount] = useState(initialLikeCount ?? item.likes);
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [isVisible, setIsVisible] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lastTap = useRef(0);

  const isDbItem = item.isDb && item.id.includes("-");
  const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url);
  const hasVideo = item.videoSrc && isVideoUrl(item.videoSrc);
  // Never use a video URL as an image source — fall back to coach avatar, then empty
  const rawDisplay = item.contentImage || item.image;
  const displayImage = rawDisplay && isVideoUrl(rawDisplay)
    ? (item.image && !isVideoUrl(item.image) ? item.image : "")
    : rawDisplay;
  const imgLoading = index < 2 ? "eager" as const : "lazy" as const;

  useEffect(() => {
    if (initialLiked !== undefined) setLiked(initialLiked);
  }, [initialLiked]);
  useEffect(() => {
    if (initialLikeCount !== undefined) setLikesCount(initialLikeCount);
  }, [initialLikeCount]);
  useEffect(() => {
    if (initialFollowing !== undefined) setFollowing(initialFollowing);
  }, [initialFollowing]);

  // Single IntersectionObserver: visibility + video autoplay
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!isVisible) setIsVisible(true);
          if (variant !== "compact" && videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        } else {
          if (variant !== "compact" && videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { rootMargin: "200px", threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [variant, isVisible]);

  const handleTimeUpdate = useCallback(() => {
    if (!viewTracked && isDbItem && videoRef.current && videoRef.current.currentTime >= 3) {
      setViewTracked(true);
      trackView(item.id);
    }
  }, [viewTracked, item.id, isDbItem]);

  const handleLike = async () => {
    if (!user) { navigate("/login"); return; }
    if (!isDbItem) {
      setLiked((l) => !l);
      setLikesCount((c) => liked ? Math.max(0, c - 1) : c + 1);
      if (!liked) { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 800); }
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
    if (!wasLiked) { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 800); }

    try {
      if (wasLiked) {
        await supabase.from("likes").delete().eq("user_id", user.id).eq("content_id", item.id);
        await supabase.rpc("increment_likes", { video_id: item.id, delta: -1 });
      } else {
        await supabase.from("likes").upsert({ user_id: user.id, content_id: item.id }, { onConflict: "user_id,content_id" });
        await supabase.rpc("increment_likes", { video_id: item.id, delta: 1 });
      }
    } catch {
      setLiked(wasLiked);
      setLikesCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) handleLike();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (lastTap.current === now && onPostClick) {
        onPostClick(item);
      }
    }, 310);
  };

  const handleSave = async () => {
    if (!user) { navigate("/login"); return; }
    const newSaved = !saved;
    setSaved(newSaved);
    toast.success(newSaved ? "Saved!" : "Removed from saved");
    if (isDbItem) {
      try {
        if (newSaved) {
          await supabase.from("saved_items").upsert(
            { user_id: user.id, content_id: item.id, collection_name: "Saved" },
            { onConflict: "user_id,content_id,collection_name" }
          );
        } else {
          await supabase.from("saved_items").delete().eq("user_id", user.id).eq("content_id", item.id);
        }
      } catch {
        setSaved(!newSaved);
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: item.caption, url: window.location.origin + `/coach/${item.coachId}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin + `/coach/${item.coachId}`);
      toast.success("Link copied!");
    }
  };

  const toggleFollow = async () => {
    if (!user) { navigate("/login"); return; }
    if (following) {
      await supabase.from("user_follows").delete().eq("user_id", user.id).eq("coach_id", item.coachId);
      setFollowing(false);
    } else {
      await supabase.from("user_follows").insert({ user_id: user.id, coach_id: item.coachId });
      setFollowing(true);
    }
  };

  const handleAdminDelete = async () => {
    if (!isDbItem) return;
    try {
      await supabase.from("likes").delete().eq("content_id", item.id);
      await supabase.from("comments").delete().eq("content_id", item.id);
      await supabase.from("saved_items").delete().eq("content_id", item.id);
      const { error } = await supabase.from("coach_videos").delete().eq("id", item.id);
      if (error) throw error;
      setDeleted(true);
      toast.success("Content deleted");
    } catch (err: any) {
      toast.error("Delete failed: " + (err.message || "Unknown error"));
    }
    setConfirmDelete(false);
  };

  if (deleted) return null;

  if (variant === "hero") {
    return (
      <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden bg-secondary" style={{ aspectRatio: "16/10" }}>
        {isVisible && hasVideo ? (
          <video ref={videoRef} src={item.videoSrc} className="absolute inset-0 h-full w-full object-cover" muted loop playsInline preload="none" onClick={handleDoubleTap} onTimeUpdate={handleTimeUpdate} />
        ) : displayImage ? (
          <SafeImage src={displayImage} alt={item.caption} className="absolute inset-0 h-full w-full object-cover" loading={imgLoading} onClick={handleDoubleTap} fallbackSrc={item.image && !isVideoUrl(item.image) ? item.image : undefined} displayWidth={500} srcSetWidths={[300, 500, 800]} sizes="(min-width: 768px) 50vw, 100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted flex items-center justify-center" onClick={handleDoubleTap}>
            <Play className="h-16 w-16 text-muted-foreground/40 fill-muted-foreground/20" />
          </div>
        )}
        {heartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="h-20 w-20 text-destructive fill-destructive animate-scale-in opacity-90" style={{ animation: "scale-in 0.3s ease-out, fade-out 0.4s ease-out 0.4s forwards" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold mb-1">Featured</p>
          <h2 className="text-base font-bold text-white leading-snug mb-1 max-w-[260px]">{item.caption}</h2>
          <p className="text-[13px] text-white/70 mb-3">{item.coachName}</p>
          <div className="flex items-center gap-3">
            <Link to={`/coach/${item.coachId}`} className="inline-flex items-center gap-2 bg-white text-foreground h-10 px-5 rounded-xl text-[13px] font-bold active:scale-95 transition-transform">
              <Play className="h-3.5 w-3.5 fill-current" />Watch Now
            </Link>
            <button onClick={handleLike} className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-all">
              <Heart className={cn("h-5 w-5", liked ? "text-destructive fill-destructive" : "text-white")} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    const CompactWrapper = onPostClick ? "button" as const : Link;
    const compactProps = onPostClick
      ? { onClick: () => onPostClick(item), className: "flex-shrink-0 w-[160px] md:w-[200px] rounded-2xl overflow-hidden bg-card border border-border/10 active:scale-[0.97] md:hover:shadow-md transition-all text-left" }
      : { to: `/coach/${item.coachId}`, className: "flex-shrink-0 w-[160px] md:w-[200px] rounded-2xl overflow-hidden bg-card border border-border/10 active:scale-[0.97] md:hover:shadow-md transition-all" };
    return (
      <CompactWrapper ref={containerRef as any} {...compactProps as any}>
        <div className="relative h-[130px] bg-secondary overflow-hidden">
          {displayImage ? (
            <SafeImage src={displayImage} alt={item.caption} className="h-full w-full object-cover" loading="lazy" fallbackSrc={item.image && !isVideoUrl(item.image) ? item.image : undefined} displayWidth={200} srcSetWidths={[160, 320]} sizes="200px" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <Play className="h-10 w-10 text-muted-foreground/40 fill-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {hasVideo && (
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-2.5 w-2.5 text-white fill-white ml-[1px]" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <Heart className="h-3 w-3 text-white/80" />
            <span className="text-[9px] text-white/80 font-semibold">{fmt(item.likes)}</span>
          </div>
        </div>
        <div className="p-2.5">
          <p className="text-[11px] font-bold text-foreground line-clamp-2 leading-tight">{item.caption}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{item.coachName}</p>
        </div>
      </CompactWrapper>
    );
  }

  // Full variant
  return (
    <div ref={containerRef} className="bg-card border-b border-border/5 md:border md:border-border/10 md:rounded-2xl md:mb-4">
      {/* Coach header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/coach/${item.coachId}`} className="flex items-center gap-3 flex-1 min-w-0">
          <CoachAvatar src={item.image} name={item.coachName} size="sm" className="border-2 border-primary/15" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-foreground truncate">{item.coachName}</p>
              {item.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />}
            </div>
            <p className="text-[10px] text-muted-foreground capitalize">{item.sport}</p>
          </div>
        </Link>
        <button
          onClick={toggleFollow}
          className={cn(
            "h-8 px-3 rounded-lg text-[11px] font-bold flex items-center follow-morph",
            following ? "bg-secondary text-muted-foreground" : "bg-foreground text-background"
          )}
        >
          {following ? "Following" : "Follow"}
        </button>
        {isAdmin && isDbItem && (
          confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={handleAdminDelete} className="h-8 px-2.5 rounded-lg bg-destructive text-destructive-foreground text-[10px] font-bold">Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="h-8 px-2 rounded-lg bg-secondary text-muted-foreground text-[10px]">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Admin: Delete post">
              <Trash2 className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      {/* Media — only render video when visible */}
      <div className="relative w-full aspect-[4/5] bg-secondary overflow-hidden select-none" onClick={handleDoubleTap} onContextMenu={(e) => e.preventDefault()}>
        {isVisible && hasVideo ? (
          <video ref={videoRef} src={item.videoSrc} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline preload="none" onTimeUpdate={handleTimeUpdate} />
        ) : displayImage ? (
          <SafeImage src={displayImage} alt={item.caption} className="absolute inset-0 w-full h-full object-cover" loading={imgLoading} fallbackSrc={item.image && !isVideoUrl(item.image) ? item.image : undefined} displayWidth={600} srcSetWidths={[400, 600, 800]} sizes="(min-width: 768px) 50vw, 100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <Play className="h-16 w-16 text-muted-foreground/40 fill-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Play icon overlay for video posts showing thumbnail */}
        {hasVideo && !(isVisible && hasVideo) && displayImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
            <div className="h-14 w-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-6 w-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {heartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="h-24 w-24 text-destructive fill-destructive animate-scale-in" style={{ animation: "scale-in 0.3s ease-out, fade-out 0.4s ease-out 0.4s forwards" }} />
          </div>
        )}

        <div className="absolute right-3 bottom-4 flex flex-col gap-2.5">
          <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="h-11 w-11 rounded-full bg-black/30 flex items-center justify-center text-white active:scale-90 transition-transform">
            <Heart className={cn("h-5 w-5", liked ? "text-destructive fill-destructive" : "")} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="h-11 w-11 rounded-full bg-black/30 flex items-center justify-center text-white active:scale-90 transition-transform">
            <Bookmark className={cn("h-5 w-5", saved ? "text-accent fill-accent" : "")} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="h-11 w-11 rounded-full bg-black/30 flex items-center justify-center text-white active:scale-90 transition-transform">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <Link to={`/coach/${item.coachId}`} onClick={(e) => e.stopPropagation()} className="absolute left-3 bottom-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/95 text-foreground text-[11px] font-bold backdrop-blur-sm active:scale-95 transition-all shadow-lg">
          <Calendar className="h-3.5 w-3.5" />Book Session
        </Link>
      </div>

      {/* Engagement bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={handleLike} className="flex items-center gap-1.5">
            <Heart className={cn("h-6 w-6 transition-all active:scale-125", liked ? "text-destructive fill-destructive" : "text-foreground")} />
          </button>
          <button className="flex items-center gap-1.5">
            <MessageCircle className="h-6 w-6 text-foreground" />
          </button>
          <button onClick={handleShare}>
            <Share2 className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1" />
          <button onClick={handleSave}>
            <Bookmark className={cn("h-6 w-6 transition-all", saved ? "text-accent fill-accent" : "text-foreground")} />
          </button>
        </div>
        <p className="text-xs font-bold text-foreground mb-1">{fmt(likesCount)} likes</p>
        <p className="text-sm text-foreground line-clamp-2">
          <span className="font-bold">{item.coachName}</span>{" "}{item.caption}
        </p>
        {item.views > 0 && <p className="text-[11px] text-muted-foreground mt-1">{fmt(item.views)} views</p>}
      </div>
    </div>
  );
});

EngagementCard.displayName = "EngagementCard";

export default EngagementCard;
