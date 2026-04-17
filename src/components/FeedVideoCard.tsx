import { useState, useRef, useCallback, useEffect, memo } from "react";
import { Heart, Bookmark, MessageCircle, UserPlus, UserCheck, Send, X, Trash2, Play, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLike, trackView } from "@/hooks/use-feed";
import { useFollow } from "@/hooks/use-follow";
import { useSavedItems } from "@/hooks/use-saved-items";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CoachAvatar } from "@/components/ui/coach-avatar";
import type { FeedVideo } from "@/hooks/use-feed";

interface FeedVideoCardProps {
  video: FeedVideo;
  isActive: boolean;
}

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`
    : n.toString();

const FeedVideoCard = memo(({ video, isActive }: FeedVideoCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [bookmarkAnim, setBookmarkAnim] = useState(false);
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const lastTap = useRef(0);

  const { liked, count: likesCount, toggleLike } = useLike(isActive ? video.id : "");
  const { following, toggleFollow } = useFollow(isActive ? video.coach_id : undefined);
  const { isItemSaved, saveItem, unsaveItem } = useSavedItems();
  const bookmarked = isItemSaved(video.id);

  // Auto-play/pause based on active state
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive && !paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isActive, paused]);

  const handleTimeUpdate = useCallback(() => {
    if (!viewTracked && videoRef.current && videoRef.current.currentTime >= 3) {
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

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {/* Video — preload only when active */}
      <video
        ref={videoRef}
        src={video.media_url}
        className="absolute inset-0 w-full h-full max-w-full object-cover"
        loop
        muted
        playsInline
        preload={isActive ? "auto" : "none"}
        onClick={handleClick}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => { setBuffering(false); setVideoError(false); }}
        onError={() => setVideoError(true)}
      />

      {/* Pause indicator */}
      {paused && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="h-16 w-16 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center">
            <Play className="h-7 w-7 text-foreground fill-foreground ml-1" />
          </div>
        </div>
      )}

      {/* Buffering spinner */}
      {buffering && isActive && !paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="h-10 w-10 border-3 border-foreground/30 border-t-foreground rounded-full animate-spin" />
        </div>
      )}

      {/* Video error */}
      {videoError && isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-background/40">
          <Play className="h-10 w-10 text-foreground/50 mb-2" />
          <p className="text-foreground/60 text-sm">Video unavailable</p>
        </div>
      )}

      {/* Double-tap heart */}
      {heartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="h-28 w-28 text-primary fill-primary animate-bounce-in" />
        </div>
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-background/90 via-background/40 to-transparent pointer-events-none" />

      {/* Bottom-left info */}
      <div className="absolute bottom-24 left-0 right-20 px-5 z-10">
        <button
          onClick={() => navigate(`/coach/${video.coach_id}`)}
          className="flex items-center gap-3 mb-3"
        >
          <CoachAvatar src={video.coach_image} name={video.coach_name} size="sm" className="border-[1.5px] border-foreground/30" />
          <div className="text-left">
            <p className="text-foreground text-[14px] font-heading font-bold leading-tight">
              {video.coach_name}
            </p>
            {video.sport && (
              <p className="text-muted-foreground text-[11px] font-medium">{video.sport}</p>
            )}
          </div>
        </button>

        <p className="text-foreground/90 text-[13px] leading-relaxed line-clamp-2 mb-4 break-words max-w-[calc(100vw-80px)]">
          {video.title}
        </p>

        <button
          onClick={() => navigate(`/coach/${video.coach_id}`)}
          className="inline-flex items-center gap-2 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-heading font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
        >
          <Zap className="h-3.5 w-3.5" />
          Train with me
        </button>
      </div>

      {/* Right-side actions */}
      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-6">
        <button onClick={() => navigate(`/coach/${video.coach_id}`)} className="relative">
          <CoachAvatar src={video.coach_image} name={video.coach_name} size="md" className="border-2 border-foreground/40" />
          {!following && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground text-[10px] font-black">+</span>
            </div>
          )}
        </button>

        <button
          onClick={() => {
            setHeartAnim(true);
            setTimeout(() => setHeartAnim(false), 600);
            handleLike();
          }}
          className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
        >
          <Heart className={cn(
            "h-7 w-7 transition-all duration-200",
            liked ? "text-primary fill-primary" : "text-foreground",
            heartAnim ? "scale-125" : "scale-100"
          )} />
          <span className="text-muted-foreground text-[11px] font-semibold">{fmt(likesCount)}</span>
        </button>

        <button
          onClick={() => {
            setBookmarkAnim(true);
            if (bookmarked) { unsaveItem.mutate(video.id); } else { saveItem.mutate({ contentId: video.id }); }
            setTimeout(() => setBookmarkAnim(false), 500);
          }}
          className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
        >
          <Bookmark className={cn(
            "h-7 w-7 transition-all duration-200",
            bookmarked ? "text-accent fill-accent" : "text-foreground",
            bookmarkAnim ? "scale-125 -translate-y-1" : "scale-100"
          )} />
          <span className="text-muted-foreground text-[11px] font-semibold">{bookmarked ? "Saved" : "Save"}</span>
        </button>

        <button onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center">
          <MessageCircle className="h-7 w-7 text-foreground" />
          <span className="text-muted-foreground text-[11px] font-semibold">{fmt(video.comments_count)}</span>
        </button>

        <button
          onClick={() => { if (!user) navigate("/login"); else toggleFollow(); }}
          className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
        >
          {following ? (
            <UserCheck className="h-6 w-6 text-primary" />
          ) : (
            <UserPlus className="h-6 w-6 text-foreground" />
          )}
          <span className={cn("text-[10px] font-bold", following ? "text-primary" : "text-muted-foreground")}>
            {following ? "Following" : "Follow"}
          </span>
        </button>
      </div>

      {/* Lazy comments sheet - only loads data when opened */}
      {commentsOpen && (
        <LazyCommentsSheet
          videoId={video.id}
          onClose={() => setCommentsOpen(false)}
        />
      )}
    </div>
  );
});

FeedVideoCard.displayName = "FeedVideoCard";

/** Comments sheet that only fetches data when mounted */
const LazyCommentsSheet = ({ videoId, onClose }: { videoId: string; onClose: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch comments on mount only
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("content_id", videoId)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((c: any) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);

        const profileMap: Record<string, any> = {};
        if (profiles) for (const p of profiles) profileMap[p.user_id] = p;

        setComments(data.map((c: any) => ({
          ...c,
          username: profileMap[c.user_id]?.username || "User",
          avatar_url: profileMap[c.user_id]?.avatar_url || null,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [videoId]);

  const handleComment = async () => {
    if (!user) { navigate("/login"); return; }
    if (!commentText.trim()) return;
    await supabase.from("comments").insert({ user_id: user.id, content_id: videoId, text: commentText.trim() });
    await supabase.rpc("increment_comments", { video_id: videoId, delta: 1 });
    // Optimistic add
    setComments((prev) => [...prev, { id: crypto.randomUUID(), user_id: user.id, text: commentText.trim(), created_at: new Date().toISOString(), username: "You", avatar_url: null }]);
    setCommentText("");
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    await supabase.rpc("increment_comments", { video_id: videoId, delta: -1 });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60" />
      <div className="relative bg-card rounded-t-3xl max-h-[55%] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4">
          <p className="font-heading text-sm font-bold text-foreground">
            Comments · {comments.length}
          </p>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 min-h-[100px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No comments yet. Be the first!</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3 group">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                  ) : null}
                  <span className={`text-[10px] font-bold text-muted-foreground ${c.avatar_url ? 'hidden' : ''}`}>{c.username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-semibold text-foreground">{c.username}</span>
                    <span className="text-muted-foreground ml-2 text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
                  </p>
                  <p className="text-sm text-foreground/80 mt-0.5">{c.text}</p>
                </div>
                {user && c.user_id === user.id && (
                  <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0 self-center transition-opacity">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-border/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              placeholder={user ? "Add a comment..." : "Log in to comment"}
              disabled={!user}
              className="flex-1 bg-secondary/50 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
            />
            <button
              onClick={handleComment}
              disabled={!user || !commentText.trim()}
              className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-30 active:scale-90 transition-transform"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedVideoCard;
