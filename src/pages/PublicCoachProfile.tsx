import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  MessageSquare,
  Play,
  Share2,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestGate } from "@/contexts/GuestGateContext";
import { useCoachPublicProfile } from "@/hooks/use-coach-public-profile";
import { useCoachReviews } from "@/hooks/use-coach-reviews";
import { useCoachVideos } from "@/hooks/use-coach-videos";
import { useFollow } from "@/hooks/use-follow";
import { useFollowerCount } from "@/hooks/use-follower-counts";
import { useProfileViewTracker } from "@/hooks/use-rate-limits";
import { supabase } from "@/integrations/supabase/client";
import { BookingModal } from "@/components/BookingModal";
import FollowersModal from "@/components/FollowersModal";
import ShareSheet from "@/components/ShareSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

type Tab = "feed" | "videos" | "reviews" | "about";

interface FollowerAvatar {
  user_id: string;
  avatar_url: string | null;
  username: string | null;
}

interface UpcomingSession {
  date: string;
  start_time: string;
  title: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`
    : String(n);

const timeAgo = (iso: string) => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

interface PublicCoachProfileProps {
  previewCoachId?: string;
  isPreview?: boolean;
  /* Legacy prop kept for component callers — not used in this view */
  isEditing?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════
   Main
   ═══════════════════════════════════════════════════════════════════════ */

const PublicCoachProfile = ({ previewCoachId, isPreview = false }: PublicCoachProfileProps = {}) => {
  const { id: routeId } = useParams<{ id: string }>();
  const coachId = previewCoachId || routeId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireAuth } = useGuestGate();

  const [tab, setTab] = useState<Tab>("feed");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [followerAvatars, setFollowerAvatars] = useState<FollowerAvatar[]>([]);
  const [nextSession, setNextSession] = useState<UpcomingSession | null>(null);

  const { data: coach, isLoading } = useCoachPublicProfile(coachId);
  const { reviews, stats } = useCoachReviews(coachId);
  const { videos: allContent } = useCoachVideos(coachId);
  const { following, toggleFollow, loading: followLoading } = useFollow(coachId);
  const { followerCount } = useFollowerCount(coachId);
  const { trackView } = useProfileViewTracker();

  /* Track view once when the public page opens */
  useEffect(() => {
    if (isPreview || !coachId) return;
    trackView(coachId);
  }, [coachId, isPreview, trackView]);

  /* Load 3 recent follower avatars for the hero avatar-stack */
  useEffect(() => {
    if (!coachId) return;
    let cancelled = false;
    (async () => {
      const { data: follows } = await supabase
        .from("user_follows")
        .select("user_id")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false })
        .limit(3);
      if (!follows || follows.length === 0 || cancelled) return;
      const ids = follows.map((f: any) => f.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, avatar_url, username")
        .in("user_id", ids);
      if (!cancelled) setFollowerAvatars((profiles as FollowerAvatar[]) || []);
    })();
    return () => { cancelled = true; };
  }, [coachId]);

  /* Load the coach's next upcoming open training (for Next Highlight card) */
  useEffect(() => {
    if (!coachId) return;
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("open_trainings")
        .select("date, start_time, title")
        .eq("coach_id", coachId)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(1);
      if (!cancelled && data && data.length > 0) setNextSession(data[0] as UpcomingSession);
    })();
    return () => { cancelled = true; };
  }, [coachId]);

  /* Derived */
  const videos = useMemo(
    () => (allContent || []).filter(
      (v: any) => v.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(v.media_url || "")
    ),
    [allContent]
  );

  const posts = useMemo(
    () => (allContent || []).filter(
      (v: any) => v.media_type === "image" || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(v.media_url || "")
    ),
    [allContent]
  );

  const feedItems = useMemo(() => {
    const combined = [...(videos || []), ...(posts || [])];
    return combined
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [videos, posts]);

  const avgRating = coach && stats.count > 0 ? stats.average : coach?.rating || 0;
  const totalReviews = stats.count || 0;
  const followers = followerCount > 0 ? followerCount : coach?.followers || 0;
  const sessionsCount = coach?.total_sessions || 0;

  const isOwner = !!user && !!coach && coach.user_id === user.id;

  const handleFollow = () => {
    if (isOwner) {
      toast.info("This is your own profile");
      return;
    }
    requireAuth(() => toggleFollow(), {
      action: "follow",
      targetUserId: coach?.user_id,
      targetCoachName: coach?.coach_name,
    });
  };

  const handleBook = () => {
    if (isOwner) {
      toast.info("You can't book yourself");
      return;
    }
    requireAuth(() => setBookingOpen(true), {
      action: "book",
      targetUserId: coach?.user_id,
      targetCoachName: coach?.coach_name,
    });
  };

  const handleMessage = () => {
    if (!coach?.user_id) return;
    requireAuth(() => navigate(`/chat/${coach.user_id}`), {
      action: "message",
      targetUserId: coach.user_id,
      targetCoachName: coach.coach_name,
    });
  };

  /* Loading state */
  if (isLoading || !coach) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Skeleton className="h-[420px] w-full rounded-none" />
        <div className="px-6 -mt-20 relative z-10 space-y-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-12 w-64" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-32 rounded-md" />
            <Skeleton className="h-12 w-20 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const heroImage = coach.cover_media || coach.image_url || "";
  const sportUpper = (coach.sport || "").toUpperCase();
  const proBadge = coach.is_verified ? "PRO COACH" : sportUpper;

  return (
    <div className="min-h-screen bg-background pb-32 app-top-nav">
      {/* ═══════ HERO ═══════ */}
      <section className="relative h-[420px] w-full overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt={coach.coach_name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-kinetic" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full glass-dark border border-white/10">
            {coach.is_verified && <Sparkles className="h-3 w-3 text-[#46f1c5]" />}
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#46f1c5]">
              {proBadge}
            </span>
          </div>

          {/* Big italic name */}
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-[0.95] text-white mb-5">
            {coach.coach_name}
          </h1>

          {/* Follow button + avatar stack */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={cn(
                "font-black uppercase tracking-[0.15em] px-7 py-3 rounded-md text-xs shadow-[0_10px_30px_rgba(0,212,170,0.35)] active:scale-95 transition-transform inline-flex items-center gap-2",
                following
                  ? "bg-white/10 text-white border border-white/20 backdrop-blur-md"
                  : "bg-gradient-kinetic text-white"
              )}
            >
              {following ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Following
                </>
              ) : (
                "Follow"
              )}
            </button>

            <button
              onClick={() => setFollowersOpen(true)}
              className="flex items-center"
              aria-label="View followers"
            >
              <div className="flex -space-x-3">
                {followerAvatars.slice(0, 3).map((f, i) =>
                  f.avatar_url ? (
                    <img
                      key={f.user_id}
                      src={f.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-background object-cover"
                      style={{ zIndex: 3 - i }}
                    />
                  ) : (
                    <div
                      key={f.user_id}
                      className="w-8 h-8 rounded-full border-2 border-background bg-card flex items-center justify-center text-[10px] font-black text-[#46f1c5]"
                      style={{ zIndex: 3 - i }}
                    >
                      {f.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )
                )}
                {followers > 3 && (
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-card flex items-center justify-center text-[10px] font-black text-[#46f1c5]">
                    +{fmt(Math.max(followers - 3, 0))}
                  </div>
                )}
              </div>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleMessage}
                className="h-11 w-11 rounded-full glass-dark border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform"
                aria-label="Message coach"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="h-11 w-11 rounded-full glass-dark border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform"
                aria-label="Share profile"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STICKY TABS ═══════ */}
      <nav className="sticky top-16 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex gap-8 overflow-x-auto scrollbar-hide border-b border-border/40">
        {(["feed", "videos", "reviews", "about"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-shrink-0 text-xs font-black tracking-[0.2em] pb-1 uppercase transition-colors",
              tab === t
                ? "text-[#46f1c5] border-b-2 border-[#46f1c5]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* ═══════ TAB CONTENT ═══════ */}
      <div className="px-6 mt-6 space-y-8">
        {tab === "feed" && (
          <>
            {/* Next Highlight — next open training or Book CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-card rounded-lg p-6 overflow-hidden border border-border/40"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-kinetic opacity-10 blur-3xl pointer-events-none" />

              {nextSession ? (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div className="max-w-[70%]">
                      <span className="text-[10px] font-black tracking-[0.25em] text-[#ffb59a] uppercase mb-2 block">
                        Next Highlight
                      </span>
                      <h3 className="text-2xl font-bold text-foreground leading-tight">
                        {nextSession.title}
                      </h3>
                    </div>
                    <div className="bg-muted/40 border border-border/40 rounded-lg p-3 flex flex-col items-center min-w-[60px]">
                      <span className="text-[10px] font-black text-[#46f1c5] uppercase">
                        {new Date(nextSession.date + "T00:00:00").toLocaleString("default", { month: "short" })}
                      </span>
                      <span className="text-xl font-black text-foreground">
                        {new Date(nextSession.date + "T00:00:00").getDate()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{nextSession.start_time?.slice(0, 5) || "TBD"}</span>
                    </div>
                    {coach.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{coach.location}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleBook}
                    className="w-full py-3 bg-muted/40 border border-border/40 rounded-md text-sm font-black text-foreground uppercase tracking-[0.2em] hover:bg-muted/60 transition-colors"
                  >
                    Register Now
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black tracking-[0.25em] text-[#ffb59a] uppercase mb-2 block">
                        Book a session
                      </span>
                      <h3 className="text-2xl font-bold text-foreground leading-tight">
                        Train with {coach.coach_name.split(" ")[0]}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {coach.session_duration || 60} min · ₪{coach.price || 0}
                      </p>
                    </div>
                    <Calendar className="h-7 w-7 text-[#46f1c5]" />
                  </div>
                  <button
                    onClick={handleBook}
                    className="w-full py-3 bg-gradient-kinetic text-white rounded-md text-sm font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-transform"
                  >
                    Book Session
                  </button>
                </>
              )}
            </motion.div>

            {/* Bento stats row */}
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-5 flex flex-col justify-between aspect-square border border-border/40">
                <Trophy className="h-7 w-7 text-[#46f1c5]" />
                <div>
                  <div className="text-3xl font-black text-foreground leading-none">{fmt(sessionsCount)}</div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    Sessions coached
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFollowersOpen(true)}
                className="bg-card rounded-lg p-5 flex flex-col justify-between aspect-square border border-border/40 active:scale-95 transition-transform text-left"
              >
                <Users className="h-7 w-7 text-[#ffb59a]" />
                <div>
                  <div className="text-3xl font-black text-foreground leading-none">{fmt(followers)}</div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    Followers
                  </div>
                </div>
              </button>
            </section>

            {/* Latest from the court — mini feed */}
            {feedItems.length > 0 && (
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                  Latest from the court
                </h4>

                {feedItems.map((item: any) => {
                  const isVideo = item.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(item.media_url || "");
                  const thumb = item.thumbnail_url || item.media_url;
                  return (
                    <article key={item.id} className="bg-card rounded-lg overflow-hidden border border-border/40">
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-[#46f1c5]/30 overflow-hidden bg-muted/40">
                          {coach.image_url ? (
                            <img src={coach.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-kinetic" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground truncate">{coach.coach_name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {sportUpper} · {timeAgo(item.created_at)}
                          </p>
                        </div>
                        {coach.is_verified && (
                          <div className="h-6 w-6 rounded-full bg-[#46f1c5]/20 flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-[#46f1c5]" />
                          </div>
                        )}
                      </div>

                      {item.title && (
                        <div className="px-4 pb-3">
                          <p className="text-sm text-foreground/80 leading-relaxed">{item.title}</p>
                        </div>
                      )}

                      {thumb && (
                        <div className="relative mx-4 mb-4 rounded-lg overflow-hidden aspect-[4/3] bg-muted/40">
                          {isVideo ? (
                            <>
                              <video
                                src={item.media_url}
                                className="absolute inset-0 w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-14 w-14 rounded-full glass-dark flex items-center justify-center border border-white/15">
                                  <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <img src={thumb} alt={item.title || ""} className="w-full h-full object-cover" />
                          )}
                          {(item.likes_count || 0) > 0 && (
                            <div className="absolute top-3 right-3 glass-dark rounded-full px-3 py-1 flex items-center gap-1">
                              <Heart className="h-3 w-3 text-white" fill="currentColor" />
                              <span className="text-[10px] font-black text-white">{fmt(item.likes_count)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {tab === "videos" && (
          <section>
            {videos.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-lg border border-border/40">
                <Play className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">No videos yet</p>
                <p className="text-xs text-muted-foreground mt-1">Check back soon for training clips</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {videos.map((v: any) => (
                  <div key={v.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-card border border-border/40 group">
                    <video
                      src={v.media_url}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-2 right-2 h-7 w-7 rounded-full glass-dark flex items-center justify-center border border-white/20">
                      <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                    </div>
                    {v.title && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white truncate">
                          {v.title}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "reviews" && (
          <section className="space-y-4">
            {/* Rating summary */}
            <div className="bg-card rounded-lg p-6 border border-border/40 flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-black text-foreground">{avgRating.toFixed(1)}</div>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < Math.round(avgRating) ? "text-[#ffb59a] fill-[#ffb59a]" : "text-muted-foreground/40"
                      )}
                    />
                  ))}
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((r) => {
                  const count = reviews.filter((rev: any) => rev.rating === r).length;
                  const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={r} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="w-2 font-bold">{r}</span>
                      <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <div className="h-full bg-[#ffb59a] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-4 font-bold text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-lg border border-border/40">
                <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">No reviews yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to train and review</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 8).map((r: any) => (
                  <div key={r.id} className="bg-card rounded-lg p-4 border border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-foreground">{r.user_name || "Member"}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < r.rating ? "text-[#ffb59a] fill-[#ffb59a]" : "text-muted-foreground/40"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-foreground/80 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "about" && (
          <section className="space-y-6">
            {coach.tagline && (
              <div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">
                  Tagline
                </h4>
                <p className="text-lg font-bold text-foreground leading-tight">{coach.tagline}</p>
              </div>
            )}

            {coach.bio && (
              <div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">
                  The Vision
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{coach.bio}</p>
              </div>
            )}

            {coach.specialties && coach.specialties.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">
                  Specialties
                </h4>
                <div className="flex flex-wrap gap-2">
                  {coach.specialties.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#46f1c5]/10 text-[#46f1c5] border border-[#46f1c5]/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {coach.years_experience ? (
                <div className="bg-card rounded-lg p-4 border border-border/40">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                    Experience
                  </div>
                  <div className="text-xl font-black text-foreground mt-1">
                    {coach.years_experience}+ yrs
                  </div>
                </div>
              ) : null}
              {coach.location ? (
                <div className="bg-card rounded-lg p-4 border border-border/40">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                    Based in
                  </div>
                  <div className="text-sm font-bold text-foreground mt-1 leading-tight">
                    {coach.location}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              onClick={handleBook}
              className="w-full py-4 bg-gradient-kinetic text-white rounded-md text-sm font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-transform shadow-[0_10px_30px_rgba(0,212,170,0.25)] inline-flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Book a session
            </button>
          </section>
        )}
      </div>

      {/* Sticky book button on feed/videos/reviews tabs — mobile quick action */}
      {tab !== "about" && (
        <div className="fixed bottom-24 left-0 right-0 z-40 px-6 pointer-events-none">
          <button
            onClick={handleBook}
            className="pointer-events-auto w-full py-4 bg-gradient-kinetic text-white rounded-md text-sm font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-transform shadow-[0_20px_40px_rgba(0,212,170,0.3)] inline-flex items-center justify-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Book session
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ═══════ MODALS ═══════ */}
      {bookingOpen && coach && (
        <BookingModal
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          coachId={coach.id}
          coachProfileId={coach.id}
          sessionType="individual"
          price={coach.price || 0}
          coachName={coach.coach_name}
          coachImage={coach.image_url || undefined}
          sport={coach.sport || undefined}
          sessionDuration={coach.session_duration || 60}
          selectedDate={null}
          selectedTime={null}
        />
      )}

      {coachId && (
        <FollowersModal
          open={followersOpen}
          onClose={() => setFollowersOpen(false)}
          coachId={coachId}
          userId={user?.id}
          initialTab="followers"
        />
      )}

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`${coach.coach_name} on Circlo`}
        text={`Check out ${coach.coach_name} — ${coach.sport} coach on Circlo`}
        url={`/coach/${coachId}`}
      />
    </div>
  );
};

export default PublicCoachProfile;
