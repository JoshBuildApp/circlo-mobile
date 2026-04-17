import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Bell,
  Bookmark,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Edit3,
  Eye,
  Flame,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  LogOut,
  MapPin,
  MessageSquare,
  Play,
  Plus,
  Search,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  User,
  UserPlus,
  Users,
  Video,
  Zap,
  Shield,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageSection, SECTION_OPTIONS, usePageSections } from "@/hooks/use-page-sections";
import { useFollowerCount } from "@/hooks/use-follower-counts";
import { useBookingRequests, BookingRequest } from "@/hooks/use-booking-requests";
import { useSavedItems } from "@/hooks/use-saved-items";
import { useTraineeProgress } from "@/hooks/use-trainee-progress";
import FollowersModal from "@/components/FollowersModal";
import TraineeProgressCard from "@/components/TraineeProgressCard";
import TraineeProgressDashboard from "@/components/TraineeProgressDashboard";
import CoachCommunity from "@/components/CoachCommunity";
import PageLab from "@/components/PageLab";
import ShareSheet from "@/components/ShareSheet";
import ProfileStatsAndAchievements from "@/components/profile/ProfileStatsAndAchievements";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface CoachProfileData {
  id: string;
  coach_name: string;
  sport: string;
  tagline: string | null;
  bio: string | null;
  image_url: string | null;
  cover_media: string | null;
  location: string | null;
  price: number | null;
  rating: number | null;
  followers: number | null;
  total_sessions: number | null;
  years_experience: number | null;
  is_verified: boolean;
  specialties: string[] | null;
}

interface CoachContent {
  id: string;
  title: string;
  media_url: string;
  thumbnail_url: string | null;
  media_type: string;
  likes_count: number;
  views: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user_name: string | null;
}

interface FollowedCoach {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  price: number | null;
  rating: number | null;
  is_verified: boolean;
}

interface SessionHistoryItem {
  id: string;
  coach_name: string;
  date: string;
  time_label: string;
  training_type: string;
  status: string;
  price: number;
}

interface UserChallenge {
  id: string;
  progress: number;
  created_at: string;
  challenge: {
    id: string;
    title: string;
    description: string | null;
    duration_days: number;
  };
}

/* ═══════════════════════════════════════════════════════
   SPORT ICONS & COLORS
   ═══════════════════════════════════════════════════════ */
const SPORT_COLORS: Record<string, string> = {
  padel: "#00D4AA", tennis: "#22C55E", boxing: "#EF4444", yoga: "#A855F7",
  fitness: "#FF6B2C", soccer: "#3B82F6", basketball: "#F97316", swimming: "#06B6D4",
  running: "#EAB308", mma: "#DC2626", crossfit: "#F59E0B", "martial arts": "#991B1B",
};

/* ═══════════════════════════════════════════════════════
   ANIMATION PRESETS
   ═══════════════════════════════════════════════════════ */
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
};

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`
    : n.toString();

const sectionLabel = (type: string) =>
  SECTION_OPTIONS.find((o) => o.type === type)?.label || type;

/* ═══════════════════════════════════════════════════════
   PLAYER TAB TYPE
   ═══════════════════════════════════════════════════════ */
type PlayerTab = "activity" | "bookings" | "saved" | "following";

const PLAYER_TABS: { key: PlayerTab; label: string; icon: React.ElementType }[] = [
  { key: "activity", label: "Activity", icon: Zap },
  { key: "bookings", label: "Bookings", icon: Calendar },
  { key: "saved", label: "Saved", icon: Bookmark },
  { key: "following", label: "Following", icon: Heart },
];

/* ═══════════════════════════════════════════════════════
   HIGHLIGHT CIRCLE (Instagram stories style)
   ═══════════════════════════════════════════════════════ */
const HighlightCircle = ({ label, icon: Icon, color, delay }: { label: string; icon: React.ElementType; color: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.7 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    className="flex flex-col items-center gap-1.5 flex-shrink-0"
  >
    <div
      className="h-16 w-16 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-background"
      style={{ backgroundColor: color + "20", borderColor: color }}
    >
      <Icon className="h-6 w-6" style={{ color }} />
    </div>
    <span className="text-[10px] text-muted-foreground font-medium text-center max-w-[64px] line-clamp-1">{label}</span>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════
   STAT PILL
   ═══════════════════════════════════════════════════════ */
const StatPill = ({ value, label, icon: Icon, onClick, className: extraClass }: { value: string; label: string; icon?: React.ElementType; onClick?: () => void; className?: string }) => {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={cn("flex-1 text-center py-3.5 hover:bg-white/5 transition-colors first:rounded-l-2xl last:rounded-r-2xl", extraClass)}>
      {Icon && <Icon className="h-3.5 w-3.5 text-primary mx-auto mb-1" />}
      <p className="font-heading text-lg font-bold text-foreground leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
    </Comp>
  );
};

/* ═══════════════════════════════════════════════════════
   SECTION CARD
   ═══════════════════════════════════════════════════════ */
const SectionCard = React.forwardRef<
  HTMLElement,
  { icon: React.ElementType; title: string; count?: number; children: React.ReactNode }
>(({ icon: Icon, title, count, children }, ref) => (
  <section ref={ref} className="rounded-2xl border border-border/10 bg-card p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-sm font-bold text-foreground">{title}</h2>
      </div>
      {count !== undefined && (
        <Badge className="rounded-full bg-secondary text-foreground border-0 text-xs">{count}</Badge>
      )}
    </div>
    {children}
  </section>
));
SectionCard.displayName = "SectionCard";

/* ═══════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════ */
const UserProfile = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, role, isDeveloper, activeRole, refreshProfile } = useAuth();
  const [coachProfile, setCoachProfile] = useState<CoachProfileData | null>(null);
  const [coachLoading, setCoachLoading] = useState(true);
  const [pageLabOpen, setPageLabOpen] = useState(false);
  const [content, setContent] = useState<CoachContent[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [shareOpen, setShareOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [bioLoaded, setBioLoaded] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [playerTab, setPlayerTab] = useState<PlayerTab>("activity");
  const [followedCoaches, setFollowedCoaches] = useState<FollowedCoach[]>([]);
  const [followedLoading, setFollowedLoading] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [sessionHistoryLoading, setSessionHistoryLoading] = useState(true);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const isCoach = !!coachProfile;

  // Hooks for player tabs
  const { requests: bookings, loading: bookingsLoading } = useBookingRequests();
  const { savedItems: savedItemsList } = useSavedItems();
  const savedItems = savedItemsList || [];
  const { progress } = useTraineeProgress(user?.id);

  const loadCoachProfile = useCallback(async () => {
    if (!user) { setCoachProfile(null); setCoachLoading(false); return; }
    setCoachLoading(true);
    const { data } = await supabase
      .from("coach_profiles")
      .select("id, coach_name, sport, tagline, bio, image_url, cover_media, location, price, rating, followers, total_sessions, years_experience, is_verified, specialties")
      .eq("user_id", user.id)
      .maybeSingle();
    setCoachProfile((data as CoachProfileData | null) ?? null);
    setCoachLoading(false);
  }, [user]);

  useEffect(() => { loadCoachProfile(); }, [loadCoachProfile]);

  // Load bio for player view
  useEffect(() => {
    if (!user || bioLoaded) return;
    supabase.from("profiles").select("bio").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setBio((data as any)?.bio ?? "");
      setBioLoaded(true);
    });
  }, [user, bioLoaded]);

  // Load followed coaches for player view
  useEffect(() => {
    if (!user) return;
    const loadFollowed = async () => {
      setFollowedLoading(true);
      const { data: follows } = await supabase
        .from("user_follows")
        .select("coach_id")
        .eq("user_id", user.id);
      if (follows && follows.length > 0) {
        setFollowingCount(follows.length);
        const coachIds = follows.map((f: any) => f.coach_id);
        const { data: coaches } = await supabase
          .from("coach_profiles")
          .select("id, coach_name, sport, image_url, price, rating, is_verified")
          .in("id", coachIds);
        setFollowedCoaches((coaches as FollowedCoach[]) || []);
      } else {
        setFollowingCount(0);
        setFollowedCoaches([]);
      }
      setFollowedLoading(false);
    };
    loadFollowed();
  }, [user]);

  // Load session history (completed/cancelled bookings)
  useEffect(() => {
    if (!user) { setSessionHistoryLoading(false); return; }
    const loadHistory = async () => {
      setSessionHistoryLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("id, coach_name, date, time_label, training_type, status, price")
        .eq("user_id", user.id)
        .in("status", ["completed", "cancelled"])
        .order("date", { ascending: false })
        .limit(20);
      if (!error) setSessionHistory((data as SessionHistoryItem[]) || []);
      setSessionHistoryLoading(false);
    };
    loadHistory();
  }, [user]);

  // Load user's challenge participations
  useEffect(() => {
    if (!user) { setChallengesLoading(false); return; }
    const loadChallenges = async () => {
      setChallengesLoading(true);
      const { data, error } = await supabase
        .from("challenge_participants")
        .select("id, progress, created_at, challenge_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error || !data || data.length === 0) {
        setUserChallenges([]);
        setChallengesLoading(false);
        return;
      }
      const challengeIds = [...new Set(data.map((d: any) => d.challenge_id))];
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, title, description, duration_days")
        .in("id", challengeIds);
      const challengeMap = new Map((challenges || []).map((c: any) => [c.id, c]));
      setUserChallenges(
        data
          .map((d: any) => ({
            id: d.id,
            progress: d.progress,
            created_at: d.created_at,
            challenge: challengeMap.get(d.challenge_id),
          }))
          .filter((d: any) => d.challenge) as UserChallenge[]
      );
      setChallengesLoading(false);
    };
    loadChallenges();
  }, [user]);

  // Re-fetch on profile update
  useEffect(() => {
    const handler = () => { loadCoachProfile(); setBioLoaded(false); };
    window.addEventListener("profile-updated", handler);
    const onVisible = () => { if (document.visibilityState === "visible") { loadCoachProfile(); setBioLoaded(false); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.removeEventListener("profile-updated", handler); document.removeEventListener("visibilitychange", onVisible); };
  }, [loadCoachProfile]);

  const { followerCount } = useFollowerCount(coachProfile?.id);
  const { sections, loading: sectionsLoading, hasCustomLayout, loadSections } = usePageSections(coachProfile?.id);

  useEffect(() => {
    if (!coachProfile?.id) { setContent([]); setReviews([]); return; }
    const load = async () => {
      const [{ data: videoRows }, { data: reviewRows }] = await Promise.all([
        supabase.from("coach_videos").select("id, title, description, media_url, thumbnail_url, media_type, likes_count, views, created_at").eq("coach_id", coachProfile.id).order("created_at", { ascending: false }),
        supabase.from("reviews").select("id, rating, comment, user_name").eq("coach_id", coachProfile.id).order("created_at", { ascending: false }),
      ]);
      setContent((videoRows as CoachContent[] | null) ?? []);
      setReviews((reviewRows as Review[] | null) ?? []);
    };
    load();
    // Refresh content when a new post is created via NewContentCreator
    const onUploaded = () => load();
    window.addEventListener("content-uploaded", onUploaded);
    return () => window.removeEventListener("content-uploaded", onUploaded);
  }, [coachProfile?.id]);

  const clips = useMemo(() => content.filter((i) => i.media_type === "video" || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(i.media_url)), [content]);
  const posts = useMemo(() => content.filter((i) => i.media_type !== "video" && !/\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(i.media_url)), [content]);
  const visibleSections = useMemo(() => (hasCustomLayout ? sections.filter((s) => s.is_visible) : []), [hasCustomLayout, sections]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return coachProfile?.rating?.toFixed(1) ?? "5.0";
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews, coachProfile?.rating]);

  // Separate bookings
  const upcomingBookings = useMemo(() => bookings.filter((b) => b.status === "upcoming" || b.status === "confirmed"), [bookings]);
  const pastBookings = useMemo(() => bookings.filter((b) => b.status === "completed" || b.status === "cancelled"), [bookings]);

  // Build player highlights
  const playerHighlights = useMemo(() => {
    const items: { label: string; icon: React.ElementType; color: string }[] = [];
    // Favorite sports from interests
    if (profile?.interests) {
      profile.interests.slice(0, 3).forEach((sport: string) => {
        items.push({ label: sport, icon: Dumbbell, color: SPORT_COLORS[sport.toLowerCase()] || "#00D4AA" });
      });
    }
    // Achievements
    if (progress && progress.level > 1) {
      items.push({ label: `Level ${progress.level}`, icon: Trophy, color: "#F59E0B" });
    }
    if (progress && progress.streak_days > 0) {
      items.push({ label: `${progress.streak_days}d Streak`, icon: Flame, color: "#EF4444" });
    }
    // Recent activity
    if (upcomingBookings.length > 0) {
      items.push({ label: "Upcoming", icon: Calendar, color: "#3B82F6" });
    }
    if (followedCoaches.length > 0) {
      items.push({ label: `${followedCoaches.length} Coaches`, icon: Users, color: "#A855F7" });
    }
    return items;
  }, [profile?.interests, progress, upcomingBookings, followedCoaches]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    // Path must start with the user's UUID folder — the coach-videos bucket
    // has RLS requiring `(storage.foldername(name))[1] = auth.uid()::text`
    // (see 20260414000003_coach_videos_bucket_scope.sql).
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("coach-videos").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Upload failed"); setAvatarUploading(false); return; }
    const { data: urlData } = supabase.storage.from("coach-videos").getPublicUrl(path);
    if (isCoach && coachProfile) {
      const { error: updateError } = await supabase.from("coach_profiles").update({ image_url: urlData.publicUrl }).eq("user_id", user.id);
      if (updateError) { toast.error("Failed to update avatar"); } else { toast.success("Avatar updated"); await loadCoachProfile(); await refreshProfile(); }
    } else {
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
      if (updateError) { toast.error("Failed to update avatar"); } else { toast.success("Avatar updated"); await refreshProfile(); }
    }
    setAvatarUploading(false);
  };

  /* ─── Section renderer (coach only) ─── */
  const renderSection = (section: PageSection) => {
    switch (section.section_type) {
      case "media":
        return (
          <SectionCard icon={Video} title="Media" count={content.length}>
            {content.length === 0 ? (
              <div className="text-center py-8">
                <Video className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No content yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clips.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Clips</p>
                    <div className="grid grid-cols-2 gap-2">
                      {clips.slice(0, 4).map((c) => (
                        <div key={c.id} className="relative overflow-hidden rounded-2xl bg-secondary group">
                          <video src={c.media_url} className="aspect-[3/4] w-full object-cover" muted playsInline preload="metadata" />
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <Play className="h-2.5 w-2.5 text-white fill-white ml-[1px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {posts.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Posts</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {posts.slice(0, 6).map((p) => (
                        <img key={p.id} src={p.thumbnail_url || p.media_url} alt={p.title} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        );
      case "about":
        return (
          <SectionCard icon={Star} title="About">
            <div className="space-y-3 text-sm text-muted-foreground">
              {coachProfile?.bio ? <p className="whitespace-pre-wrap leading-relaxed">{coachProfile.bio}</p> : <p className="italic">No bio yet</p>}
              {coachProfile?.specialties && coachProfile.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {coachProfile.specialties.map((s: string) => (
                    <span key={s} className="px-2.5 py-1 rounded-full text-[11px] bg-primary/10 text-primary font-semibold border border-primary/20">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        );
      case "schedule":
        return (
          <SectionCard icon={CalendarDays} title="Schedule">
            <p className="text-sm text-muted-foreground">Your weekly availability is managed from the coach dashboard → Schedule tab.</p>
          </SectionCard>
        );
      case "packages":
        return null; // Packages render in their own section elsewhere
      case "store":
        return null; // Store render in its own section elsewhere
      case "clips":
        return (
          <SectionCard icon={Video} title="Clips" count={clips.length}>
            {clips.length === 0 ? (
              <div className="text-center py-8"><Video className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No videos yet</p></div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {clips.slice(0, section.layout_size === "half" ? 2 : 4).map((c) => (
                  <div key={c.id} className="relative overflow-hidden rounded-2xl bg-secondary group">
                    <video src={c.media_url} className="aspect-[3/4] w-full object-cover" muted playsInline preload="metadata" />
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Play className="h-2.5 w-2.5 text-white fill-white ml-[1px]" />
                    </div>
                    {c.views !== null && c.views > 0 && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white/80"><Eye className="h-3 w-3" />{fmt(c.views)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        );
      case "posts":
        return (
          <SectionCard icon={ImageIcon} title="Posts" count={posts.length}>
            {posts.length === 0 ? (
              <div className="text-center py-8"><ImageIcon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No posts yet</p></div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {posts.slice(0, section.layout_size === "half" ? 3 : 6).map((p) => (
                  <img key={p.id} src={p.thumbnail_url || p.media_url} alt={p.title} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
                ))}
              </div>
            )}
          </SectionCard>
        );
      case "community":
        return <SectionCard icon={Users} title="Community"><CoachCommunity coachId={coachProfile!.id} coachName={coachProfile!.coach_name} /></SectionCard>;
      case "reviews":
        return (
          <SectionCard icon={Star} title="Reviews" count={reviews.length}>
            {reviews.length === 0 ? (
              <div className="text-center py-8"><Star className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No reviews yet</p></div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, section.layout_size === "half" ? 2 : 3).map((r) => (
                  <div key={r.id} className="rounded-2xl bg-secondary/40 p-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{r.user_name || "Member"}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`h-3 w-3 ${j < r.rating ? "text-accent fill-accent" : "text-border"}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        );
      case "progress":
        return <SectionCard icon={Trophy} title="Training Progress"><TraineeProgressDashboard userId={user?.id} /></SectionCard>;
      default:
        return <SectionCard icon={LayoutGrid} title={sectionLabel(section.section_type)}><p className="text-sm text-muted-foreground">Part of your saved Page Lab layout.</p></SectionCard>;
    }
  };

  /* ─── Loading ─── */
  if (loading || coachLoading) {
    return (
      <div className="h-full overflow-y-auto bg-background pb-24">
        <div className="h-52 bg-white/5 animate-pulse" />
        <div className="px-5 -mt-16 relative z-10">
          <div className="flex items-end gap-4">
            <Skeleton className="h-28 w-28 rounded-full flex-shrink-0" />
            <div className="flex-1 pb-1 space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="px-5 mt-5 space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ─── Not logged in ─── */
  if (!user || !profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6 bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <User className="h-10 w-10 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Log in to see your profile.</p>
          <Link to="/login" className="px-8 py-3 rounded-full bg-gradient-to-r from-primary to-[#00B894] text-white font-heading font-bold text-sm inline-block">Log in</Link>
        </motion.div>
      </div>
    );
  }

  /* ─── Dev user in admin mode → redirect ─── */
  if (isDeveloper && activeRole === "admin") {
    navigate("/admin", { replace: true });
    return null;
  }

  /* ═══════════════════════════════════════════════════════
     UNIFIED PROFILE
     ═══════════════════════════════════════════════════════ */
  const displayName = isCoach ? coachProfile!.coach_name : profile.username;
  const avatarUrl = isCoach ? coachProfile!.image_url : profile.avatar_url;
  const initial = displayName?.charAt(0)?.toUpperCase() ?? "?";
  const coverUrl = isCoach ? (coachProfile!.cover_media || coachProfile!.image_url) : profile.avatar_url;
  const followersCount = isCoach ? (followerCount > 0 ? followerCount : (coachProfile!.followers ?? 0)) : 0;
  const sessionsCount = isCoach ? (coachProfile!.total_sessions ?? 0) : 0;
  const price = isCoach ? (coachProfile!.price ?? 50) : 0;

  return (
    <div className="h-full overflow-y-auto bg-background pb-24">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      {/* ═══════ COVER BANNER — Full-width with gradient overlay ═══════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-52 overflow-hidden"
      >
        {coverUrl ? (
          <img
            src={isCoach && coachProfile!.cover_media ? coachProfile!.cover_media : coverUrl}
            alt="Cover"
            className={cn(
              "w-full h-full object-cover",
              !isCoach || !coachProfile!.cover_media ? "blur-2xl scale-125 opacity-60" : ""
            )}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-[#0F3460] to-background" />
        )}
        {/* Premium gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />

        {/* Top right actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-3 right-4 flex items-center gap-2 z-10"
        >
          <button onClick={() => setShareOpen(true)} className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-transform">
            <Share2 className="h-4 w-4" />
          </button>
          <button onClick={signOut} className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-transform">
            <LogOut className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>

      {/* ═══════ PROFILE IDENTITY — Large avatar with sport ring ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="px-5 -mt-16 relative z-10"
      >
        <div className="flex items-end gap-4">
          {/* Avatar with sport badges ring */}
          <button onClick={() => fileRef.current?.click()} className="relative flex-shrink-0 group">
            <div
              className={cn(
                "p-[3px] rounded-full",
                !isCoach && profile.interests?.length
                  ? "ring-2 ring-primary/40"
                  : isCoach ? "ring-2 ring-primary/40" : ""
              )}
              style={!isCoach && profile.interests?.length ? {
                background: `linear-gradient(135deg, ${SPORT_COLORS[profile.interests[0]?.toLowerCase()] || "#00D4AA"}, #00D4AA88)`
              } : isCoach ? {
                background: `linear-gradient(135deg, #00D4AA, #00D4AA88)`
              } : undefined}
            >
              <div className="h-28 w-28 rounded-full border-[3px] border-background overflow-hidden bg-secondary">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                ) : null}
                <div className={cn("h-full w-full flex items-center justify-center text-primary font-heading text-3xl font-bold bg-primary/10", avatarUrl ? 'hidden' : '')}>{initial}</div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {isCoach && coachProfile!.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                <div className="rounded-full bg-primary p-1 shadow-lg">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
          </button>

          {/* Name + role + bio */}
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="font-heading text-2xl font-bold text-foreground truncate leading-tight">{displayName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {isCoach ? (
                <>
                  <Badge className="text-[10px] bg-primary/10 text-primary border-0 rounded-full px-2 py-0.5">{coachProfile!.sport}</Badge>
                  {coachProfile!.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{coachProfile!.location}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">@{profile.username || "athlete"}</span>
                  {(profile as any).location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{(profile as any).location}
                    </span>
                  )}
                </>
              )}
            </div>
            {isCoach && coachProfile!.tagline && (
              <p className="text-[13px] text-foreground/70 mt-1 line-clamp-1">{coachProfile!.tagline}</p>
            )}
          </div>
        </div>

        {/* Rating row (coach) */}
        {isCoach && (
          <div className="flex items-center gap-3 mt-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Star className="h-3.5 w-3.5 text-accent fill-accent" />
              {avgRating}
              <span className="text-muted-foreground font-normal">({reviews.length})</span>
            </span>
            {coachProfile!.years_experience && coachProfile!.years_experience > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{coachProfile!.years_experience}yr exp</span>
              </>
            )}
          </div>
        )}

        {/* Bio */}
        {(isCoach ? coachProfile!.bio : bio) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground leading-relaxed mt-3 line-clamp-3"
          >
            {isCoach ? coachProfile!.bio : bio}
          </motion.p>
        )}

        {/* Specialties (coach) / Interests (player) */}
        {isCoach && coachProfile!.specialties && coachProfile!.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {coachProfile!.specialties.slice(0, 5).map((s) => (
              <Badge key={s} className="px-2.5 py-1 text-[10px] rounded-full bg-secondary text-foreground border-0 font-medium">{s}</Badge>
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══════ STATS BAR ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mt-5"
      >
        <div className="bg-card border border-border/10 rounded-2xl flex divide-x divide-border/10">
          {isCoach ? (
            <>
              <StatPill value={fmt(followersCount)} label="Followers" icon={Users} onClick={() => { setFollowersModalTab("followers"); setFollowersModalOpen(true); }} />
              <StatPill value={fmt(sessionsCount)} label="Sessions" icon={Calendar} />
              <StatPill value={fmt(reviews.length)} label="Reviews" icon={Star} />
              <StatPill value={`₪${price}`} label="Per session" icon={Zap} />
            </>
          ) : (
            <>
              <StatPill value={fmt(bookings.length)} label="Sessions" icon={Calendar} />
              <StatPill value={fmt(followingCount)} label="Following" icon={Heart} onClick={() => { setFollowersModalTab("following"); setFollowersModalOpen(true); }} />
              <StatPill value={fmt(progress?.xp ?? 0)} label="XP" icon={Zap} className={(progress?.xp ?? 0) > 0 ? "bg-primary/[0.06]" : undefined} />
              <StatPill value={`Lv${progress?.level ?? 1}`} label="Level" icon={Trophy} />
            </>
          )}
        </div>
      </motion.div>

      {/* ═══════ PLAYER: HIGHLIGHTS ROW (Instagram-style) ═══════ */}
      {!isCoach && playerHighlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-5 mt-5"
        >
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
            {playerHighlights.map((h, i) => (
              <HighlightCircle key={h.label} label={h.label} icon={h.icon} color={h.color} delay={0.3 + i * 0.06} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════ ACTION BUTTONS ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="px-5 mt-4 flex gap-2"
      >
        <button
          onClick={() => navigate("/edit-profile")}
          className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary to-[#00B894] text-white font-heading font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
        >
          <Edit3 className="h-4 w-4" />
          Edit Profile
        </button>
        {isCoach && (
          <>
            <Link
              to="/coach-dashboard"
              className="h-12 px-5 rounded-2xl bg-foreground text-background font-heading font-bold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to={`/coach/${coachProfile!.id}`}
              className="h-12 w-12 rounded-2xl bg-secondary border border-border/20 flex items-center justify-center text-foreground active:scale-95 transition-all flex-shrink-0"
            >
              <Eye className="h-5 w-5" />
            </Link>
          </>
        )}
        {!isCoach && (
          <button
            onClick={() => setShareOpen(true)}
            className="h-12 px-5 rounded-2xl bg-secondary border border-border/20 font-heading font-bold text-sm text-foreground active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        )}
      </motion.div>

      {/* ═══════ PREVIEW PUBLIC PROFILE ═══════ */}
      {isCoach && coachProfile && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-5 mt-2"
        >
          <Link
            to={`/coach/${coachProfile.id}`}
            className="w-full h-11 rounded-2xl bg-secondary border border-border/20 font-heading font-bold text-sm text-muted-foreground hover:text-foreground active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Public Profile
          </Link>
        </motion.div>
      )}

      {/* ═══════ HUB: QUICK ACCESS ═══════ */}
      {!isCoach && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-5 mt-5"
        >
          <div className="grid grid-cols-2 gap-3">
            <Link to="/discover" className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 active:scale-[0.97] transition-all">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Find Coach</p>
                <p className="text-[11px] text-muted-foreground">Browse & book</p>
              </div>
            </Link>
            <Link to="/schedule" className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/10 active:scale-[0.97] transition-all">
              <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Schedule</p>
                <p className="text-[11px] text-muted-foreground">{upcomingBookings.length} upcoming</p>
              </div>
            </Link>
            <Link to="/inbox" className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30 border border-border/10 active:scale-[0.97] transition-all">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Messages</p>
                <p className="text-[11px] text-muted-foreground">Inbox</p>
              </div>
            </Link>
            <Link to="/community" className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30 border border-border/10 active:scale-[0.97] transition-all">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Users className="h-5 w-5 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Community</p>
                <p className="text-[11px] text-muted-foreground">Groups & challenges</p>
              </div>
            </Link>
          </div>
        </motion.div>
      )}

      {/* ═══════ STATS ENGINE + ACHIEVEMENTS (NEW) ═══════ */}
      <div className="mt-4">
        {isCoach ? (
          <ProfileStatsAndAchievements
            rating={coachProfile?.rating ?? 0}
            totalSessions={coachProfile?.total_sessions ?? sessionsCount}
            yearsExperience={coachProfile?.years_experience ?? 0}
            followers={followersCount}
            achievements={(coachProfile as any)?.achievements ?? []}
            isPro={(coachProfile as any)?.is_pro ?? false}
          />
        ) : (
          <ProfileStatsAndAchievements
            variant="user"
            sessionsBooked={bookings?.length ?? 0}
            trainingStreak={(progress as any)?.streak_days ?? 0}
            xp={(progress as any)?.xp ?? 0}
            level={(progress as any)?.level ?? 1}
            achievements={[]}
            isPro={false}
          />
        )}
      </div>

      {/* ═══════ COACH: QUICK INSIGHTS ═══════ */}
      {isCoach && (sessionsCount > 0 || followersCount > 0) && (
        <div className="px-5 mt-3">
          <button
            onClick={() => navigate("/coach-dashboard?tab=stats")}
            className="w-full bg-gradient-to-r from-primary to-accent rounded-2xl p-4 flex items-center gap-3 text-white shadow-sm active:scale-[0.97] transition-all text-left"
          >
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Insights</p>
              <p className="text-sm font-heading font-bold">{sessionsCount} sessions · {fmt(followersCount)} followers · {reviews.length} reviews</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/50 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* ═══════ PLAYER: TABBED CONTENT ═══════ */}
      {!isCoach && (
        <>
          {/* Tab bar */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/20 mt-4">
            <div className="flex px-5">
              {PLAYER_TABS.map((tab) => {
                const isActive = playerTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setPlayerTab(tab.key)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-3 relative transition-all",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/60"
                    )}
                  >
                    <tab.icon className="h-[18px] w-[18px]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="player-tab-indicator"
                        className="absolute bottom-0 left-[20%] right-[20%] h-[3px] rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {/* ── ACTIVITY TAB ── */}
            {playerTab === "activity" && (
              <motion.div key="activity" {...fadeUp} className="px-5 pt-5 pb-4 space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-primary/8 to-accent/5 border border-primary/10 p-1">
                  <TraineeProgressCard userId={user.id} />
                </div>

                {/* Recent activity feed */}
                {upcomingBookings.length > 0 && (
                  <SectionCard icon={Calendar} title="Upcoming Sessions" count={upcomingBookings.length}>
                    <div className="space-y-2.5">
                      {upcomingBookings.slice(0, 3).map((b) => (
                        <motion.div key={b.id} variants={cardVariant} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/10">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{b.coach_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {b.time_label || b.time}
                            </p>
                          </div>
                          <Badge className={cn(
                            "text-[10px] rounded-full border-0 px-2 py-0.5",
                            b.status === "confirmed" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"
                          )}>{b.status}</Badge>
                        </motion.div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Upload Content CTA */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-upload-flow"))}
                  className="w-full rounded-2xl border-2 border-dashed border-primary/20 bg-secondary/20 p-4 flex items-center gap-4 active:scale-[0.98] transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-[#00B894] flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">Share Your Journey</p>
                    <p className="text-xs text-muted-foreground">Upload clips, photos & training updates</p>
                  </div>
                </button>

                {/* Discover coaches CTA */}
                <motion.div variants={cardVariant} className="rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/10 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="font-heading text-sm font-bold text-foreground">Find Your Circle</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Discover coaches, book sessions, and level up your game.</p>
                  <Link to="/discover" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-heading font-bold text-white active:scale-95 transition-transform">
                    Explore Coaches <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              </motion.div>
            )}

            {/* ── BOOKINGS TAB ── */}
            {playerTab === "bookings" && (
              <motion.div key="bookings" {...fadeUp} className="px-5 pt-5 pb-4 space-y-4">
                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">No bookings yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Book your first session with a coach</p>
                    <Link to="/discover" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-heading font-bold text-white mt-4 active:scale-95 transition-transform">
                      Find a Coach
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Next Session highlight */}
                    {upcomingBookings.length > 0 && (
                      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/8 to-transparent border border-primary/15">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Next Session</span>
                        </div>
                        <p className="text-base font-bold text-foreground">{upcomingBookings[0].coach_name || "Upcoming Session"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(upcomingBookings[0].date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {upcomingBookings[0].time_label || upcomingBookings[0].time || "TBD"}
                        </p>
                      </div>
                    )}

                    {/* Upcoming */}
                    {upcomingBookings.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h3>
                        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
                          {upcomingBookings.map((b) => (
                            <motion.div key={b.id} variants={cardVariant} className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/40 border border-border/10">
                              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{b.coach_name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(b.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                                </p>
                                <p className="text-xs text-muted-foreground">{b.time_label || b.time} · {b.training_type}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <Badge className="bg-green-500/15 text-green-400 border-0 text-[10px] rounded-full">{b.status}</Badge>
                                <p className="text-xs font-bold text-foreground mt-1">₪{b.price}</p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    )}

                    {/* Past */}
                    {pastBookings.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Past Sessions</h3>
                        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2">
                          {pastBookings.slice(0, 10).map((b) => (
                            <motion.div key={b.id} variants={cardVariant} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/10 opacity-70">
                              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{b.coach_name}</p>
                                <p className="text-xs text-muted-foreground">{new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {b.training_type}</p>
                              </div>
                              <Badge className={cn(
                                "text-[10px] rounded-full border-0",
                                b.status === "completed" ? "bg-white/5 text-muted-foreground" : "bg-red-500/10 text-red-400"
                              )}>{b.status}</Badge>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ── SAVED TAB ── */}
            {playerTab === "saved" && (
              <motion.div key="saved" {...fadeUp} className="px-5 pt-5 pb-4">
                {savedItems.length === 0 ? (
                  <div className="text-center py-16">
                    <Bookmark className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">Nothing saved yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Save coaches and content to find them later</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{savedItems.length} saved items</p>
                    {savedItems.slice(0, 12).map((item) => (
                      <motion.div key={item.id} variants={cardVariant} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/10">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bookmark className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.collection_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── FOLLOWING TAB ── */}
            {playerTab === "following" && (
              <motion.div key="following" {...fadeUp} className="px-5 pt-5 pb-4">
                {followedLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                  </div>
                ) : followedCoaches.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">Not following any coaches</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Follow coaches to see them here</p>
                    <Link to="/discover" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-heading font-bold text-white mt-4 active:scale-95 transition-transform">
                      Discover Coaches
                    </Link>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2.5">
                    {followedCoaches.map((coach) => (
                      <motion.div key={coach.id} variants={cardVariant} className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/40 border border-border/10">
                        <Link to={`/coach/${coach.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-12 w-12 border-2 border-border/20">
                            <AvatarImage src={coach.image_url || undefined} alt={coach.coach_name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {coach.coach_name?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-foreground truncate">{coach.coach_name}</p>
                              {coach.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge className="text-[10px] bg-primary/10 text-primary border-0 rounded-full px-2 py-0">{coach.sport}</Badge>
                              {coach.rating && (
                                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{coach.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                        <button
                          onClick={() => navigate(`/book/${coach.id}`)}
                          className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Book
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ═══════ COACH: CONTENT AREA ═══════ */}
      {isCoach && (
        <div className="px-5 mt-5 space-y-4">
          {/* Training Progress */}
          <TraineeProgressCard userId={user.id} />

          {/* Upload Content CTA */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-upload-flow"))}
            className="w-full rounded-2xl border-2 border-dashed border-primary/20 bg-secondary/20 p-4 flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-[#00B894] flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Upload Content</p>
              <p className="text-xs text-muted-foreground">Share videos, photos & updates</p>
            </div>
          </button>

          {/* Page Lab Sections */}
          <button
            onClick={() => setPageLabOpen(true)}
            className="w-full h-11 rounded-2xl bg-secondary border border-border/20 text-sm font-heading font-bold text-foreground flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            {hasCustomLayout ? "Edit Layout" : "Build with Page Lab"}
          </button>

          {sectionsLoading ? (
            <div className="py-12 flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : hasCustomLayout ? (
            <div className="flex flex-col gap-3">
              {visibleSections.map((s) => <div key={s.id}>{renderSection(s)}</div>)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-primary/20 bg-secondary/20 p-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-heading text-lg font-bold text-foreground">Build your creator page</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Customize sections, order content, and turn this into your personal brand hub.</p>
              </div>
              <button onClick={() => setPageLabOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-heading font-bold text-primary-foreground active:scale-95 transition-transform">
                <Sparkles className="h-4 w-4" />Start building
              </button>
            </div>
          )}

          {/* Quick content summary if no Page Lab */}
          {!hasCustomLayout && content.length > 0 && (
            <div className="space-y-3">
              {clips.length > 0 && (
                <SectionCard icon={Video} title="Recent Clips" count={clips.length}>
                  <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {clips.slice(0, 6).map((c) => (
                      <div key={c.id} className="relative flex-shrink-0 w-28 overflow-hidden rounded-xl bg-secondary">
                        <video src={c.media_url} className="aspect-[3/4] w-full object-cover" muted playsInline preload="metadata" />
                        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                          <Play className="h-2 w-2 text-white fill-white ml-[1px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
              {posts.length > 0 && (
                <SectionCard icon={ImageIcon} title="Recent Posts" count={posts.length}>
                  <div className="grid grid-cols-3 gap-1.5">
                    {posts.slice(0, 6).map((p) => (
                      <img key={p.id} src={p.thumbnail_url || p.media_url} alt={p.title} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════ NOTIFICATION PREFERENCES ═══════ */}
      <div className="px-5 mt-4 mb-2">
        <button
          onClick={() => navigate("/notification-preferences")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/10 active:scale-[0.98] transition-all text-left"
        >
          <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-[10px] text-muted-foreground">Control what you get notified about</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </button>
      </div>

      {/* ═══════ DATA & PRIVACY ═══════ */}
      <div className="px-5 mt-4 mb-2">
        <button
          onClick={() => navigate("/data-privacy")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/10 active:scale-[0.98] transition-all text-left"
        >
          <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Data & Privacy</p>
            <p className="text-[10px] text-muted-foreground">Export or delete your data</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </button>
      </div>

      {/* ═══════ MODALS ═══════ */}
      {pageLabOpen && isCoach && coachProfile!.id && (
        <PageLab coachId={coachProfile!.id} onClose={() => { setPageLabOpen(false); loadSections(); }} />
      )}
      {isCoach && (
        <FollowersModal
          open={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          coachId={coachProfile!.id}
          userId={user.id}
          initialTab={followersModalTab}
        />
      )}
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`${displayName} on Circlo`}
        text="Check out my profile on Circlo! 🏆"
        url="/profile"
      />
    </div>
  );
};

export default UserProfile;
