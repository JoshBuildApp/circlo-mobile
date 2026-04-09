import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Users, Lock, Crown, MessageCircle, ArrowLeft, Star, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunityMembership, useCommunityMemberCount } from "@/hooks/use-community";
import { useLike, trackView } from "@/hooks/use-feed";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface CoachInfo {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  tagline: string | null;
  bio: string | null;
  is_verified: boolean;
  user_id: string;
}

interface CommunityVideo {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  views: number | null;
  created_at: string;
  is_exclusive: boolean;
  is_featured: boolean;
  category: string;
}

const fmt = (n: number) => (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? (n / 1_000).toFixed(1) + "k" : String(n));

const CommunityPostCard = ({
  video,
  isMember,
  coachImage,
  coachName,
}: {
  video: CommunityVideo;
  isMember: boolean;
  coachImage: string | null;
  coachName: string;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const locked = video.is_exclusive && !isMember;
  const { liked, count: likeCount, toggleLike } = useLike(video.id);

  const handleLike = () => {
    if (!user) { navigate("/login"); return; }
    toggleLike();
  };

  return (
    <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
      {/* Coach header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="h-9 w-9 rounded-full overflow-hidden bg-secondary">
          {coachImage ? (
            <img src={coachImage} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
          ) : null}
          <div className={`h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground ${coachImage ? 'hidden' : ''}`}>
            {coachName?.[0] || '?'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{coachName}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
          </p>
        </div>
        {video.is_exclusive && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded	-full bg-primary/10 text-primary text-[10px] font-semibold">
            <Crown className="h-3 w-3" />
            Exclusive
          </span>
        )}
      </div>

      {/* Content */}
      {locked ? (
        <div className="relative aspect-video bg-secondary/50 flex flex-col items-center justify-center gap-3">
          <div className="absolute inset-0 backdrop-blur-xl bg-background/40" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Members Only</p>
            <p className="text-xs text-muted-foreground text-center px-8(">
              Join the community to unlock exclusive content
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {video.media_type === "video" ? (
            <video
              src={video.media_url}
              className="w-full aspect-video object-cover"
              controls
              playsInline
              muted
              preload="metadata"
            />
          ) : (
            <img src={video.media_url} alt={video.title} className="w-full aspect-video object-cover" />
          )}
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[13px] font-medium text-foreground leading-snug">{video.title}</p>
        {video.description && !locked && (
          <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-5 pt-1">
          <button onClick={handleLike} className="flex items-center gap-1.5 active:scale-95 transition-transform">
            <svg
              className={`h-5 w-5 transition-colors ${liked ? "text-red-500 fill-red-500" : "text-muted-foreground"}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              fill={liked ? "currentColor" : "none"}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="text-xs text-muted-foreground">{fmt(likeCount)}</span>
          </button>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{fmt(video.comments_count)}</span>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{fmt(video.views || 0)} views</span>
        </div>
      </div>
    </div>
  );
};

const CoachCommunityPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMember, toggleMembership, loading: memberLoading } = useCommunityMembership(id);
  const memberCount = useCommunityMemberCount(id);

  const [coach, setCoach] = useState<CoachInfo | null>(null);
  const [videos, setVideos] = useState<CommunityVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "exclusive">("all");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const { data: c } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, tagline, bio, is_verified, user_id")
        .eq("id", id)
        .maybeSingle();
      if (c) setCoach(c as unknown as CoachInfo);

      const { data: v } = await supabase
        .from("coach_videos")
        .select("id, title, description, media_url, media_type, likes_count, comments_count, views, created_at, is_exclusive, is_featured, category")
        .eq("coach_id", id)
        .order("created_at", { ascending: false });
      if (v) setVideos(v as unknown as CommunityVideo[]);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const filteredVideos = useMemo(() => {
    if (tab === "exclusive") return videos.filter((v) => v.is_exclusive);
    return videos;
  }, [videos, tab]);

  const handleJoin = () => {
    if (!user) { navigate("/login"); return; }
    toggleMembership();
    if (!isMember) toast.success("Welcome to the community!");
    else toast("Left community");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-muted-foreground">Community not found</p>
        <Link to="/discover" className="text-sm text-primary font-semibold">Discover coaches</Link>
      </div>
    );
  }

  return (
    <div className="pb-6 bg-background min-h-full">
      {/* Header */}
      <div className="relative">
        {/* Cover gradient */}
        <div className="h-40 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 h-9 w-9 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Coach avatar */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="h-24 w-24 rounded-2xl overflow-hidden border-4 border-background shadow-lg bg-secondary">
            {coach.image_url ? (
              <img src={coach.image_url} alt={coach.coach_name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
            ) : null}
            <div className={`h-full w-full flex items-center justify-center text-2xl font-bold text-primary bg-primary/10 ${coach.image_url ? 'hidden' : ''}`}>
              {coach.coach_name[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-3 pb-4 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">{coach.coach_name}'s Community</h1>
              {coach.is_verified && <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{coach.sport} • {coach.tagline || "Training community"}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{fmt(memberCount)}</span>
              <span className="text-xs text-muted-foreground">members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">{videos.length} posts</span>
            </div>
          </div>

          {/* Join CTA */}
          <button
            onClick={handleJoin}
            disabled={memberLoading}
            className={`w-full h-11 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              isMember
                ? "bg-secondary text-foreground border border-border/20"
                : "bg-primary text-primary-foreground shadow-md"
            }`}
          >
            {isMember ? "Joined" : "Join Community"}
          </button>

          {!isMember && (
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Crown className="h-3 w-3 text-primary" /> Exclusive content</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Members-only sessions</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-3">
        {(["all", "exclusive"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-medium transition-colors ${
              tab === t ? "bg-foreground text-background" : "bg-secondary text-foreground"
            }`}
          >
            {t === "exclusive" && <Crown className="h-3 w-3" />}
            {t === "all" ? "All Posts" : "Exclusive"}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="px-4 space-y-4">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {tab === "exclusive" ? "No exclusive content yet" : "No posts yet"}
            </p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <CommunityPostCard
              key={video.id}
              video={video}
              isMember={isMember}
              coachImage={coach.image_url}
              coachName={coach.coach_name}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CoachCommunityPage;
