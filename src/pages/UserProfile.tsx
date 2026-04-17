import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Bookmark,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Eye,
  Flame,
  Heart,
  LayoutGrid,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Rocket,
  Search,
  Share2,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  User,
  Users,
  Video,
  Zap,
  Bolt,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageSection, SECTION_OPTIONS, usePageSections } from "@/hooks/use-page-sections";
import { useFollowerCount } from "@/hooks/use-follower-counts";
import { useBookingRequests } from "@/hooks/use-booking-requests";
import { useSavedItems } from "@/hooks/use-saved-items";
import { useTraineeProgress } from "@/hooks/use-trainee-progress";
import FollowersModal from "@/components/FollowersModal";
import { cn } from "@/lib/utils";
import TraineeProgressCard from "@/components/TraineeProgressCard";
import PageLab from "@/components/PageLab";
import ShareSheet from "@/components/ShareSheet";

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

interface FollowedCoach {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  price: number | null;
  rating: number | null;
  is_verified: boolean;
}

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

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35 },
};

/* ═══════════════════════════════════════════════════════
   PLAYER TAB
   ═══════════════════════════════════════════════════════ */
type PlayerTab = "activity" | "bookings" | "saved" | "following";

const PLAYER_TABS: { key: PlayerTab; label: string }[] = [
  { key: "activity", label: "Activity" },
  { key: "bookings", label: "Bookings" },
  { key: "saved", label: "Saved" },
  { key: "following", label: "Following" },
];

/* ═══════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════ */
const UserProfile = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, isDeveloper, activeRole, refreshProfile } = useAuth();
  const [coachProfile, setCoachProfile] = useState<CoachProfileData | null>(null);
  const [coachLoading, setCoachLoading] = useState(true);
  const [pageLabOpen, setPageLabOpen] = useState(false);
  const [content, setContent] = useState<CoachContent[]>([]);
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
  const fileRef = useRef<HTMLInputElement>(null);

  const isCoach = !!coachProfile;

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

  useEffect(() => {
    if (!user || bioLoaded) return;
    supabase.from("profiles").select("bio").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setBio((data as any)?.bio ?? "");
      setBioLoaded(true);
    });
  }, [user, bioLoaded]);

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
    if (!coachProfile?.id) { setContent([]); return; }
    const load = async () => {
      const { data: videoRows } = await supabase
        .from("coach_videos")
        .select("id, title, description, media_url, thumbnail_url, media_type, likes_count, views, created_at")
        .eq("coach_id", coachProfile.id)
        .order("created_at", { ascending: false });
      setContent((videoRows as CoachContent[] | null) ?? []);
    };
    load();
    const onUploaded = () => load();
    window.addEventListener("content-uploaded", onUploaded);
    return () => window.removeEventListener("content-uploaded", onUploaded);
  }, [coachProfile?.id]);

  const upcomingBookings = useMemo(() => bookings.filter((b) => b.status === "upcoming" || b.status === "confirmed"), [bookings]);
  const pastBookings = useMemo(() => bookings.filter((b) => b.status === "completed" || b.status === "cancelled"), [bookings]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
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

  /* ─── Loading ─── */
  if (loading || coachLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-24 px-6">
        <div className="flex flex-col items-center mb-10">
          <Skeleton className="h-32 w-32 rounded-full mb-6" />
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-10">
          <Skeleton className="col-span-2 h-28 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
    );
  }

  /* ─── Not logged in ─── */
  if (!user || !profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6 bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-[#46f1c5]/10 flex items-center justify-center mx-auto">
            <User className="h-10 w-10 text-[#46f1c5]" />
          </div>
          <p className="text-muted-foreground text-sm">Log in to see your profile.</p>
          <Link to="/login" className="px-8 py-3 rounded-lg bg-gradient-kinetic text-white font-black uppercase tracking-[0.15em] text-xs inline-block">Log in</Link>
        </motion.div>
      </div>
    );
  }

  if (isDeveloper && activeRole === "admin") {
    navigate("/admin", { replace: true });
    return null;
  }

  /* ═══════════════════════════════════════════════════════
     DERIVED
     ═══════════════════════════════════════════════════════ */
  const displayName = isCoach ? coachProfile!.coach_name : (profile.username || "Athlete");
  const avatarUrl = isCoach ? coachProfile!.image_url : profile.avatar_url;
  const initial = displayName?.charAt(0)?.toUpperCase() ?? "?";
  const followersCount = isCoach ? (followerCount > 0 ? followerCount : (coachProfile!.followers ?? 0)) : 0;
  const sessionsCount = isCoach ? (coachProfile!.total_sessions ?? 0) : bookings.length;

  const level = progress?.level ?? 1;
  const xp = progress?.xp ?? 0;
  const xpPerLevel = 1200;
  const xpInLevel = xp % xpPerLevel;
  const xpProgress = Math.min(100, (xpInLevel / xpPerLevel) * 100);
  const streakDays = (progress as any)?.streak_days ?? 0;
  const playerRoleLabel = (profile as any)?.interests?.[0]
    ? `${(profile as any).interests[0]} athlete`
    : "Pro trainee";

  /* ─── Coach Page Lab render helper ─── */
  const renderCoachSection = (section: PageSection) => {
    const icon = section.section_type === "media" ? Video
      : section.section_type === "about" ? Star
      : section.section_type === "schedule" ? Calendar
      : LayoutGrid;
    const Icon = icon;
    return (
      <section className="rounded-lg border border-border/40 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-4 w-4 text-[#46f1c5]" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
            {sectionLabel(section.section_type)}
          </h2>
        </div>
        {section.section_type === "about" && coachProfile?.bio && (
          <p className="text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">{coachProfile.bio}</p>
        )}
        {section.section_type === "media" && content.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {content.slice(0, 6).map((c) => (
              <img key={c.id} src={c.thumbnail_url || c.media_url} alt={c.title} className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
            ))}
          </div>
        )}
        {section.section_type === "about" && !coachProfile?.bio && (
          <p className="text-sm text-muted-foreground italic">No bio yet</p>
        )}
      </section>
    );
  };
  const visibleSections = hasCustomLayout ? sections.filter((s) => s.is_visible) : [];

  return (
    <div className="min-h-screen bg-background pb-32 app-top-nav">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      <div className="pt-6 pb-4 px-6">
        {/* ═══════ HERO PROFILE ═══════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-10 text-center"
        >
          <div className="relative mb-6">
            {/* Kinetic gradient ring */}
            <button
              onClick={() => fileRef.current?.click()}
              className="relative w-32 h-32 rounded-full p-1 bg-gradient-kinetic active:scale-95 transition-transform group"
              aria-label="Change avatar"
            >
              <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-card">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#46f1c5]/10 text-[#46f1c5] font-black text-4xl">
                    {initial}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-foreground" />
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {isCoach && coachProfile!.is_verified && (
                <div className="absolute bottom-1 right-1 rounded-full bg-background p-0.5">
                  <div className="rounded-full bg-[#46f1c5] p-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-background" />
                  </div>
                </div>
              )}
            </button>
            {/* Level badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#00d4aa] text-[#005643] px-4 py-1 rounded-full text-[10px] font-black tracking-[0.25em] shadow-lg uppercase">
              Level {level}
            </div>
          </div>

          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground mb-1">
            {displayName}
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#46f1c5] mb-6">
            {isCoach ? `${coachProfile!.sport} coach` : playerRoleLabel}
          </p>

          {/* XP progress */}
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
              <span>{fmt(xpInLevel)} XP</span>
              <span>{fmt(xpPerLevel)} XP</span>
            </div>
            <div className="h-2 w-full bg-card rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-kinetic"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mt-6 w-full max-w-xs">
            <button
              onClick={() => navigate("/edit-profile")}
              className="flex-1 h-11 rounded-lg bg-gradient-kinetic text-white font-black uppercase tracking-[0.15em] text-[11px] active:scale-95 transition-transform inline-flex items-center justify-center gap-1.5 shadow-[0_10px_30px_rgba(0,212,170,0.3)]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="h-11 w-11 rounded-lg bg-card border border-border/40 flex items-center justify-center text-foreground active:scale-95 transition-transform"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={signOut}
              className="h-11 w-11 rounded-lg bg-card border border-border/40 flex items-center justify-center text-foreground/70 active:scale-95 transition-transform"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </motion.section>

        {/* ═══════ BENTO STATS ═══════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-4 mb-10"
        >
          {/* Hero streak card */}
          <div className="col-span-2 bg-[#cd4802] p-6 rounded-lg relative overflow-hidden flex items-center justify-between">
            <div className="relative z-10">
              <span className="text-[10px] font-black tracking-[0.25em] text-foreground/70 uppercase">
                Active Momentum
              </span>
              <h3 className="text-3xl font-black italic text-foreground uppercase">
                {streakDays > 0 ? `${streakDays} day streak` : "Start your streak"}
              </h3>
            </div>
            <Flame className="relative z-10 h-12 w-12 text-white/90" strokeWidth={2.5} fill="currentColor" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          </div>

          {isCoach ? (
            <>
              <button
                onClick={() => { setFollowersModalTab("followers"); setFollowersModalOpen(true); }}
                className="bg-card p-5 rounded-lg text-left active:scale-95 transition-transform"
              >
                <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase block mb-2">Followers</span>
                <div className="text-2xl font-black text-foreground">{fmt(followersCount)}</div>
              </button>
              <div className="bg-card p-5 rounded-lg">
                <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase block mb-2">Sessions</span>
                <div className="text-2xl font-black text-[#46f1c5]">{fmt(sessionsCount)}</div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-card p-5 rounded-lg">
                <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase block mb-2">Total Workouts</span>
                <div className="text-2xl font-black text-foreground">{fmt(sessionsCount)}</div>
              </div>
              <button
                onClick={() => { setFollowersModalTab("following"); setFollowersModalOpen(true); }}
                className="bg-card p-5 rounded-lg text-left active:scale-95 transition-transform"
              >
                <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase block mb-2">Following</span>
                <div className="text-2xl font-black text-[#46f1c5]">{fmt(followingCount)}</div>
              </button>
            </>
          )}
        </motion.section>

        {/* ═══════ BADGES ROW ═══════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-xl tracking-tight text-foreground">Recent Badges</h3>
            <button className="text-[10px] font-black tracking-[0.2em] text-[#46f1c5] uppercase hover:opacity-80">
              View All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { Icon: Star, color: "#46f1c5", earned: (progress as any)?.level >= 1 },
              { Icon: Rocket, color: "#ffb59a", earned: streakDays >= 7 },
              { Icon: Shield, color: "#46f1c5", earned: bookings.length >= 5 },
              { Icon: Bolt, color: "#ffb59a", earned: xp >= 500 },
              { Icon: Trophy, color: "#46f1c5", earned: followingCount >= 3 },
            ].map(({ Icon, color, earned }, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`flex-shrink-0 w-20 h-20 bg-card rounded-full flex items-center justify-center border ${
                  earned ? "border-border/60" : "border-border/40 opacity-40"
                }`}
              >
                <Icon className="h-7 w-7" style={{ color: earned ? color : "#555" }} fill={earned ? color : "none"} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════ PLAYER TAB BAR ═══════ */}
        {!isCoach && (
          <motion.nav
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl -mx-6 px-6 py-3 mb-6 flex gap-6 overflow-x-auto scrollbar-hide"
          >
            {PLAYER_TABS.map((tab) => {
              const isActive = playerTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setPlayerTab(tab.key)}
                  className={`flex-shrink-0 text-xs font-black tracking-[0.2em] pb-1 uppercase transition-colors ${
                    isActive ? "text-[#46f1c5] border-b-2 border-[#46f1c5]" : "text-muted-foreground hover:text-foreground/80"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </motion.nav>
        )}

        {/* ═══════ PLAYER CONTENT ═══════ */}
        {!isCoach && (
          <AnimatePresence mode="wait">
            {/* ── ACTIVITY ── */}
            {playerTab === "activity" && (
              <motion.div key="activity" {...fadeUp} className="space-y-5">
                <TraineeProgressCard userId={user.id} />

                {upcomingBookings.length > 0 && (
                  <section>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">
                      Upcoming sessions
                    </h4>
                    <div className="space-y-2">
                      {upcomingBookings.slice(0, 3).map((b) => (
                        <div key={b.id} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40">
                          <div className="h-10 w-10 rounded-lg bg-[#46f1c5]/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 text-[#46f1c5]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{b.coach_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {b.time_label || b.time}
                            </p>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#46f1c5]">{b.status}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Quick access */}
                <section>
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">Quick access</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/discover" className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40 active:scale-[0.97] transition-transform">
                      <div className="h-10 w-10 rounded-lg bg-[#46f1c5]/10 flex items-center justify-center">
                        <Search className="h-5 w-5 text-[#46f1c5]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Find Coach</p>
                        <p className="text-[10px] text-muted-foreground">Browse & book</p>
                      </div>
                    </Link>
                    <Link to="/schedule" className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40 active:scale-[0.97] transition-transform">
                      <div className="h-10 w-10 rounded-lg bg-[#ffb59a]/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-[#ffb59a]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Schedule</p>
                        <p className="text-[10px] text-muted-foreground">{upcomingBookings.length} upcoming</p>
                      </div>
                    </Link>
                    <Link to="/inbox" className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40 active:scale-[0.97] transition-transform">
                      <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-foreground/80" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Messages</p>
                        <p className="text-[10px] text-muted-foreground">Inbox</p>
                      </div>
                    </Link>
                    <Link to="/community" className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40 active:scale-[0.97] transition-transform">
                      <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center">
                        <Users className="h-5 w-5 text-foreground/80" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Community</p>
                        <p className="text-[10px] text-muted-foreground">Groups & circles</p>
                      </div>
                    </Link>
                  </div>
                </section>
              </motion.div>
            )}

            {/* ── BOOKINGS ── */}
            {playerTab === "bookings" && (
              <motion.div key="bookings" {...fadeUp} className="space-y-5">
                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-lg border border-border/40">
                    <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-bold text-foreground">No bookings yet</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Book your first session with a coach</p>
                    <Link to="/discover" className="inline-flex items-center gap-1 px-5 py-2.5 rounded-full bg-gradient-kinetic text-white text-xs font-black uppercase tracking-wider">
                      Find a Coach
                    </Link>
                  </div>
                ) : (
                  <>
                    {upcomingBookings.length > 0 && (
                      <section>
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">Upcoming</h4>
                        <div className="space-y-2">
                          {upcomingBookings.map((b) => (
                            <div key={b.id} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40">
                              <div className="h-12 w-12 rounded-lg bg-[#46f1c5]/10 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-6 w-6 text-[#46f1c5]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{b.coach_name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(b.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                                </p>
                                <p className="text-xs text-muted-foreground">{b.time_label || b.time} · {b.training_type}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#46f1c5]">{b.status}</span>
                                <p className="text-xs font-bold text-foreground mt-1">₪{b.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {pastBookings.length > 0 && (
                      <section>
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">Past sessions</h4>
                        <div className="space-y-2">
                          {pastBookings.slice(0, 10).map((b) => (
                            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border/40 opacity-70">
                              <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{b.coach_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {b.training_type}
                                </p>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{b.status}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ── SAVED (Saved Routines Grid) ── */}
            {playerTab === "saved" && (
              <motion.div key="saved" {...fadeUp}>
                <div className="flex justify-between items-end mb-6">
                  <h3 className="font-bold text-xl tracking-tight text-foreground">Saved Routines</h3>
                  <div className="flex gap-4">
                    <LayoutGrid className="h-5 w-5 text-[#46f1c5]" />
                  </div>
                </div>

                {savedItems.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-lg border border-border/40">
                    <Bookmark className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-bold text-foreground">Nothing saved yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Save coaches and content to find them later</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {savedItems.slice(0, 12).map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-card border border-border/40"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#46f1c5]/20 to-[#cd4802]/30" />
                        <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-background to-transparent">
                          <span className="text-[9px] font-black text-[#46f1c5] uppercase tracking-[0.25em]">
                            Collection
                          </span>
                          <p className="text-sm font-bold text-foreground uppercase truncate mt-0.5">
                            {item.collection_name}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── FOLLOWING ── */}
            {playerTab === "following" && (
              <motion.div key="following" {...fadeUp}>
                {followedLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                  </div>
                ) : followedCoaches.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-lg border border-border/40">
                    <Heart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-bold text-foreground">Not following anyone</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Follow coaches to see them here</p>
                    <Link to="/discover" className="inline-flex items-center gap-1 px-5 py-2.5 rounded-full bg-gradient-kinetic text-white text-xs font-black uppercase tracking-wider">
                      Discover
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followedCoaches.map((coach) => (
                      <div key={coach.id} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40">
                        <Link to={`/coach/${coach.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-12 w-12 border-2 border-border/40">
                            <AvatarImage src={coach.image_url || undefined} alt={coach.coach_name} />
                            <AvatarFallback className="bg-[#46f1c5]/10 text-[#46f1c5] font-bold">
                              {coach.coach_name?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-foreground truncate">{coach.coach_name}</p>
                              {coach.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-[#46f1c5] flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#46f1c5]">{coach.sport}</span>
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
                          className="h-10 px-4 rounded-lg bg-gradient-kinetic text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-transform flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Book
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ═══════ COACH DASHBOARD VIEW ═══════ */}
        {isCoach && (
          <div className="space-y-8">
            <section>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffb59a]">Dashboard</span>
              <h2 className="mt-1 text-3xl font-black leading-tight text-foreground">
                Good morning, {coachProfile!.coach_name?.split(" ")[0] || "Coach"}
              </h2>
              {coachProfile!.tagline && (
                <p className="text-sm text-muted-foreground mt-2">{coachProfile!.tagline}</p>
              )}
              {coachProfile!.location && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {coachProfile!.location}
                </p>
              )}
            </section>

            {/* Revenue hero card with sparkline */}
            <section className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-kinetic opacity-20 blur-2xl group-hover:opacity-30 transition duration-1000 pointer-events-none" />
              <button
                onClick={() => navigate("/coach-dashboard?tab=overview")}
                className="relative w-full bg-card rounded-lg p-6 overflow-hidden border border-border/40 text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Est. revenue</p>
                    <h3 className="mt-1 text-4xl font-black text-foreground">
                      ₪{fmt((coachProfile!.total_sessions ?? 0) * (coachProfile!.price ?? 0))}
                    </h3>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {sessionsCount} sessions · ₪{coachProfile!.price ?? 0}/each
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-[#46f1c5]/10 text-[#46f1c5]">
                    View all
                  </span>
                </div>

                <div className="h-14 w-full flex items-end gap-1">
                  {[40, 55, 45, 70, 55, 85, 100, 75, 60, 45].map((pct, i) => {
                    const intensity = i >= 6 ? "bg-[#46f1c5]" : i >= 4 ? "bg-[#46f1c5]/60" : "bg-[#46f1c5]/30";
                    return (
                      <div
                        key={i}
                        className={cn("flex-1 rounded-t-sm transition-all duration-500", intensity)}
                        style={{ height: `${pct}%` }}
                      />
                    );
                  })}
                </div>
              </button>
            </section>

            {/* 2x2 bento stats */}
            <section className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setFollowersModalTab("followers"); setFollowersModalOpen(true); }}
                className="bg-card p-5 rounded-lg border border-border/40 text-left active:scale-95 transition-transform"
              >
                <Users className="h-7 w-7 text-[#46f1c5] mb-3" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Followers</p>
                <h4 className="mt-1 text-2xl font-black text-foreground">{fmt(followersCount)}</h4>
              </button>
              <button
                onClick={() => navigate("/coach-dashboard?tab=bookings")}
                className="bg-card p-5 rounded-lg border border-border/40 text-left active:scale-95 transition-transform"
              >
                <Calendar className="h-7 w-7 text-[#ffb59a] mb-3" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sessions</p>
                <h4 className="mt-1 text-2xl font-black text-foreground">{fmt(sessionsCount)}</h4>
              </button>
              <button
                onClick={() => navigate("/coach-dashboard?tab=analytics")}
                className="bg-card p-5 rounded-lg border border-border/40 text-left active:scale-95 transition-transform"
              >
                <Star className="h-7 w-7 text-[#46f1c5] mb-3" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rating</p>
                <h4 className="mt-1 text-2xl font-black text-foreground">
                  {(coachProfile!.rating ?? 5).toFixed(1)}
                </h4>
              </button>
              <button
                onClick={() => navigate("/coach-dashboard?tab=analytics")}
                className="bg-card p-5 rounded-lg border border-border/40 text-left active:scale-95 transition-transform"
              >
                <TrendingUp className="h-7 w-7 text-foreground mb-3" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Experience</p>
                <h4 className="mt-1 text-2xl font-black text-foreground">
                  {coachProfile!.years_experience ?? 0}+ yrs
                </h4>
              </button>
            </section>

            {/* Profile nav tabs → dashboard deep links */}
            <section>
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">
                Profile nav
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: TrendingUp, label: "Analytics", tab: "analytics", accent: "#46f1c5" },
                  { icon: Calendar, label: "Calendar", tab: "calendar", accent: "#ffb59a" },
                  { icon: Video, label: "Content", tab: "content", accent: "#46f1c5" },
                  { icon: Users, label: "Clients", tab: "clients", accent: "#ffb59a" },
                ].map(({ icon: Icon, label, tab, accent }) => (
                  <Link
                    key={label}
                    to={`/coach-dashboard?tab=${tab}`}
                    className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40 active:scale-[0.97] transition-transform"
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${accent}1a` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: accent }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Open</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <Link
                  to={`/coach-dashboard?tab=payouts`}
                  className="h-12 rounded-lg bg-card border border-border/40 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-foreground active:scale-95 transition-transform"
                >
                  <Zap className="h-4 w-4 text-[#46f1c5]" />
                  Payouts
                </Link>
                <Link
                  to={`/coach-dashboard?tab=bob`}
                  className="h-12 rounded-lg bg-card border border-border/40 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-foreground active:scale-95 transition-transform"
                >
                  <Sparkles className="h-4 w-4 text-[#ffb59a]" />
                  Bob AI
                </Link>
              </div>
            </section>

            {/* Preview + Page Lab */}
            <section className="grid grid-cols-2 gap-3">
              <Link
                to={`/coach/${coachProfile!.id}`}
                className="h-12 rounded-lg bg-gradient-kinetic text-white font-black uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-[0_10px_30px_rgba(0,212,170,0.25)]"
              >
                <Eye className="h-4 w-4" />
                Preview page
              </Link>
              <button
                onClick={() => setPageLabOpen(true)}
                className="h-12 rounded-lg bg-card border border-border/40 text-foreground font-black uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Sparkles className="h-4 w-4 text-[#46f1c5]" />
                {hasCustomLayout ? "Edit layout" : "Page Lab"}
              </button>
            </section>

            {/* Upload content */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-upload-flow"))}
              className="w-full rounded-lg border border-dashed border-[#46f1c5]/30 bg-card p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
            >
              <div className="h-12 w-12 rounded-lg bg-gradient-kinetic flex items-center justify-center shadow-[0_10px_30px_rgba(0,212,170,0.3)] flex-shrink-0">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-foreground">Upload content</p>
                <p className="text-xs text-muted-foreground mt-0.5">Share videos, photos & updates</p>
              </div>
            </button>

            {/* Custom Page Lab sections (if coach has set a custom layout) */}
            {sectionsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="h-8 w-8 border-2 border-[#46f1c5] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : hasCustomLayout ? (
              <div className="flex flex-col gap-3">
                {visibleSections.map((s) => <div key={s.id}>{renderCoachSection(s)}</div>)}
              </div>
            ) : null}
          </div>
        )}

        {/* ═══════ SETTINGS ═══════ */}
        <div className="mt-8 space-y-2">
          <button
            onClick={() => navigate("/notification-preferences")}
            className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40 active:scale-[0.98] transition-transform text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Notifications</p>
              <p className="text-[10px] text-muted-foreground">Control what you get notified about</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate("/data-privacy")}
            className="w-full flex items-center gap-3 p-4 rounded-lg bg-card border border-border/40 active:scale-[0.98] transition-transform text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Data & Privacy</p>
              <p className="text-[10px] text-muted-foreground">Export or delete your data</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
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
