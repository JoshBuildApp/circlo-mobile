import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Heart, MessageCircle, Share2, Play, Bookmark, UserPlus, UserCheck, Send, X, Trash2, Zap, Volume2, VolumeX, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedVideos, useLike, trackView } from "@/hooks/use-feed";
import { useFollow } from "@/hooks/use-follow";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { feedItems } from "@/data/feed";
import { coaches } from "@/data/coaches";
import { useDataMode } from "@/contexts/DataModeContext";
import { SaveButton } from "@/components/SaveButton";
import ShareSheet from "@/components/ShareSheet";
import type { FeedVideo } from "@/hooks/use-feed";
import { motion, AnimatePresence } from "framer-motion";

const BUFFER = 1;

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`
    : n.toString();

const SPORT_COLORS: Record<string, string> = {
  padel: "from-blue-500/80 to-blue-600/80",
  tennis: "from-green-500/80 to-green-600/80",
  fitness: "from-orange-500/80 to-orange-600/80",
  boxing: "from-red-500/80 to-red-600/80",
  soccer: "from-emerald-500/80 to-emerald-600/80",
  basketball: "from-amber-500/80 to-amber-600/80",
  yoga: "from-purple-500/80 to-purple-600/80",
  swimming: "from-cyan-500/80 to-cyan-600/80",
  running: "from-rose-500/80 to-rose-600/80",
  mma: "from-red-600/80 to-red-700/80",
  crossfit: "from-yellow-500/80 to-yellow-600/80",
};

const Reels = () => {
  const { videos: dbVideos, loading } = useFeedVideos();
  const { isRealMode } = useDataMode();
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const allVideos: FeedVideo[] = (() => {
    if (isRealMode) return dbVideos;
    const staticFeed: FeedVideo[] = feedItems.map((item) => {
      const coach = coaches.find((c) => c.id === item.coachId);
      return {
        id: item.id, coach_id: item.coachId, user_id: "",
        title: item.caption, description: null,
        media_url: item.videoSrc, media_type: "video",
        likes_count: item.likes, comments_count: 0,
        views: item.likes * 12, created_at: "",
        coach_name: coach?.name || item.coachName,
        sport: coach?.sport || item.sport,
        coach_image: coach?.image || item.coachAvatar,
      };
    });
    return dbVideos.length > 0 ? [...dbVideos, ...staticFeed] : staticFeed;
  })();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || allVideos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!isNaN(idx)) {
              setActiveIndex(idx);
              if (idx > 0) setShowHint(false);
            }
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    const children = container.querySelectorAll("[data-index]");
    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [allVideos.length]);

  // Auto-hide hint after 3 seconds
  useEffect(() => {
    if (showHint) {
      const t = setTimeout(() => setShowHint(false), 3500);
      return () => clearTimeout(t);
    }
  }, [showHint]);

  if (loading && allVideos.length === 0) {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-white/10 flex items-center justify-center">
            <Play className="h-6 w-6 text-white/40 fill-white/40 ml-0.5" />
          </div>
          <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-white/30 text-sm font-medium animate-pulse">Loading reels...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-black flex flex-col overflow-hidden relative">
      {/* Top header - transparent overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pb-10 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="font-heading text-base font-bold text-white tracking-wide">Reels</span>
          <span className="text-white/40 text-xs font-medium">{activeIndex + 1}/{allVideos.length}</span>
        </div>
        <button
          onClick={() => setMuted((m) => !m)}
          className="pointer-events-auto h-9 w-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform border border-white/10"
        >
          {muted ? <VolumeX className="h-4 w-4 text-white/80" /> : <Volume2 className="h-4 w-4 text-white" />}
        </button>
      </div>

      {/* Progress dots */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 pointer-events-none">
        {allVideos.slice(0, 12).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full transition-all duration-300",
              i === activeIndex ? "h-5 w-1.5 bg-primary shadow-[0_0_6px_rgba(0,212,170,0.5)]" : "h-1.5 w-1.5 bg-white/20"
            )}
          />
        ))}
      </div>

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {allVideos.map((video, index) => {
          const isNearActive = Math.abs(index - activeIndex) <= BUFFER;
          return (
            <div
              key={video.id + "-" + index}
              data-index={index}
              className="h-full w-full snap-start snap-always"
            >
              {isNearActive ? (
                <ReelCard video={video} isActive={index === activeIndex} muted={muted} />
              ) : (
                <ReelPlaceholder video={video} />
              )}
            </div>
          );
        })}
      </div>

      {/* Swipe up hint */}
      <AnimatePresence>
        {showHint && activeIndex === 0 && allVideos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none"
          >
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronUp className="h-5 w-5 text-white/60" />
            </motion.div>
            <span className="text-white/50 text-xs font-medium">Swipe up</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Reel Card with TikTok-style overlay ─── */
interface ReelCardProps { video: FeedVideo; isActive: boolean; muted: boolean; }

const ReelCard = memo(({ video, isActive, muted }: ReelCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const lastTap = useRef(0);

  const { liked, count: likesCount, toggleLike } = useLike(isActive ? video.id : "");
  const { following, toggleFollow } = useFollow(isActive ? video.coach_id : undefined);

  const sportColor = SPORT_COLORS[(video.sport || "").toLowerCase()] || "from-primary/80 to-primary/80";

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive && !paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isActive, paused]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = muted;
  }, [muted]);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.duration) setProgress((el.currentTime / el.duration) * 100);
    if (!viewTracked && el.currentTime >= 3) {
      setViewTracked(true);
      trackView(video.id);
    }
  }, [viewTracked, video.id]);

  const handleLike = async () => {
    if (!user) { navigate("/login"); return; }
    await toggleLike();
    if (!liked) {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 600);
    }
  };

  const handleClick = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) handleLike();
    } else {
      setPaused((p) => !p);
    }
    lastTap.current = now;
  };

  const tags = video.title?.match(/#\w+/g) || [];
  const cleanCaption = video.title?.replace(/#\w+/g, "").trim();

  if (videoError) {
    return (
      <div className="w-full h-full bg-black/90 flex flex-col items-center justify-center gap-3">
        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
          <Play className="h-6 w-6 text-white/20" />
        </div>
        <p className="text-sm text-white/40 font-medium">Video unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={video.media_url}
        className="absolute inset-0 w-full h-full object-cover"
        loop muted={muted} playsInline
        preload={isActive ? "auto" : "none"}
        onClick={handleClick}
        onTimeUpdate={handleTimeUpdate}
        onError={() => setVideoError(true)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
      />

      {/* Video progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-200 ease-linear rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Buffering indicator */}
      <AnimatePresence>
        {buffering && isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="h-12 w-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause indicator */}
      <AnimatePresence>
        {paused && isActive && !buffering && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="h-20 w-20 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Play className="h-9 w-9 text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap heart */}
      <AnimatePresence>
        {heartAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ type: "spring", damping: 10, stiffness: 200 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <Heart className="h-28 w-28 text-red-500 fill-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Right-side action buttons */}
      <div className="absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5">
        {/* Coach avatar */}
        <button onClick={() => navigate(`/coach/${video.coach_id}`)} className="relative mb-1 group">
          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg group-active:scale-90 transition-transform">
            {video.coach_image ? (
              <img src={video.coach_image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {video.coach_name?.charAt(0)}
              </div>
            )}
          </div>
          {!following && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-black"
            >
              <span className="text-primary-foreground text-[10px] font-black leading-none">+</span>
            </motion.div>
          )}
        </button>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <motion.div whileTap={{ scale: 1.3 }}>
            <Heart className={cn(
              "h-7 w-7 drop-shadow-md transition-all duration-200",
              liked ? "text-red-500 fill-red-500" : "text-white"
            )} />
          </motion.div>
          <span className="text-white text-[11px] font-semibold drop-shadow-sm">{fmt(likesCount)}</span>
        </button>

        {/* Comment */}
        <button onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <MessageCircle className="h-7 w-7 text-white drop-shadow-md" />
          <span className="text-white text-[11px] font-semibold drop-shadow-sm">{fmt(video.comments_count)}</span>
        </button>

        {/* Share */}
        <button onClick={() => setShareOpen(true)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <Share2 className="h-6 w-6 text-white drop-shadow-md" />
          <span className="text-white text-[10px] font-semibold drop-shadow-sm">Share</span>
        </button>

        {/* Save */}
        <div className="flex flex-col items-center gap-1">
          <SaveButton contentId={video.id} />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 left-0 right-20 px-4 z-10">
        <div className="flex items-center gap-2.5 mb-2.5">
          <button onClick={() => navigate(`/coach/${video.coach_id}`)} className="flex items-center gap-2 active:opacity-70 transition-opacity">
            <span className="text-white text-[15px] font-bold leading-tight drop-shadow-sm">
              {video.coach_name}
            </span>
          </button>
          {video.sport && (
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r text-white",
              sportColor
            )}>
              {video.sport}
            </span>
          )}
        </div>

        {cleanCaption && (
          <p className="text-white/90 text-[13px] leading-relaxed line-clamp-2 mb-2 drop-shadow-sm">
            {cleanCaption}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-primary/90 text-[11px] font-semibold drop-shadow-sm">{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/coach/${video.coach_id}`)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full active:scale-95 transition-transform shadow-[0_2px_12px_rgba(0,212,170,0.3)]"
          >
            <Zap className="h-3.5 w-3.5" />
            Book Session
          </button>
          <button
            onClick={() => { if (!user) navigate("/login"); else toggleFollow(); }}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full active:scale-95 transition-all border",
              following
                ? "bg-white/15 text-white border-white/20 backdrop-blur-sm"
                : "bg-white/10 text-white border-white/10 backdrop-blur-sm"
            )}
          >
            {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
            {following ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      {/* Comments sheet */}
      <AnimatePresence>
        {commentsOpen && (
          <ReelComments videoId={video.id} onClose={() => setCommentsOpen(false)} />
        )}
      </AnimatePresence>
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={video.title}
        text={`Check out ${video.coach_name} on Circlo`}
        url={`/coach/${video.coach_id}`}
      />
    </div>
  );
});
ReelCard.displayName = "ReelCard";

/* ─── Comments sheet ─── */
interface CommentItem {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
}

const ReelComments = ({ videoId, onClose }: { videoId: string; onClose: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("comments").select("*").eq("content_id", videoId).order("created_at", { ascending: true });
      if (error) { console.error(error); setLoading(false); return; }
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((c) => c.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, username, avatar_url").in("user_id", userIds);
        const pm: Record<string, { username: string; avatar_url: string | null }> = {};
        if (profiles) for (const p of profiles) pm[p.user_id] = p;
        setComments(data.map((c) => ({ ...c, username: pm[c.user_id]?.username || "User", avatar_url: pm[c.user_id]?.avatar_url || null })));
      }
      setLoading(false);
    })();
  }, [videoId]);

  const handleSend = async () => {
    if (!user) { navigate("/login"); return; }
    if (!text.trim()) return;
    const { error } = await supabase.from("comments").insert({ user_id: user.id, content_id: videoId, text: text.trim() });
    if (error) { console.error(error); return; }
    await supabase.rpc("increment_comments", { video_id: videoId, delta: 1 });
    const newComment = { id: crypto.randomUUID(), user_id: user.id, text: text.trim(), created_at: new Date().toISOString(), username: "You", avatar_url: null };
    setComments((p) => [...p, newComment]);
    setText("");
    // Scroll to bottom
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) { console.error(error); return; }
    await supabase.rpc("increment_comments", { video_id: videoId, delta: -1 });
    setComments((p) => p.filter((c) => c.id !== id));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-card rounded-t-3xl max-h-[60%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-8 rounded-full bg-border/30" />
        </div>

        <div className="flex items-center justify-between px-5 py-2 border-b border-border/10">
          <p className="font-heading text-sm font-bold text-foreground">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </p>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-4 min-h-[100px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <MessageCircle className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground font-medium">No comments yet</p>
              <p className="text-xs text-muted-foreground/60">Be the first to comment</p>
            </div>
          ) : (
            comments.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-3 group"
              >
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {c.avatar_url ? <img src={c.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="text-[11px] font-bold text-muted-foreground">{c.username.charAt(0).toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{c.username}</span>
                    <span className="text-[10px] text-muted-foreground/60">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-[13px] text-foreground/80 mt-0.5 leading-relaxed">{c.text}</p>
                </div>
                {user && c.user_id === user.id && (
                  <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all self-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>
        <div className="px-4 py-3 border-t border-border/10 flex items-center gap-2 safe-area-bottom">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-secondary/70 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-30 active:scale-90 transition-all shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/** Lightweight placeholder for off-screen reels */
const ReelPlaceholder = memo(({ video }: { video: FeedVideo }) => (
  <div className="relative w-full h-full bg-black">
    {video.coach_image && (
      <img
        src={video.coach_image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110"
        loading="lazy"
      />
    )}
    <div className="absolute inset-0 bg-black/60" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-10 w-10 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
    </div>
  </div>
));
ReelPlaceholder.displayName = "ReelPlaceholder";

export default Reels;
