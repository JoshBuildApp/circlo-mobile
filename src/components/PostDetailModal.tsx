import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, Bookmark, Share2, X, Send,
  CheckCircle2, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useComments, trackView } from "@/hooks/use-feed";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SafeImage } from "@/components/ui/safe-image";
import { formatDistanceToNow } from "date-fns";
import type { EngagementCardData } from "@/components/home/EngagementCard";

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

interface PostDetailModalProps {
  post: EngagementCardData | null;
  onClose: () => void;
  initialLiked?: boolean;
  initialLikeCount?: number;
  initialFollowing?: boolean;
}

const PostDetailModal = memo(({
  post,
  onClose,
  initialLiked,
  initialLikeCount,
  initialFollowing,
}: PostDetailModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [likesCount, setLikesCount] = useState(initialLikeCount ?? (post?.likes || 0));
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [viewTracked, setViewTracked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startY = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isDbItem = post?.isDb && post.id.includes("-");
  const hasVideo = post?.videoSrc && /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(post.videoSrc);
  const displayImage = post?.contentImage || post?.image || "";

  // Comments (lazy load only when modal is open)
  const { comments, count: commentCount, loading: commentsLoading, addComment } = useComments(
    isDbItem ? post?.id || "" : ""
  );

  // Sync initial states
  useEffect(() => {
    if (initialLiked !== undefined) setLiked(initialLiked);
  }, [initialLiked]);
  useEffect(() => {
    if (initialLikeCount !== undefined) setLikesCount(initialLikeCount);
  }, [initialLikeCount]);
  useEffect(() => {
    if (initialFollowing !== undefined) setFollowing(initialFollowing);
  }, [initialFollowing]);
  useEffect(() => {
    if (post) {
      setLikesCount(initialLikeCount ?? post.likes);
      setLiked(initialLiked ?? false);
    }
  }, [post?.id]);

  // Load saved state
  useEffect(() => {
    if (!user || !isDbItem || !post) return;
    supabase.from("saved_items").select("id").eq("user_id", user.id).eq("content_id", post.id).maybeSingle()
      .then(({ data }) => { if (data) setSaved(true); });
  }, [user?.id, post?.id, isDbItem]);

  // Auto-play video
  useEffect(() => {
    if (post && hasVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    return () => { videoRef.current?.pause(); };
  }, [post?.id, hasVideo]);

  // Lock body scroll
  useEffect(() => {
    if (post) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [post]);

  // Track view for videos
  const handleTimeUpdate = useCallback(() => {
    if (!viewTracked && isDbItem && post && videoRef.current && videoRef.current.currentTime >= 3) {
      setViewTracked(true);
      trackView(post.id);
    }
  }, [viewTracked, post?.id, isDbItem]);

  const handleLike = async () => {
    if (!user) { navigate("/login"); return; }
    if (!post) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
    if (isDbItem) {
      try {
        if (wasLiked) {
          await supabase.from("likes").delete().eq("user_id", user.id).eq("content_id", post.id);
          await supabase.rpc("increment_likes", { video_id: post.id, delta: -1 });
        } else {
          await supabase.from("likes").upsert({ user_id: user.id, content_id: post.id }, { onConflict: "user_id,content_id" });
          await supabase.rpc("increment_likes", { video_id: post.id, delta: 1 });
        }
      } catch {
        setLiked(wasLiked);
        setLikesCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
      }
    }
  };

  const handleSave = async () => {
    if (!user) { navigate("/login"); return; }
    if (!post) return;
    const newSaved = !saved;
    setSaved(newSaved);
    toast.success(newSaved ? "Saved!" : "Removed from saved");
    if (isDbItem) {
      try {
        if (newSaved) {
          await supabase.from("saved_items").upsert(
            { user_id: user.id, content_id: post.id, collection_name: "Saved" },
            { onConflict: "user_id,content_id,collection_name" }
          );
        } else {
          await supabase.from("saved_items").delete().eq("user_id", user.id).eq("content_id", post.id);
        }
      } catch { setSaved(!newSaved); }
    }
  };

  const handleShare = () => {
    if (!post) return;
    const url = window.location.origin + `/coach/${post.coachId}`;
    if (navigator.share) {
      navigator.share({ title: post.caption, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const toggleFollow = async () => {
    if (!user) { navigate("/login"); return; }
    if (!post) return;
    if (following) {
      await supabase.from("user_follows").delete().eq("user_id", user.id).eq("coach_id", post.coachId);
      setFollowing(false);
    } else {
      await supabase.from("user_follows").insert({ user_id: user.id, coach_id: post.coachId });
      setFollowing(true);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post) return;
    await addComment(commentText.trim());
    setCommentText("");
  };

  // Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY.current !== null) {
      const delta = e.changedTouches[0].clientY - startY.current;
      if (delta > 100) onClose();
      startY.current = null;
    }
  };

  if (!post) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="h-full w-full max-w-lg mx-auto flex flex-col overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/10 flex-shrink-0">
          <Link to={`/coach/${post.coachId}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-9 w-9 rounded-full overflow-hidden bg-secondary flex-shrink-0">
              {post.image && (
                <SafeImage src={post.image} alt={post.coachName} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-foreground truncate">{post.coachName}</span>
                {post.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />}
              </div>
              <span className="text-[10px] text-muted-foreground capitalize">{post.sport}</span>
            </div>
          </Link>
          <button
            onClick={toggleFollow}
            className={cn(
              "h-8 px-3 rounded-lg text-[11px] font-bold flex items-center active:scale-95 transition-all",
              following ? "bg-secondary text-muted-foreground" : "bg-foreground text-background"
            )}
          >
            {following ? "Following" : "Follow"}
          </button>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-all">
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Swipe indicator */}
        <div className="flex justify-center py-1 flex-shrink-0">
          <ChevronDown className="h-4 w-4 text-muted-foreground/30" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Media */}
          <div
            className="relative w-full bg-secondary select-none"
            style={{ aspectRatio: "4/5" }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {hasVideo ? (
              <video
                ref={videoRef}
                src={post.videoSrc}
                className="absolute inset-0 w-full h-full object-cover pointer-events-auto"
                muted
                loop
                playsInline
                controls
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : (
              <SafeImage
                src={displayImage}
                alt={post.caption}
                className="absolute inset-0 w-full h-full object-cover"
                fallbackSrc={post.image}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
              />
            )}
            {/* Invisible overlay to block long-press on images */}
            {!hasVideo && (
              <div
                className="absolute inset-0"
                onContextMenu={(e) => e.preventDefault()}
                style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
              />
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={handleLike} className="flex items-center gap-1.5 active:scale-110 transition-transform">
                <Heart className={cn("h-6 w-6 transition-all", liked ? "text-destructive fill-destructive" : "text-foreground")} />
              </button>
              <button className="active:scale-110 transition-transform">
                <MessageCircle className="h-6 w-6 text-foreground" />
              </button>
              <button onClick={handleShare} className="active:scale-110 transition-transform">
                <Share2 className="h-5 w-5 text-foreground" />
              </button>
              <div className="flex-1" />
              <button onClick={handleSave} className="active:scale-110 transition-transform">
                <Bookmark className={cn("h-6 w-6 transition-all", saved ? "text-accent fill-accent" : "text-foreground")} />
              </button>
            </div>
            <p className="text-xs font-bold text-foreground mb-1">{fmt(likesCount)} likes</p>
            <p className="text-sm text-foreground">
              <span className="font-bold">{post.coachName}</span>{" "}{post.caption}
            </p>
            {post.views > 0 && <p className="text-[11px] text-muted-foreground mt-1">{fmt(post.views)} views</p>}
          </div>

          {/* Comments */}
          <div className="px-4 pb-4">
            {isDbItem && (
              <>
                <p className="text-xs font-semibold text-muted-foreground mb-3">
                  {commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? "s" : ""}` : "No comments yet"}
                </p>
                {commentsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {c.avatar_url ? (
                            <SafeImage src={c.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-muted-foreground">{c.username[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground">
                            <span className="font-bold">{c.username}</span>{" "}{c.text}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Comment input (sticky bottom) */}
        {isDbItem && user && (
          <div className="flex-shrink-0 border-t border-border/10 px-4 py-3 bg-background">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
                placeholder="Add a comment..."
                className="flex-1 h-9 bg-secondary rounded-full px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="h-9 w-9 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PostDetailModal.displayName = "PostDetailModal";

export default PostDetailModal;
