import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  MapPin,
  MessageSquare,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
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
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useAvailability } from "@/hooks/use-availability";
import type { Review, ReviewStats, RatingCategory } from "@/hooks/use-coach-reviews";
import { RATING_CATEGORY_LABELS } from "@/hooks/use-coach-reviews";
import { CoachLocationCard } from "@/components/CoachLocationCard";
import CoachFAQ, { type FAQItem } from "@/components/coach-profile/CoachFAQ";
import MediaLightbox, { type LightboxItem } from "@/components/MediaLightbox";
import { supabase } from "@/integrations/supabase/client";
import { BookingModal } from "@/components/BookingModal";
import FollowersModal from "@/components/FollowersModal";
import ShareSheet from "@/components/ShareSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

type Tab = "overview" | "availability" | "reviews";

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

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_LABELS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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

  const [tab, setTab] = useState<Tab>("overview");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [followerAvatars, setFollowerAvatars] = useState<FollowerAvatar[]>([]);
  const [nextSession, setNextSession] = useState<UpcomingSession | null>(null);
  // Availability week / day selection (new design)
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: coach, isLoading } = useCoachPublicProfile(coachId);
  const { reviews, stats } = useCoachReviews(coachId);
  const { videos: allContent } = useCoachVideos(coachId);
  const { following, toggleFollow, loading: followLoading } = useFollow(coachId);
  const { followerCount } = useFollowerCount(coachId);
  const { trackView } = useProfileViewTracker();
  const { trackView: trackRecentlyViewed } = useRecentlyViewed();
  const { slots: availabilitySlots } = useAvailability(coachId || "");

  /* Track view once when the public page opens */
  useEffect(() => {
    if (isPreview || !coachId) return;
    trackView(coachId);
    trackRecentlyViewed(coachId);
  }, [coachId, isPreview, trackView, trackRecentlyViewed]);

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

  /* Load the coach's next upcoming open training */
  useEffect(() => {
    if (!coachId) return;
    let cancelled = false;
    (async () => {
      const todayISO = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("open_trainings")
        .select("date, start_time, title")
        .eq("coach_id", coachId)
        .gte("date", todayISO)
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
  const returnToUrl = coachId ? `/coach/${coachId}` : undefined;

  const handleFollow = () => {
    if (isOwner) { toast.info("This is your own profile"); return; }
    requireAuth(!!user, () => toggleFollow(), returnToUrl);
  };

  const handleBook = () => {
    if (isOwner) { toast.info("You can't book yourself"); return; }
    if (isBooking) return;
    setIsBooking(true);
    requireAuth(!!user, () => setBookingOpen(true), returnToUrl);
    window.setTimeout(() => setIsBooking(false), 450);
  };

  const handleMessage = () => {
    if (!coach?.user_id) return;
    requireAuth(!!user, () => navigate(`/chat/${coach.user_id}`), returnToUrl);
  };

  /* Loading state */
  if (isLoading || !coach) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] pb-24">
        <Skeleton className="h-[480px] w-full rounded-none bg-white/5" />
        <div className="px-6 relative z-10 space-y-4 mt-4">
          <Skeleton className="h-6 w-32 rounded-full bg-white/5" />
          <Skeleton className="h-10 w-64 bg-white/5" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-32 rounded-md bg-white/5" />
            <Skeleton className="h-12 w-20 rounded-full bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  const heroImage = coach.cover_media || coach.image_url || "";
  const sportUpper = (coach.sport || "").toUpperCase();
  const firstName = (coach.coach_name || "").split(" ")[0] || coach.coach_name || "this coach";
  const sessionDuration = coach.session_duration || 60;
  const yearsExp = coach.years_experience || 0;

  const achievementsList = (Array.isArray((coach as { achievements?: string[] | null }).achievements)
    ? (coach as { achievements?: string[] | null }).achievements || []
    : []);
  const certificationsList = (Array.isArray((coach as { certifications?: string[] | null }).certifications)
    ? (coach as { certifications?: string[] | null }).certifications || []
    : []);
  const hasCredentials = achievementsList.length > 0 || certificationsList.length > 0;
  const specialtiesList = coach.specialties && coach.specialties.length > 0 ? coach.specialties : [];
  const languagesList = Array.isArray((coach as { languages?: string[] | null }).languages)
    ? (coach as { languages?: string[] | null }).languages || []
    : [];
  const bioText = coach.bio || "";

  // Moments = latest 4 media items for the Overview grid.
  const moments = feedItems.slice(0, 4);

  // Build the current 7-day strip based on weekOffset (0 = this week, 1 = next)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // Slots for the selected day
  const slotsForSelected = (availabilitySlots || [])
    .filter((s: any) => s.day_of_week === selectedDay.getDay() && s.is_active)
    .map((s: any) => ({
      start: (s.start_time || "").slice(0, 5),
      end: (s.end_time || "").slice(0, 5),
    }))
    .sort((a: { start: string }, b: { start: string }) => a.start.localeCompare(b.start));

  const priceDisplay = coach.price ? `₪${coach.price}` : "";

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pb-32">
      {/* ══════════════════════════════════════════════════════════════
          A) HERO — full-bleed dark editorial
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative h-[500px] w-full overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt={coach.coach_name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#00D4AA]/40 via-[#1a1a2e] to-[#FF6B2C]/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 app-top-nav z-20">
          <div className="flex items-center justify-between px-4 pt-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFollow}
                disabled={followLoading}
                aria-label={following ? "Unsave coach" : "Save coach"}
                aria-pressed={following}
                className={cn(
                  "h-10 w-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-95",
                  following
                    ? "bg-[#46F1C5]/20 border-[#46F1C5]/40 text-[#46F1C5]"
                    : "bg-black/40 border-white/10 text-white hover:bg-black/55"
                )}
              >
                <Heart className={cn("h-4 w-4", following && "fill-current")} />
              </button>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                aria-label="Share profile"
                className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleMessage}
                aria-label="Message coach"
                className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Hero content anchored to bottom */}
        <div className="absolute bottom-0 inset-x-0 px-6 pb-8">
          {/* Sport chip */}
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#46F1C5] text-[#05382C] text-[10px] font-black uppercase tracking-[0.22em] mb-3">
            {sportUpper || "COACH"}
          </span>

          {/* Name + verified */}
          <h1 className="text-[40px] leading-[0.95] font-black text-white tracking-tight flex items-center gap-2">
            {coach.coach_name}
            {coach.is_verified && (
              <span aria-label="Verified coach" className="inline-flex h-6 w-6 rounded-full bg-[#46F1C5] items-center justify-center shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-[#05382C]" strokeWidth={3} />
              </span>
            )}
          </h1>

          {/* Location + follower stack */}
          <div className="mt-2 flex items-center gap-3 text-white/75 text-sm font-medium">
            {coach.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#46F1C5]" />
                {coach.location}
              </span>
            )}
            {followers > 0 && (
              <button
                type="button"
                onClick={() => setFollowersOpen(true)}
                className="inline-flex items-center gap-1.5"
                aria-label={`${fmt(followers)} following`}
              >
                <div className="flex -space-x-1.5">
                  {followerAvatars.slice(0, 3).map((f) => (
                    <div
                      key={f.user_id}
                      className="h-5 w-5 rounded-full border-2 border-[#0B0F1A] overflow-hidden bg-white/10"
                    >
                      {f.avatar_url ? (
                        <img src={f.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#46F1C5]/30 flex items-center justify-center text-[8px] font-black text-[#46F1C5]">
                          {f.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-white/70 font-medium">+{fmt(followers)} following</span>
              </button>
            )}
          </div>

          {/* Stats pills row with floating avatar on the right */}
          <div className="mt-5 relative">
            <div className="flex items-center gap-2 pr-20">
              <div className="flex-shrink-0 h-16 min-w-[68px] px-3 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-[#46F1C5] text-[#46F1C5]" />
                  <span className="text-lg font-black text-white">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
                </div>
                {totalReviews > 0 && (
                  <span className="text-[9px] text-white/60 font-bold">({totalReviews})</span>
                )}
              </div>
              <div className="flex-shrink-0 h-16 px-4 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center">
                <span className="text-base font-black text-white leading-tight">{sessionsCount > 0 ? `${fmt(sessionsCount)}+` : "—"}</span>
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold mt-0.5">sessions</span>
              </div>
              <div className="flex-shrink-0 h-16 px-4 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center">
                <span className="text-base font-black text-white leading-tight">{yearsExp > 0 ? `${yearsExp} yrs` : "—"}</span>
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold mt-0.5">coaching</span>
              </div>
            </div>

            {/* Floating avatar, overlapping the stats row on the right */}
            {coach.image_url && (
              <div className="absolute right-0 -top-2 h-20 w-20 rounded-full p-[2px] bg-gradient-to-br from-[#46F1C5] to-[#FF6B2C] shadow-xl">
                <div className="h-full w-full rounded-full border-2 border-[#0B0F1A] overflow-hidden bg-[#1a1a2e]">
                  <img src={coach.image_url} alt={coach.coach_name} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          B) QUICK FACTS STRIP
         ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x -mx-6 px-6">
          {yearsExp > 0 && (
            <span className="snap-start flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.15em] text-white/85">
              <Clock className="h-3 w-3 text-[#46F1C5]" />
              {yearsExp}+ yrs
            </span>
          )}
          {coach.price && coach.price > 0 && (
            <span className="snap-start flex-shrink-0 inline-flex items-center h-9 px-4 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.15em] text-white/85">
              ₪{coach.price}/session
            </span>
          )}
          <span className="snap-start flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#46F1C5] text-[#05382C] text-[11px] font-black uppercase tracking-[0.22em] shadow-[0_6px_18px_rgba(70,241,197,0.35)]">
            <Zap className="h-3 w-3 fill-[#05382C]" strokeWidth={0} />
            Instant Book
          </span>
          {languagesList.length > 0 && (
            <span className="snap-start flex-shrink-0 inline-flex items-center h-9 px-4 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.15em] text-white/85">
              {languagesList.slice(0, 2).join(" · ")}
            </span>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          C) PRIMARY BOOK CTA CARD
         ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 mt-5">
        <div className="relative rounded-2xl overflow-hidden bg-[#131827] border border-white/5 p-5">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#46F1C5]/15 blur-3xl pointer-events-none" />
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#FFB59A]">Book a session</span>
          <h2 className="mt-1 text-2xl font-black text-white tracking-tight">Train with {firstName}</h2>
          <p className="mt-1 text-xs text-white/60 font-medium">
            {sessionDuration} min{coach.price ? ` · ${priceDisplay} private session` : ""}
          </p>
          <button
            type="button"
            onClick={handleBook}
            disabled={isBooking}
            aria-busy={isBooking}
            aria-label={`Book a session with ${coach.coach_name}`}
            className="mt-4 w-full h-12 rounded-xl bg-gradient-to-r from-[#FF8A3D] via-[#FF6B2C] to-[#E55A1C] text-white text-[12px] font-black uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(255,107,44,0.4)] active:scale-[0.98] transition-transform disabled:opacity-75"
          >
            {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            View Schedule
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          D) STICKY 3-TAB NAV
         ══════════════════════════════════════════════════════════════ */}
      <nav
        role="tablist"
        aria-label="Coach profile sections"
        className="sticky top-0 z-30 bg-[#0B0F1A]/95 backdrop-blur-md px-6 mt-6 py-4 flex items-center gap-8 border-b border-white/10"
      >
        {(["overview", "availability", "reviews"] as Tab[]).map((t) => {
          const active = tab === t;
          const label = t === "overview" ? "Overview" : t === "availability" ? "Availability" : `Reviews${totalReviews ? ` (${totalReviews})` : ""}`;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={cn(
                "relative text-[11px] font-black uppercase tracking-[0.25em] pb-2 transition-colors",
                active ? "text-[#46F1C5]" : "text-white/50 hover:text-white/80"
              )}
            >
              {label}
              {active && (
                <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#46F1C5]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          E) TAB CONTENT
         ══════════════════════════════════════════════════════════════ */}
      <div className="px-6 mt-6 space-y-8">
        {tab === "overview" && (
          <section className="space-y-7">
            {/* Quote / tagline */}
            {coach.tagline && (
              <blockquote className="text-[19px] font-bold italic leading-[1.3] text-white">
                &ldquo;{coach.tagline}&rdquo;
              </blockquote>
            )}

            {/* Bio with Read more */}
            {bioText && (
              <div>
                <p
                  className={cn(
                    "text-[14px] text-white/70 leading-relaxed whitespace-pre-wrap transition-all",
                    !bioExpanded && bioText.length > 240 && "line-clamp-4"
                  )}
                >
                  {bioText}
                </p>
                {bioText.length > 240 && (
                  <button
                    type="button"
                    onClick={() => setBioExpanded((v) => !v)}
                    aria-expanded={bioExpanded}
                    className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#46F1C5]"
                  >
                    {bioExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            {/* Specialties */}
            {specialtiesList.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50 mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {specialtiesList.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-md bg-[#46F1C5]/12 border border-[#46F1C5]/25 text-[#46F1C5] text-[11px] font-bold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Moments grid */}
            {moments.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50 mb-3">Moments</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {moments.map((m: { id: string; media_url: string; thumbnail_url?: string | null; media_type?: string | null; title?: string | null }, i: number) => {
                    const isVideo = m.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(m.media_url || "");
                    const thumb = m.thumbnail_url || m.media_url;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        aria-label={m.title ? `Open ${m.title}` : "Open media"}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5 active:scale-[0.98] transition-transform"
                      >
                        {isVideo ? (
                          <>
                            <video src={m.media_url} className="absolute inset-0 w-full h-full object-cover" muted playsInline preload="metadata" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/15">
                                <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <img src={thumb} alt={m.title || ""} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Highlight (open training) — kept from existing data */}
            {nextSession && (
              <div className="rounded-2xl bg-[#131827] border border-white/5 p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FFB59A]">Next Highlight</span>
                    <h4 className="mt-1 text-lg font-bold text-white truncate">{nextSession.title}</h4>
                    <p className="mt-1 text-xs text-white/60">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {nextSession.start_time?.slice(0, 5) || "TBD"}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 ml-3">
                    <span className="text-[9px] font-black uppercase text-[#46F1C5]">
                      {new Date(nextSession.date + "T00:00:00").toLocaleString("default", { month: "short" })}
                    </span>
                    <span className="text-xl font-black text-white">
                      {new Date(nextSession.date + "T00:00:00").getDate()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "availability" && (
          <section>
            {/* Week strip with prev/next */}
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w - 1)}
                aria-label="Previous week"
                className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1 grid grid-cols-7 gap-1.5">
                {weekDays.map((d) => {
                  const isSelected = d.toDateString() === selectedDay.toDateString();
                  const isToday = d.toDateString() === today.toDateString();
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => setSelectedDay(new Date(d))}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl h-14 transition-colors",
                        isSelected
                          ? "bg-gradient-to-br from-[#46F1C5] to-[#FF6B2C] text-[#05382C] shadow-[0_6px_18px_rgba(70,241,197,0.3)]"
                          : "bg-white/5 border border-white/10 text-white/70 hover:text-white"
                      )}
                    >
                      <span className={cn("text-[9px] font-black uppercase tracking-[0.15em]", isSelected ? "text-[#05382C]" : "text-white/60")}>
                        {DAY_LABELS[d.getDay()]}
                      </span>
                      <span className={cn("text-base font-black", isSelected ? "text-[#05382C]" : "text-white")}>
                        {d.getDate()}
                      </span>
                      {isToday && !isSelected && (
                        <span className="mt-0.5 h-1 w-1 rounded-full bg-[#46F1C5]" />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w + 1)}
                aria-label="Next week"
                className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Selected day label */}
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-3">
              {selectedDay.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase()}, {MONTH_LABELS[selectedDay.getMonth()]} {selectedDay.getDate()}
            </h3>

            {/* Slot grid */}
            {slotsForSelected.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {slotsForSelected.map((s: { start: string; end: string }, i: number) => (
                  <button
                    key={`${s.start}-${i}`}
                    type="button"
                    onClick={handleBook}
                    disabled={isBooking}
                    aria-label={`Book ${s.start} slot`}
                    className="flex items-center justify-between h-16 px-4 rounded-xl bg-[#131827] border border-white/8 active:scale-[0.98] transition-transform hover:border-[#46F1C5]/40 disabled:opacity-60"
                  >
                    <span className="text-lg font-black text-white">{s.start}</span>
                    {coach.price && coach.price > 0 && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#05382C] bg-[#46F1C5] rounded-md px-2 py-1">
                        {priceDisplay}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-[#131827] border border-white/5 p-6 text-center">
                <Calendar className="h-8 w-8 text-white/30 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">No slots this day</p>
                <p className="text-xs text-white/50 mt-1">Try another day or next week.</p>
              </div>
            )}
          </section>
        )}

        {tab === "reviews" && (
          <DarkReviews coachName={coach.coach_name} reviews={reviews} stats={stats} />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          F) EXPERIENCE & CREDENTIALS (always visible under tabs)
         ══════════════════════════════════════════════════════════════ */}
      {hasCredentials && (
        <section className="px-6 mt-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50 mb-4">
            Experience &amp; Credentials
          </h3>
          <div className="space-y-3">
            {achievementsList.map((a, i) => (
              <div key={`a-${i}`} className="flex items-start gap-3 rounded-xl bg-[#131827] border border-white/5 p-4">
                <div className="h-10 w-10 rounded-lg bg-[#FFB59A]/15 flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-5 w-5 text-[#FFB59A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{a}</p>
                </div>
              </div>
            ))}
            {certificationsList.map((c, i) => (
              <div key={`c-${i}`} className="flex items-start gap-3 rounded-xl bg-[#131827] border border-white/5 p-4">
                <div className="h-10 w-10 rounded-lg bg-[#46F1C5]/15 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-[#46F1C5]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{c}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          G) LOCATION MAP CARD
         ══════════════════════════════════════════════════════════════ */}
      {coach.location && (
        <section className="px-6 mt-8">
          <div className="rounded-2xl overflow-hidden border border-white/5 bg-[#131827]">
            <CoachLocationCard coachId={coach.id} className="border-0 bg-transparent text-white" />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          H) FAQ
         ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 mt-8">
        <CoachFAQ items={(coach as { faqs?: FAQItem[] | null }).faqs} />
      </section>

      {/* ══════════════════════════════════════════════════════════════
          I) YOU MIGHT ALSO LIKE — dark variant inline
         ══════════════════════════════════════════════════════════════ */}
      <section className="mt-10 px-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50 mb-4">
          You might also like
        </h3>
        <DarkSimilarCoaches currentCoachId={coach.id} sport={coach.sport} />
      </section>

      {/* ══════════════════════════════════════════════════════════════
          Bottom padding so content clears the sticky CTA
         ══════════════════════════════════════════════════════════════ */}
      <div className="h-4" />

      {/* ══════════════════════════════════════════════════════════════
          J) STICKY BOTTOM BOOK CTA
         ══════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-[72px] inset-x-0 z-40 px-4 pointer-events-none app-bottom-nav">
        <button
          type="button"
          onClick={handleBook}
          disabled={isBooking}
          aria-busy={isBooking}
          aria-label={`Book a session with ${coach.coach_name}${priceDisplay ? ` for ${priceDisplay}` : ""}`}
          className="pointer-events-auto w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF8A3D] via-[#FF6B2C] to-[#E55A1C] text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_18px_40px_rgba(255,107,44,0.5)] inline-flex items-center justify-between px-5 disabled:opacity-75 active:scale-[0.98] transition-transform"
        >
          <span className="inline-flex items-center gap-2">
            {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            Book a session
          </span>
          {priceDisplay && <span className="text-base">{priceDisplay}</span>}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Media lightbox
         ══════════════════════════════════════════════════════════════ */}
      <MediaLightbox
        items={feedItems.map(
          (v: { id: string; media_url: string; title?: string | null; media_type?: string | null }): LightboxItem => ({
            id: v.id,
            src: v.media_url,
            type: v.media_type === "image" ? "image" : "video",
            caption: v.title ?? undefined,
          })
        )}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(n) => setLightboxIndex(n)}
      />

      {/* ══════════════════════════════════════════════════════════════
          Modals
         ══════════════════════════════════════════════════════════════ */}
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
          sessionDuration={sessionDuration}
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

/* ─────────────────────────────────────────────────────────────────
   DarkReviews — dark-themed reviews section scoped to the public
   coach profile. Uses the same data shape as `useCoachReviews` but
   styled for the dark editorial design.
   ───────────────────────────────────────────────────────────────── */

function DarkStars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i < Math.round(value) ? "text-[#46F1C5] fill-[#46F1C5]" : "text-white/20"}
        />
      ))}
    </div>
  );
}

function DarkReviews({
  coachName,
  reviews,
  stats,
}: {
  coachName: string;
  reviews: Review[];
  stats: ReviewStats;
}) {
  const [visible, setVisible] = useState(5);
  const shown = reviews.slice(0, visible);
  const canShowMore = visible < reviews.length;

  return (
    <section className="space-y-5">
      {/* Summary card */}
      <div className="rounded-2xl bg-[#131827] border border-white/5 p-5">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="text-5xl font-black text-white leading-none">
              {stats.average > 0 ? stats.average.toFixed(1) : "—"}
            </div>
            <div className="mt-2">
              <DarkStars value={stats.average} size={14} />
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            {(Object.keys(RATING_CATEGORY_LABELS) as RatingCategory[]).map((c) => {
              const v = stats.categoryAverages[c];
              const pct = Math.max(0, Math.min(100, (v / 5) * 100));
              return (
                <div key={c} className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60 w-24 truncate">
                    {RATING_CATEGORY_LABELS[c].split(" ")[0]}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#46F1C5] to-[#FF6B2C] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-black text-white w-7 text-right">
                    {v > 0 ? v.toFixed(1) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review cards */}
      {shown.length === 0 ? (
        <div className="rounded-2xl bg-[#131827] border border-white/5 p-6 text-center">
          <MessageSquare className="h-8 w-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">No reviews yet</p>
          <p className="text-xs text-white/50 mt-1">Be the first to book and review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <article key={r.id} className="rounded-2xl bg-[#131827] border border-white/5 p-4">
              <header className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-[#46F1C5]/15 flex items-center justify-center text-[#46F1C5] text-sm font-black flex-shrink-0 overflow-hidden">
                  {r.reviewer_avatar ? (
                    <img src={r.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (r.reviewer_username || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white truncate">{r.reviewer_username}</p>
                    {r.is_verified_booking && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#46F1C5]/15 text-[#46F1C5] text-[9px] font-black uppercase tracking-wider">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Verified Booking
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50 mt-0.5">{timeAgo(r.created_at)}</p>
                </div>
              </header>

              {r.comment && (
                <p className="mt-3 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                  {r.comment}
                </p>
              )}

              {r.photos && r.photos.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
                  {r.photos.slice(0, 4).map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt="Review photo"
                      className="h-20 w-20 rounded-lg object-cover border border-white/10 flex-shrink-0"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}

              {r.coach_response && (
                <aside className="mt-3 ml-2 pl-3 border-l-2 border-[#46F1C5]/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#46F1C5] mb-1">
                    {coachName.toUpperCase()}&apos;S RESPONSE
                  </p>
                  <p className="text-sm text-white/70 leading-relaxed">{r.coach_response}</p>
                </aside>
              )}
            </article>
          ))}
        </div>
      )}

      {canShowMore && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + 5)}
          className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-white/70"
        >
          Show more
        </button>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DarkSimilarCoaches — a dark-themed variant of the similar-coaches
   rail. Fetches directly so we don't fight theme tokens from the
   shared SimilarCoaches component.
   ───────────────────────────────────────────────────────────────── */

interface SimilarRow {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  rating: number | null;
  price: number | null;
  location: string | null;
  is_verified: boolean | null;
}

function DarkSimilarCoaches({ currentCoachId, sport }: { currentCoachId?: string; sport?: string }) {
  const [items, setItems] = useState<SimilarRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let query = supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, rating, price, location, is_verified")
        .order("rating", { ascending: false })
        .limit(7);
      if (sport) query = query.eq("sport", sport);
      const { data } = await query;
      if (cancelled) return;
      const filtered = (data || []).filter((c: SimilarRow) => c.id !== currentCoachId).slice(0, 6);
      setItems(filtered);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sport, currentCoachId]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {loading
        ? Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
          ))
        : items.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              to={`/coach/${c.id}`}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 active:scale-[0.98] transition-transform"
            >
              {c.image_url ? (
                <img src={c.image_url} alt={c.coach_name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#46F1C5]/30 to-[#FF6B2C]/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3">
                <p className="text-white font-black text-[14px] truncate">{c.coach_name}</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">{c.sport}</span>
                  {c.rating != null && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-white/80 font-bold">
                      <Star className="h-2.5 w-2.5 fill-[#46F1C5] text-[#46F1C5]" />
                      {c.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
    </div>
  );
}
