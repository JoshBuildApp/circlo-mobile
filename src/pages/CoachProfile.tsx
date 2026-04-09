import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  MapPin, Users, Heart, Play, Star,
  Clock, Zap, Video, Award, Shield, Globe, Timer,
  CheckCircle2, ChevronRight, Eye, Calendar, Lock,
  ChevronDown, Image, Flame, TrendingUp, Sparkles, ShoppingBag,
} from "lucide-react";
import CoachProfileHero from "@/components/CoachProfileHero";
import { format } from "date-fns";
import PageLab from "@/components/PageLab";
import { usePageSections } from "@/hooks/use-page-sections";
import { Badge } from "@/components/ui/badge";
import { BookingModal } from "@/components/BookingModal";
import CoachCommunity from "@/components/CoachCommunity";
import BookingCalendar from "@/components/BookingCalendar";
import OpenTrainings from "@/components/OpenTrainings";
import CoachStore, { StorePreviewStrip } from "@/components/CoachStore";
import { useCoachProducts } from "@/hooks/use-products";
import { coaches } from "@/data/coaches";
import { useDataMode } from "@/contexts/DataModeContext";
import { useAvailability, useBlockedSlots, useBookedSlots, getNextAvailableFromSlots } from "@/hooks/use-availability";
import { supabase } from "@/integrations/supabase/client";
import { useFollow } from "@/hooks/use-follow";
import { useCoachVideos } from "@/hooks/use-coach-videos";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useFollowerCount } from "@/hooks/use-follower-counts";
import FollowersModal from "@/components/FollowersModal";
import VideoShowcase from "@/components/VideoShowcase";
import CoachPackagesSection from "@/components/CoachPackagesSection";

const fmt = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : n.toString());

interface DbCoachProfile {
  id: string;
  user_id: string;
  coach_name: string;
  sport: string;
  bio: string | null;
  image_url: string | null;
  cover_media: string | null;
  location: string | null;
  price: number | null;
  rating: number | null;
  followers: number | null;
  years_experience: number | null;
  tagline: string | null;
  specialties: string[] | null;
  session_duration: number | null;
  languages: string[] | null;
  certifications: string[] | null;
  achievements: string[] | null;
  intro_video_url: string | null;
  total_sessions: number | null;
  response_time: string | null;
  is_verified: boolean;
  training_style: string | null;
  ideal_for: string | null;
}

interface DbReview {
  id: string;
  rating: number;
  comment: string | null;
  user_name: string | null;
  created_at: string;
}

interface ContentItem {
  id: string;
  title: string;
  url?: string;
  media_url?: string;
  thumbnail?: string;
  category?: string;
  duration?: string;
  views?: number;
  description?: string | null;
  media_type?: string;
  likes_count?: number;
}

/* ─── Clip Grid Thumbnail (auto-play on visible) ─── */
const ClipThumb = memo(({ item, onPlay }: { item: ContentItem; onPlay: (url: string) => void }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLButtonElement>(null);
  const mediaUrl = item.media_url || item.url || "";
  const isVideo = item.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(mediaUrl);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { e.isIntersecting ? el.play().catch(() => {}) : el.pause(); },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={containerRef}
      onClick={() => onPlay(mediaUrl)}
      className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary group active:scale-[0.97] transition-transform"
    >
      {isVideo ? (
        <video
          ref={ref}
          src={mediaUrl}
          className="absolute inset-0 w-full h-full object-cover"
          muted loop playsInline preload="metadata"
        />
      ) : (
        <img
          src={item.thumbnail || mediaUrl}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {isVideo && (
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <Play className="h-2.5 w-2.5 text-white fill-white ml-[1px]" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight">{item.title}</p>
        {item.views !== undefined && item.views > 0 && (
          <span className="flex items-center gap-0.5 text-white/60 text-[9px] mt-0.5">
            <Eye className="h-2.5 w-2.5" />{fmt(item.views)}
          </span>
        )}
      </div>
    </button>
  );
});
ClipThumb.displayName = "ClipThumb";

/* ─── Post Grid Thumbnail ─── */
const PostThumb = memo(({ item, onPlay }: { item: ContentItem; onPlay: (url: string) => void }) => {
  const mediaUrl = item.media_url || item.url || item.thumbnail || "";
  return (
    <button
      onClick={() => onPlay(mediaUrl)}
      className="relative aspect-square rounded-xl overflow-hidden bg-secondary group active:scale-[0.97] transition-transform"
    >
      <img
        src={item.thumbnail || mediaUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {item.likes_count !== undefined && item.likes_count > 0 && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white/80 text-[9px]">
          <Heart className="h-2.5 w-2.5" />{fmt(item.likes_count)}
        </div>
      )}
    </button>
  );
});
PostThumb.displayName = "PostThumb";

/* ─── Rating Breakdown Bar ─── */
const RatingBar = ({ stars, count, total }: { stars: number; count: number; total: number }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground w-3 text-right">{stars}</span>
      <Star className="h-3 w-3 text-accent fill-accent flex-shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-5 text-right">{count}</span>
    </div>
  );
};

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const CoachProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRealMode } = useDataMode();
  const staticCoach = isRealMode ? undefined : coaches.find((c) => c.id === id);
  const [bookingOpen, setBookingOpen] = useState(false);
  const { following, toggleFollow } = useFollow(id);
  const { followerCount, refreshCount } = useFollowerCount(id);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [playingMediaUrl, setPlayingMediaUrl] = useState<string | null>(null);
  const [playingMediaIsVideo, setPlayingMediaIsVideo] = useState(false);
  const [activeTab, setActiveTab] = useState<"clips" | "posts" | "community" | "reviews" | "store">("clips");
  const { videos: uploadedVideos } = useCoachVideos(id);
  const [coachProfileId, setCoachProfileId] = useState<string | undefined>();
  const [dbProfile, setDbProfile] = useState<DbCoachProfile | null>(null);
  const { products: storeProducts } = useCoachProducts(coachProfileId);
  const [dbReviews, setDbReviews] = useState<DbReview[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [showFullBio, setShowFullBio] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [heroScrolled, setHeroScrolled] = useState(false);
  const [pageLabOpen, setPageLabOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parallax-like hero shrink on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setHeroScrolled(el.scrollTop > 200);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Lookup DB coach profile
  const fetchCoachProfile = useCallback(async () => {
    if (!id) return;
    setDbLoading(true);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const { data } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        setCoachProfileId(data.id);
        setDbProfile(data as unknown as DbCoachProfile);
      }
    }
    setDbLoading(false);
  }, [id]);

  useEffect(() => { fetchCoachProfile(); }, [fetchCoachProfile]);

  // Re-fetch when profile is updated from EditProfile
  useEffect(() => {
    const handler = () => { fetchCoachProfile(); };
    window.addEventListener("profile-updated", handler);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCoachProfile();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("profile-updated", handler);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchCoachProfile]);

  // Load reviews from DB
  useEffect(() => {
    if (!coachProfileId) return;
    const loadReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, user_name, created_at")
        .eq("coach_id", coachProfileId)
        .order("created_at", { ascending: false });
      if (data) setDbReviews(data);
    };
    loadReviews();
  }, [coachProfileId]);

  const { slots: availabilitySlots } = useAvailability(coachProfileId);
  const { blocked } = useBlockedSlots(coachProfileId);
  const { bookedMap } = useBookedSlots(coachProfileId);

  const nextSlot = useMemo(
    () => getNextAvailableFromSlots(availabilitySlots, bookedMap, blocked),
    [availabilitySlots, bookedMap, blocked]
  );

  // Derived values
  const hasCoach = !!staticCoach || !!dbProfile;
  const name = dbProfile ? (dbProfile.coach_name || "Coach") : (staticCoach?.name || "Coach");
  const sport = dbProfile ? (dbProfile.sport ?? "") : (staticCoach?.sport ?? "");
  const location = dbProfile ? (dbProfile.location ?? "") : (staticCoach?.location ?? "");
  const image = dbProfile ? (dbProfile.image_url || "/placeholder.svg") : (staticCoach?.image || "/placeholder.svg");
  const coverImage = dbProfile ? (dbProfile.cover_media || dbProfile.image_url || "/placeholder.svg") : (staticCoach?.coverImage || staticCoach?.image || "/placeholder.svg");
  const tagline = dbProfile ? (dbProfile.tagline ?? "") : (staticCoach?.tagline ?? "");
  const bio = dbProfile ? (dbProfile.bio ?? "") : (staticCoach?.bio ?? "");
  const longBio = dbProfile ? (dbProfile.bio ?? "") : (staticCoach?.longBio ?? "");
  const coachingStyle = dbProfile ? (dbProfile.training_style ?? "") : (staticCoach?.coachingStyle ?? "");
  const idealFor = dbProfile ? (dbProfile.ideal_for ?? "") : (staticCoach?.idealFor ?? "");
  const specialties = dbProfile ? (dbProfile.specialties ?? []) : (staticCoach?.specialties ?? []);
  const price = dbProfile ? (dbProfile.price ?? 50) : (staticCoach?.price ?? 50);
  const rating = dbProfile ? (dbProfile.rating ?? 5) : (staticCoach?.rating ?? 5);
  const followers = followerCount > 0 ? followerCount : (dbProfile?.followers ?? staticCoach?.followers ?? 0);
  const yearsExperience = dbProfile ? (dbProfile.years_experience ?? 0) : (staticCoach?.yearsExperience ?? 0);
  const sessionDuration = dbProfile?.session_duration ?? 60;
  const certifications = dbProfile?.certifications ?? [];
  const achievements = dbProfile?.achievements ?? [];
  const introVideoUrl = dbProfile?.intro_video_url;
  const totalSessions = dbProfile?.total_sessions ?? 0;
  const responseTime = dbProfile ? (dbProfile.response_time ?? "") : "Under 1 hour";
  const languages = dbProfile?.languages ?? [];
  const isVerified = dbProfile?.is_verified ?? false;
  const isOwner = !!user && !!dbProfile && dbProfile.user_id === user.id;

  // Load page sections for dynamic rendering
  const { sections: pageSections, loading: sectionsLoading, loadSections: reloadSections } = usePageSections(coachProfileId);

  const staticVideos = staticCoach?.videos || [];

  // Build unified content
  const contentFeed = useMemo(() => {
    const items: ContentItem[] = [];
    uploadedVideos.forEach((uv) => {
      const url = uv.media_url || "";
      const isVid = uv.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url);
      const isImg = uv.media_type === "image" || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
      if (!url || (!isVid && !isImg)) return;
      items.push({
        id: uv.id,
        title: uv.title,
        media_url: url,
        thumbnail: uv.thumbnail_url || undefined,
        views: uv.views,
        description: uv.description,
        media_type: isVid ? "video" : "image",
        likes_count: (uv as any).likes_count || 0,
      });
    });
    staticVideos.forEach((sv, i) => {
      const url = sv.url || "";
      if (!url) return;
      items.push({
        id: `static-${i}`,
        title: sv.title,
        url,
        thumbnail: sv.thumbnail,
        category: sv.category,
        duration: sv.duration,
        views: sv.views,
        media_type: /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url) ? "video" : "image",
        likes_count: 0,
      });
    });
    return items;
  }, [uploadedVideos, staticVideos]);

  const clips = useMemo(() => contentFeed.filter((i) => {
    const url = i.media_url || i.url || "";
    return i.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url);
  }), [contentFeed]);

  const posts = useMemo(() => contentFeed.filter((i) => {
    const url = i.media_url || i.url || "";
    return i.media_type === "image" || (!/\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url) && (url.includes(".jpg") || url.includes(".png") || url.includes(".webp") || i.thumbnail));
  }), [contentFeed]);

  // Reviews
  const allReviews = useMemo(() => [
    ...dbReviews.map((r) => ({
      name: r.user_name || "User",
      avatar: (r.user_name || "U")[0],
      rating: r.rating,
      text: r.comment || "",
      date: format(new Date(r.created_at), "MMM d, yyyy"),
    })),
    ...(staticCoach?.reviews || []),
  ], [dbReviews, staticCoach]);

  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : String(rating);

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    allReviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++; });
    return counts;
  }, [allReviews]);

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: `${name} — Coach Profile`, url: window.location.href });
    } catch { /* cancelled */ }
  };

  // Loading
  if (!hasCoach && dbLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasCoach) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">Coach not found</p>
        <Link to="/home" className="text-primary hover:underline font-semibold">Back to home</Link>
      </div>
    );
  }

  // Build tabs
  const TAB_TYPES = ["clips", "posts", "community", "reviews", "store"] as const;
  const TAB_META: Record<string, { label: string; icon: typeof Video; count: number | null }> = {
    clips: { label: "Clips", icon: Video, count: clips.length },
    posts: { label: "Posts", icon: Image, count: posts.length },
    community: { label: "Community", icon: Users, count: null },
    reviews: { label: "Reviews", icon: Star, count: allReviews.length },
    store: { label: "Store", icon: ShoppingBag, count: storeProducts.length > 0 ? storeProducts.length : null },
  };

  const hasCustomLayout = pageSections.length > 0 && pageSections[0]?.id?.startsWith("default-") === false;

  const visibleTabTypes = (() => {
    if (!hasCustomLayout) return ["clips", "posts", "store", "community", "reviews"];
    const fromLab = pageSections
      .filter((s) => TAB_TYPES.includes(s.section_type as any) && s.is_visible)
      .map((s) => s.section_type)
      .filter((t) => t in TAB_META);
    if (!fromLab.includes("store")) fromLab.push("store");
    return fromLab;
  })();

  const tabs = visibleTabTypes.map((key) => ({
    key: key as "clips" | "posts" | "community" | "reviews" | "store",
    ...TAB_META[key],
  }));
  const validActiveTab = tabs.find((t) => t.key === activeTab) ? activeTab : (tabs[0]?.key || "clips");

  const belowTabSections = hasCustomLayout
    ? pageSections.filter((s) => !TAB_TYPES.includes(s.section_type as any) && s.is_visible)
    : [];

  return (
    <div ref={scrollRef} className="min-h-screen bg-background overflow-y-auto pb-24">
      {/* ═══════ HERO ═══════ */}
      <CoachProfileHero
        name={name}
        sport={sport}
        tagline={tagline}
        location={location}
        image={image}
        coverImage={coverImage}
        introVideoUrl={introVideoUrl}
        price={price}
        rating={avgRating}
        reviewCount={allReviews.length}
        followers={followers}
        specialties={specialties}
        isVerified={isVerified}
        isOwner={isOwner}
        following={following}
        coachUserId={dbProfile?.user_id}
        onBooking={() => setBookingOpen(true)}
        onToggleFollow={async () => { await toggleFollow(); refreshCount(); }}
        onPageLab={() => setPageLabOpen(true)}
        onFollowersOpen={() => { setFollowersModalTab("followers"); setFollowersModalOpen(true); }}
      />

      {/* ═══════ QUICK INFO BAR ═══════ */}
      <div className="px-5 py-4">
        <div className="bg-card rounded-2xl border border-border/10 p-3.5">
          <div className="grid grid-cols-4 gap-1">
            {[
              { value: `$${price}`, label: "Per session", icon: Zap, accent: true },
              { value: location || "—", label: "Location", icon: MapPin, accent: false },
              { value: `${yearsExperience}yr`, label: "Experience", icon: Clock, accent: false },
              { value: `${sessionDuration}m`, label: "Duration", icon: Timer, accent: false },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`font-heading text-base font-bold ${s.accent ? "gradient-text" : "text-foreground"}`}>{s.value}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ PERSONALITY LAYER ═══════ */}
      {(specialties.length > 0 || bio) && (
        <div className="px-5 pb-4">
          {bio && (
            <div className="mb-3">
              <p className={`text-sm text-muted-foreground leading-relaxed ${!showFullBio ? "line-clamp-2" : ""}`}>
                {longBio || bio}
              </p>
              {(longBio || bio).length > 100 && (
                <button onClick={() => setShowFullBio(!showFullBio)} className="text-xs text-primary font-semibold mt-1.5 flex items-center gap-1">
                  {showFullBio ? "Less" : "More"}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showFullBio ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
          )}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {specialties.slice(0, 6).map((s) => (
                <Badge key={s} className="px-3 py-1.5 text-[10px] rounded-full bg-brand-gradient-soft text-primary border-0 font-semibold">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ NEXT AVAILABLE SLOT ═══════ */}
      {nextSlot && (
        <div className="px-5 pb-4">
          <button
            onClick={() => setBookingOpen(true)}
            className="w-full bg-brand-gradient rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform text-left shadow-brand-sm text-white"
          >
            <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-white/80">Next Available</p>
              <p className="font-heading text-sm font-bold text-white">
                {format(nextSlot.date, "EEEE, MMM d")} · {nextSlot.label}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/70 flex-shrink-0" />
          </button>
          {totalSessions > 0 && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              <span className="font-bold text-foreground">{totalSessions}</span> sessions completed
            </p>
          )}
        </div>
      )}

      {/* ═══════ PACKAGES ═══════ */}
      <CoachPackagesSection
        coachId={coachProfileId}
        coachName={name}
        onBookWithPackage={() => setBookingOpen(true)}
      />

      {/* ═══════ STORE PREVIEW ═══════ */}
      <StorePreviewStrip
        products={storeProducts}
        coachName={name}
        onViewAll={() => setActiveTab("store")}
      />

      {/* ═══════ VIDEO SHOWCASE ═══════ */}
      <VideoShowcase
        videos={contentFeed}
        onPlay={(url) => { setPlayingMediaUrl(url); setPlayingMediaIsVideo(true); }}
      />

      {/* ═══════ CONTENT TABS (STICKY) ═══════ */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/10">
        <div className="flex px-5 gap-0 py-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-all ${
                validActiveTab === t.key ? "text-foreground" : "text-muted-foreground/60"
              }`}
            >
              <t.icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
              {t.count !== null && t.count > 0 && (
                <span className="absolute top-2 right-[calc(50%-16px)] text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold min-w-[16px] text-center leading-none">
                  {t.count}
                </span>
              )}
              {validActiveTab === t.key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[3px] rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ CLIPS TAB ═══════ */}
      {validActiveTab === "clips" && (
        <div className="px-4 pt-4 pb-6 animate-fade-in">
          {clips.length === 0 ? (
            <div className="text-center py-16">
              <Video className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No clips yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Video content will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {clips.map((clip) => (
                <ClipThumb key={clip.id} item={clip} onPlay={(url) => { setPlayingMediaUrl(url); setPlayingMediaIsVideo(true); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ POSTS TAB ═══════ */}
      {validActiveTab === "posts" && (
        <div className="px-4 pt-4 pb-6 animate-fade-in">
          {(posts.length === 0 && contentFeed.length === 0) ? (
            <div className="text-center py-16">
              <Image className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No posts yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Photos and content will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {(posts.length > 0 ? posts : contentFeed).map((item) => (
                <PostThumb key={item.id} item={item} onPlay={(url) => { setPlayingMediaUrl(url); setPlayingMediaIsVideo(false); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ COMMUNITY TAB ═══════ */}
      {validActiveTab === "community" && (
        <div className="px-5 pt-4 pb-6 animate-fade-in">
          {dbProfile && (
            <Link
              to={`/community/${dbProfile.id}`}
              className="w-full mb-4 h-12 rounded-2xl bg-brand-gradient-soft border border-primary/15 text-sm font-bold text-primary flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
            >
              <Users className="h-4 w-4" />
              View Full Community
            </Link>
          )}
          <CoachCommunity coachId={id!} coachName={name} />
        </div>
      )}

      {/* ═══════ REVIEWS TAB ═══════ */}
      {validActiveTab === "reviews" && (
        <div className="px-5 pt-4 pb-6 animate-fade-in">
          <div className="bg-card rounded-2xl border border-border/10 p-5 mb-5">
            <div className="flex items-start gap-5">
              <div className="text-center flex-shrink-0">
                <p className="font-heading text-4xl font-bold text-foreground leading-none">{avgRating}</p>
                <div className="flex items-center gap-0.5 mt-1.5 justify-center">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`h-3 w-3 ${j < Math.round(Number(avgRating)) ? "text-accent fill-accent" : "text-border"}`} />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{allReviews.length} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <RatingBar key={stars} stars={stars} count={ratingBreakdown[stars - 1]} total={allReviews.length} />
                ))}
              </div>
            </div>
          </div>

          {allReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No reviews yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Be the first to review this coach</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allReviews.map((review, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/10 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-brand-gradient-soft flex items-center justify-center text-xs font-bold text-primary">
                      {review.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{review.name}</p>
                      <p className="text-[10px] text-muted-foreground">{review.date}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "text-accent fill-accent" : "text-border"}`} />
                      ))}
                    </div>
                  </div>
                  {review.text && (
                    <p className="text-[13px] text-muted-foreground leading-relaxed pl-[52px]">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ STORE TAB ═══════ */}
      {validActiveTab === "store" && (
        <CoachStore products={storeProducts} coachName={name} coachId={id!} />
      )}

      {/* ═══════ DYNAMIC SECTIONS ═══════ */}
      <div className="px-5 pt-2 pb-6 space-y-4">
        {(hasCustomLayout
          ? belowTabSections.map((s) => s.section_type)
          : ["about", "schedule"]
        ).map((sectionType) => {
          if (sectionType === "about") return (
            <div key="about" className="space-y-4 animate-fade-in">
              <div className="bg-card rounded-2xl border border-border/10 p-5">
                <h3 className="font-heading text-sm font-bold text-foreground mb-3">About {name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Zap, label: "Sport", value: sport },
                    { icon: MapPin, label: "Location", value: location || "—" },
                    { icon: Clock, label: "Experience", value: `${yearsExperience}+ years` },
                    { icon: Timer, label: "Response", value: responseTime },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                        <f.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                        <p className="text-xs font-semibold text-foreground">{f.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {coachingStyle && (
                <div className="bg-card rounded-2xl border border-border/10 p-5">
                  <h3 className="font-heading text-sm font-bold text-foreground mb-2">Training Style</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{coachingStyle}</p>
                </div>
              )}
              {idealFor && (
                <div className="bg-card rounded-2xl border border-border/10 p-5">
                  <h3 className="font-heading text-sm font-bold text-foreground mb-2">Ideal For</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{idealFor}</p>
                </div>
              )}
              {languages.length > 0 && (
                <div className="bg-card rounded-2xl border border-border/10 p-5">
                  <h3 className="font-heading text-sm font-bold text-foreground mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((l) => (
                      <Badge key={l} className="px-3 py-1.5 text-[11px] rounded-full bg-secondary text-foreground border-0">
                        <Globe className="h-3 w-3 mr-1.5" />{l}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );

          if (sectionType === "achievements" && (certifications.length > 0 || achievements.length > 0)) return (
            <div key="achievements" className="bg-card rounded-2xl border border-border/10 p-5 animate-fade-in">
              <h3 className="font-heading text-sm font-bold text-foreground mb-3">Achievements</h3>
              <div className="space-y-2.5">
                {certifications.map((c, i) => (
                  <div key={`cert-${i}`} className="flex items-center gap-2.5">
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{c}</span>
                  </div>
                ))}
                {achievements.map((a, i) => (
                  <div key={`ach-${i}`} className="flex items-center gap-2.5">
                    <Award className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          );

          if (sectionType === "schedule") return (
            <div key="schedule" className="bg-card rounded-2xl border border-border/10 p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-sm font-bold text-foreground">Schedule</h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-xl font-bold gradient-text">${price}</span>
                  <span className="text-xs text-muted-foreground">/ {sessionDuration}min</span>
                </div>
              </div>
              <BookingCalendar
                coachId={id!}
                coachProfileId={coachProfileId}
                onSlotSelect={(date, time, label) => {
                  setSelectedDate(date);
                  setSelectedTime(time);
                  setBookingOpen(true);
                }}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />
              {coachProfileId && (
                <div className="mt-4">
                  <OpenTrainings
                    coachProfileId={coachProfileId}
                    onJoin={(session) => {
                      setBookingOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          );

          if (sectionType === "exclusive") return (
            <div key="exclusive" className="bg-gradient-to-br from-foreground to-foreground/80 rounded-2xl p-5 text-background animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-background/10 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold">Exclusive Content</h3>
                  <p className="text-[10px] text-background/60">Private training & personalized feedback</p>
                </div>
              </div>
              <p className="text-xs text-background/70 leading-relaxed mb-4">
                Get access to {name}'s premium training library and private Q&A sessions.
              </p>
              <button className="w-full h-11 rounded-xl bg-background text-foreground font-heading font-bold text-sm active:scale-[0.97] transition-all">
                Coming Soon
              </button>
            </div>
          );

          return null;
        })}
      </div>

      {/* ═══════ STICKY BOTTOM BAR ═══════ */}
      <div className="fixed bottom-14 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/10 z-30">
        <div className="flex items-center justify-between gap-3 px-5 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 border border-border/10">
              <img src={image} alt={name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-xs font-bold text-foreground truncate">{name}</p>
              <div className="flex items-center gap-2">
                <span className="font-heading text-base font-bold gradient-text">${price}</span>
                <span className="text-[10px] text-muted-foreground">/{sessionDuration}min</span>
                <span className="flex items-center gap-0.5 text-[10px]">
                  <Star className="h-2.5 w-2.5 text-accent fill-accent" />{avgRating}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setBookingOpen(true)}
            className="h-12 px-7 rounded-2xl font-heading font-bold text-sm bg-brand-gradient text-white shadow-brand-sm active:scale-95 transition-all hover:brightness-110 flex items-center gap-2 flex-shrink-0"
          >
            <Calendar className="h-4 w-4" />
            Book
          </button>
        </div>
      </div>

      {/* ═══════ MODALS ═══════ */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        coachId={id!}
        coachProfileId={coachProfileId}
        coachName={name}
        coachImage={image}
        sport={sport}
        sessionDuration={sessionDuration}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        sessionType="individual"
        price={price}
      />
      {playingMediaUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in-scale" onClick={() => setPlayingMediaUrl(null)}>
          <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10 active:scale-90 transition-all">
            ✕
          </button>
          <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            {playingMediaIsVideo ? (
              <video src={playingMediaUrl} className="w-full rounded-2xl" controls autoPlay />
            ) : (
              <img src={playingMediaUrl} alt="" className="w-full rounded-2xl object-contain max-h-[80vh]" />
            )}
          </div>
        </div>
      )}

      {/* ═══════ PAGE LAB ═══════ */}
      {pageLabOpen && coachProfileId && (
        <PageLab coachId={coachProfileId} onClose={() => { setPageLabOpen(false); reloadSections(); }} />
      )}

      <FollowersModal
        open={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        coachId={id}
        userId={user?.id}
        initialTab={followersModalTab}
      />
    </div>
  );
};

export default CoachProfile;
