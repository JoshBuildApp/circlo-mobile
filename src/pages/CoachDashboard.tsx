import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle, Bell, Bot, TrendingUp,
  CalendarDays, Users, Video, BarChart3, CalendarCog,
  Eye, Mic, CreditCard, Clock, Star, Timer, Target,
} from "lucide-react";
import VideoUploadModal from "@/components/VideoUploadModal";
import VerificationWizard from "@/components/VerificationWizard";
import CoachOnboardingChecklist from "@/components/dashboard/CoachOnboardingChecklist";
import StripeConnectSetup from "@/components/StripeConnectSetup";
import DigitalProductsSection from "@/components/DigitalProductsSection";
import CoachAMA from "@/components/CoachAMA";
import BookingsTab, { type BookingRecord } from "@/components/dashboard/BookingsTab";
import ClientsTab, { type ClientRecord } from "@/components/dashboard/ClientsTab";
import ContentTab, { type VideoRecord } from "@/components/dashboard/ContentTab";
import AnalyticsTab from "@/components/dashboard/AnalyticsTab";
import BobAITab, { type CoachBusinessData } from "@/components/dashboard/BobAITab";
import NotificationsTab from "@/components/dashboard/NotificationsTab";
import { useCoachStats } from "@/hooks/use-coach-stats";
import CoachHubPreview from "@/components/CoachHubPreview";
import VisualAvailabilityManager from "@/components/VisualAvailabilityManager";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BookingsSkeleton,
  ClientsSkeleton,
  ContentSkeleton,
  AnalyticsSkeleton,
} from "@/components/CoachDashboardSkeleton";

type Tab = "overview" | "notifications" | "bookings" | "calendar" | "schedule" | "clients" | "content" | "analytics" | "bob" | "ama" | "payouts";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "schedule", label: "Schedule", icon: CalendarCog },
  { id: "clients", label: "Clients", icon: Users },
  { id: "content", label: "Content", icon: Video },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "ama", label: "AMA", icon: Mic },
  { id: "bob", label: "Bob AI", icon: Bot },
  { id: "payouts", label: "Payouts", icon: CreditCard },
];

interface CoachProfile {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  is_verified: boolean;
  is_pro: boolean;
  is_boosted: boolean;
  followers: number | null;
  price: number | null;
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const CoachDashboard = () => {
  const { user, role, isAdmin, isDeveloper, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [pendingBookings, setPendingBookings] = useState<BookingRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [newFollowersCount, setNewFollowersCount] = useState(0);
  const [dashLoading, setDashLoading] = useState(true);
  const [avgRating, setAvgRating] = useState<number>(0);

  const { unreadCount: notifUnreadCount } = useNotifications();
  const coachId = user?.id || "";

  const { stats: coachStats } = useCoachStats(coachId || undefined);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, is_verified, is_pro, is_boosted, followers, price")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setProfile(data);

      if (data) {
        const { data: vr } = await supabase
          .from("verification_requests")
          .select("status")
          .eq("coach_id", data.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (vr) setVerificationStatus(vr.status);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    const fetchDashboard = async () => {
      setDashLoading(true);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [bookingsRes, videosRes, reviewsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, user_id, date, time, time_label, status, price, training_type, is_group")
          .eq("coach_id", profile.id)
          .order("date", { ascending: false }),
        supabase
          .from("coach_videos")
          .select("id, title, media_url, thumbnail_url, views, likes_count, comments_count, created_at, category")
          .eq("coach_id", profile.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("reviews")
          .select("rating")
          .eq("coach_id", profile.id),
      ]);

      const rawBookings = bookingsRes.data || [];
      const rawVideos = videosRes.data || [];

      const bookingUserIds = [...new Set(rawBookings.map((b: any) => b.user_id))];
      const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
      if (bookingUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", bookingUserIds);
        if (profiles) {
          profiles.forEach((p: any) => {
            profileMap[p.user_id] = { username: p.username, avatar_url: p.avatar_url };
          });
        }
      }

      const enrichedBookings: BookingRecord[] = rawBookings.map((b: any) => ({
        ...b,
        user_name: profileMap[b.user_id]?.username || "Trainee",
        avatar_url: profileMap[b.user_id]?.avatar_url || null,
      }));

      setAllBookings(enrichedBookings);
      setPendingBookings(enrichedBookings.filter(b => b.status === "pending"));

      setVideos(rawVideos.map((v: any) => ({
        id: v.id,
        title: v.title || "Untitled",
        media_url: v.media_url,
        thumbnail_url: v.thumbnail_url,
        views: v.views || 0,
        likes_count: v.likes_count || 0,
        comments_count: v.comments_count || 0,
        created_at: v.created_at,
        category: v.category,
      })));
      setTotalComments(rawVideos.reduce((s: number, v: any) => s + (v.comments_count || 0), 0));

      const clientMap: Record<string, { total: number; spent: number; last: string; first: string; lastTrainingType: string | null }> = {};
      rawBookings.filter((b: any) => b.status !== "cancelled").forEach((b: any) => {
        if (!clientMap[b.user_id]) {
          clientMap[b.user_id] = { total: 0, spent: 0, last: b.date, first: b.date, lastTrainingType: b.training_type || null };
        }
        clientMap[b.user_id].total++;
        clientMap[b.user_id].spent += b.price || 0;
        if (b.date > clientMap[b.user_id].last) {
          clientMap[b.user_id].last = b.date;
          clientMap[b.user_id].lastTrainingType = b.training_type || null;
        }
        if (b.date < clientMap[b.user_id].first) clientMap[b.user_id].first = b.date;
      });

      const clientList: ClientRecord[] = Object.entries(clientMap).map(([uid, info]) => ({
        user_id: uid,
        username: profileMap[uid]?.username || "Trainee",
        avatar_url: profileMap[uid]?.avatar_url || null,
        total_bookings: info.total,
        total_spent: info.spent,
        last_booking: info.last,
        first_booking: info.first,
        last_training_type: info.lastTrainingType,
      })).sort((a, b) => b.total_bookings - a.total_bookings);

      setClients(clientList);

      const followersRes = await supabase
        .from("community_members")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", profile.id)
        .gte("created_at", weekAgo);
      setNewFollowersCount(followersRes.count || 0);

      const reviews = reviewsRes.data || [];
      if (reviews.length > 0) {
        setAvgRating(reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length);
      } else {
        setAvgRating(5);
      }

      setDashLoading(false);
    };
    fetchDashboard();
  }, [profile]);

  const refreshBookings = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("bookings")
      .select("id, user_id, date, time, time_label, status, price, training_type, is_group")
      .eq("coach_id", profile.id)
      .order("date", { ascending: false });
    if (!data) return;

    const userIds = [...new Set(data.map((b: any) => b.user_id))];
    const pMap: Record<string, { username: string; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);
      if (profiles) profiles.forEach((p: any) => { pMap[p.user_id] = { username: p.username, avatar_url: p.avatar_url }; });
    }

    const enriched: BookingRecord[] = data.map((b: any) => ({
      ...b,
      user_name: pMap[b.user_id]?.username || "Trainee",
      avatar_url: pMap[b.user_id]?.avatar_url || null,
    }));
    setAllBookings(enriched);
    setPendingBookings(enriched.filter(b => b.status === "pending"));
  };

  const refreshVideos = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("coach_videos")
      .select("id, title, media_url, thumbnail_url, views, likes_count, comments_count, created_at, category")
      .eq("coach_id", profile.id)
      .order("created_at", { ascending: false });
    if (data) {
      setVideos(data.map((v: any) => ({
        id: v.id,
        title: v.title || "Untitled",
        media_url: v.media_url,
        thumbnail_url: v.thumbnail_url,
        views: v.views || 0,
        likes_count: v.likes_count || 0,
        comments_count: v.comments_count || 0,
        created_at: v.created_at,
        category: v.category,
      })));
    }
  };

  const nonCancelledBookings = useMemo(() =>
    allBookings.filter(b => b.status !== "cancelled"), [allBookings]);

  const totalEarnings = useMemo(() =>
    nonCancelledBookings.reduce((s, b) => s + (b.price || 0), 0), [nonCancelledBookings]);

  const weeklyEarnings = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    return nonCancelledBookings.filter(b => b.date >= weekAgo).reduce((s, b) => s + (b.price || 0), 0);
  }, [nonCancelledBookings]);

  const earningsSparkline = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const dayStart = new Date(Date.now() - (9 - i) * 86400000);
      const dayStr = dayStart.toISOString().split("T")[0];
      const earnings = nonCancelledBookings
        .filter(b => b.date === dayStr)
        .reduce((s, b) => s + (b.price || 0), 0);
      return earnings;
    });
  }, [nonCancelledBookings]);

  const sparkMax = Math.max(1, ...earningsSparkline);

  const weeklyGrowthPct = useMemo(() => {
    const now = Date.now();
    const weekAgo = new Date(now - 7 * 86400000).toISOString().split("T")[0];
    const twoWeeksAgo = new Date(now - 14 * 86400000).toISOString().split("T")[0];
    const thisWeek = nonCancelledBookings.filter(b => b.date >= weekAgo).reduce((s, b) => s + (b.price || 0), 0);
    const lastWeek = nonCancelledBookings.filter(b => b.date >= twoWeeksAgo && b.date < weekAgo).reduce((s, b) => s + (b.price || 0), 0);
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }, [nonCancelledBookings]);

  const todayBookings = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return allBookings
      .filter(b => b.date === today && b.status !== "cancelled")
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [allBookings]);

  const upcomingBookings = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return allBookings
      .filter(b => b.date >= today && b.status !== "cancelled")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [allBookings]);

  const totalViews = useMemo(() => videos.reduce((s, v) => s + v.views, 0), [videos]);
  const totalLikes = useMemo(() => videos.reduce((s, v) => s + v.likes_count, 0), [videos]);

  const hoursCoached = useMemo(() => {
    return nonCancelledBookings.filter(b => b.status === "completed").length;
  }, [nonCancelledBookings]);

  const completionRate = useMemo(() => {
    if (allBookings.length === 0) return 100;
    const completed = allBookings.filter(b => b.status === "completed").length;
    const cancelled = allBookings.filter(b => b.status === "cancelled").length;
    return Math.round((completed / Math.max(1, completed + cancelled)) * 100);
  }, [allBookings]);

  const retentionData = useMemo(() => {
    const months: { month: string; retained: number; churned: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().slice(0, 7);
      const monthLabel = d.toLocaleString("default", { month: "short" });
      const monthBookings = nonCancelledBookings.filter(b => b.date.startsWith(monthStr));
      const usersThisMonth = new Set(monthBookings.map(b => b.user_id));
      const prevMonth = new Date(d);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevStr = prevMonth.toISOString().slice(0, 7);
      const prevBookings = nonCancelledBookings.filter(b => b.date.startsWith(prevStr));
      const usersPrevMonth = new Set(prevBookings.map(b => b.user_id));
      const retained = [...usersPrevMonth].filter(u => usersThisMonth.has(u)).length;
      const churned = [...usersPrevMonth].filter(u => !usersThisMonth.has(u)).length;
      months.push({ month: monthLabel, retained, churned });
    }
    return months;
  }, [nonCancelledBookings]);

  const followerGrowth = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const weekStart = new Date(Date.now() - (5 - i) * 7 * 86400000);
      return {
        week: `${weekStart.toLocaleString("default", { month: "short" })} ${weekStart.getDate()}`,
        followers: Math.max(0, (profile?.followers || 0) - (5 - i) * Math.floor(Math.random() * 3)),
      };
    });
  }, [profile?.followers]);

  const bobCoachData: CoachBusinessData = useMemo(() => {
    const uniqueClients = new Set(nonCancelledBookings.map(b => b.user_id)).size;
    const userBookingCounts: Record<string, number> = {};
    nonCancelledBookings.forEach(b => { userBookingCounts[b.user_id] = (userBookingCounts[b.user_id] || 0) + 1; });
    const returning = Object.values(userBookingCounts).filter(c => c > 1).length;
    const rebookingRate = uniqueClients > 0 ? Math.round((returning / uniqueClients) * 100) : 0;
    const cancelled = allBookings.filter(b => b.status === "cancelled").length;
    const cancellationRate = allBookings.length > 0 ? Math.round((cancelled / allBookings.length) * 100) : 0;
    const totalSessions = nonCancelledBookings.length;
    const avgPerDay = totalSessions > 0 ? Math.max(1, Math.round(totalSessions / 30)) : 0;

    const bookingsByDay: Record<string, number> = {};
    nonCancelledBookings.forEach(b => {
      const day = new Date(b.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
      bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(bookingsByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
      totalSessions,
      totalRevenue: totalEarnings,
      avgPerDay,
      mostActiveDay,
      mostActiveWeek: "Current",
      followerCount: profile?.followers || 0,
      uniqueClients,
      videoCount: videos.length,
      totalViews,
      totalLikes,
      completionRate,
      bookingsByDay,
      period: "all-time",
      cancellationRate,
      rebookingRate,
      avgSessionPrice: profile?.price || 0,
      monthlyGrowthPct: weeklyGrowthPct,
      topPerformingContent: videos.length > 0 ? videos.reduce((best, v) => v.views > best.views ? v : best).title : "",
    };
  }, [nonCancelledBookings, allBookings, totalEarnings, profile, videos, totalViews, totalLikes, weeklyGrowthPct, completionRate]);

  const handleDelete = async (video: VideoRecord) => {
    const urlParts = video.media_url.split("/coach-videos/");
    const filePath = urlParts[1];
    if (filePath) {
      await supabase.storage.from("coach-videos").remove([decodeURIComponent(filePath)]);
    }
    await supabase.from("coach_videos").delete().eq("id", video.id);
    toast.success("Video deleted");
    refreshVideos();
  };

  // Route guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#46f1c5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (role !== "coach" && !isAdmin && !isDeveloper)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="rounded-lg border border-border/60 bg-card p-6 text-center space-y-3 max-w-sm">
          <h1 className="text-lg font-black uppercase tracking-[0.15em] text-foreground">Coach Dashboard</h1>
          <p className="text-sm text-muted-foreground">This area is for coaches only.</p>
          <Link to="/profile" className="inline-flex items-center gap-2 rounded-lg bg-gradient-kinetic px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-white">
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 app-top-nav">
      {/* ═══════ HEADER ═══════ */}
      <div className="px-6 pt-6 pb-4 max-w-md mx-auto">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffb59a]">Dashboard</span>
            <h1 className="mt-1 text-3xl font-black leading-tight text-foreground">
              {greeting()}, {profile?.coach_name?.split(" ")[0] || "Coach"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {profile?.is_verified && (
              <div className="h-7 px-2 rounded-lg bg-[#46f1c5]/10 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-[#46f1c5]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#46f1c5]">Verified</span>
              </div>
            )}
            <button
              onClick={() => setTab("notifications")}
              className="h-9 w-9 rounded-lg bg-card border border-border/40 flex items-center justify-center relative"
            >
              <Bell className="h-4 w-4 text-foreground/70" />
              {notifUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#cd4802] text-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {notifUnreadCount > 99 ? "99+" : notifUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ OVERVIEW VIEW ═══════ */}
      {tab === "overview" && (
        <div className="px-6 max-w-md mx-auto space-y-8">
          {/* Hero Earnings Card */}
          <section className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-kinetic opacity-20 blur-2xl group-hover:opacity-30 transition duration-1000" />
            <div className="relative bg-card rounded-lg p-6 overflow-hidden border border-border/40">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Total Revenue</p>
                  <h3 className="mt-1 text-4xl font-black text-foreground">₪{totalEarnings.toLocaleString()}</h3>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Week: ₪{weeklyEarnings.toLocaleString()}
                  </p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
                  weeklyGrowthPct >= 0 ? "bg-[#46f1c5]/10 text-[#46f1c5]" : "bg-[#cd4802]/10 text-[#ffb59a]"
                )}>
                  {weeklyGrowthPct >= 0 ? "+" : ""}{weeklyGrowthPct}%
                </span>
              </div>

              {/* Sparkline */}
              <div className="h-16 w-full flex items-end gap-1">
                {earningsSparkline.map((v, i) => {
                  const pct = Math.max(8, (v / sparkMax) * 100);
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
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gradient-kinetic opacity-10 rounded-full blur-3xl" />
            </div>
          </section>

          {/* 2x2 Bento stats */}
          <section className="grid grid-cols-2 gap-4">
            <div className="glass-dark p-5 rounded-lg border border-border/40">
              <Users className="h-7 w-7 text-[#46f1c5] mb-3" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Active Clients</p>
              <h4 className="mt-1 text-2xl font-black text-foreground">{clients.length}</h4>
            </div>
            <div className="glass-dark p-5 rounded-lg border border-border/40">
              <Timer className="h-7 w-7 text-[#ffb59a] mb-3" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Hours Coached</p>
              <h4 className="mt-1 text-2xl font-black text-foreground">{hoursCoached}</h4>
            </div>
            <div className="glass-dark p-5 rounded-lg border border-border/40">
              <Star className="h-7 w-7 text-[#46f1c5] mb-3" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Avg Rating</p>
              <h4 className="mt-1 text-2xl font-black text-foreground">{avgRating.toFixed(1)}</h4>
            </div>
            <div className="glass-dark p-5 rounded-lg border border-border/40">
              <Target className="h-7 w-7 text-foreground mb-3" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Completion</p>
              <h4 className="mt-1 text-2xl font-black text-foreground">{completionRate}%</h4>
            </div>
          </section>

          {/* Onboarding Checklist */}
          {profile && !dashLoading && (
            <CoachOnboardingChecklist
              hasProfilePhoto={!!profile.image_url}
              hasAvailability={allBookings.length > 0 || videos.length > 0}
              hasVideo={videos.length > 0}
              hasPrice={!!profile.price && profile.price > 0}
              isVerified={profile.is_verified}
              verificationStatus={verificationStatus}
              onUpload={() => setUploadOpen(true)}
              onVerify={() => setVerifyOpen(true)}
              onSetTab={(t) => setTab(t as Tab)}
            />
          )}

          {/* Upcoming Sessions */}
          <section>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-foreground">Upcoming Sessions</h3>
              <button
                onClick={() => setTab("bookings")}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#46f1c5]"
              >
                View All
              </button>
            </div>

            {dashLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-10 bg-card rounded-lg border border-border/40">
                <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-card rounded-lg p-4 flex items-center gap-4 border border-border/40 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/40 flex-shrink-0">
                      {b.avatar_url ? (
                        <img src={b.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#46f1c5] font-black">
                          {b.user_name?.[0]?.toUpperCase() || "T"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{b.user_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                        {b.training_type || "Session"} · ₪{b.price}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-black uppercase tracking-wider text-[#46f1c5]">
                        {new Date(b.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {b.time_label || b.time || "TBD"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ═══════ TAB BAR (below overview) ═══════ */}
      <div className="px-6 mt-8 max-w-md mx-auto mb-5">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all",
                tab === t.id
                  ? "bg-gradient-kinetic text-white"
                  : "bg-card border border-border/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.id === "notifications" && notifUnreadCount > 0 && (
                <span className={cn(
                  "ml-0.5 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] font-bold px-1",
                  tab === "notifications" ? "bg-muted/60 text-foreground" : "bg-[#cd4802] text-foreground"
                )}>
                  {notifUnreadCount > 99 ? "99+" : notifUnreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ TAB CONTENT (non-overview) ═══════ */}
      <div className="px-6 max-w-md mx-auto space-y-5">
        {tab === "notifications" && profile && (
          <NotificationsTab coachProfileId={profile.id} />
        )}

        {tab === "bookings" && dashLoading && <BookingsSkeleton />}
        {tab === "bookings" && !dashLoading && profile && (
          <BookingsTab
            allBookings={allBookings}
            pendingBookings={pendingBookings}
            loading={dashLoading}
            coachProfileId={profile.id}
            onRefresh={refreshBookings}
          />
        )}

        {tab === "schedule" && profile && (
          <VisualAvailabilityManager coachProfileId={profile.id} />
        )}

        {tab === "clients" && dashLoading && <ClientsSkeleton />}
        {tab === "clients" && !dashLoading && (
          <ClientsTab
            clients={clients}
            retentionData={retentionData}
            loading={dashLoading}
          />
        )}

        {tab === "content" && dashLoading && <ContentSkeleton />}
        {tab === "content" && !dashLoading && (
          <ContentTab
            videos={videos}
            followerGrowth={followerGrowth}
            profileVisits={totalViews}
            totalViews={totalViews}
            totalLikes={totalLikes}
            totalComments={totalComments}
            loading={dashLoading}
            onUpload={() => setUploadOpen(true)}
            onDelete={handleDelete}
          />
        )}

        {tab === "analytics" && dashLoading && <AnalyticsSkeleton />}
        {tab === "analytics" && !dashLoading && (
          <AnalyticsTab
            allBookings={allBookings}
            videos={videos}
            totalViews={totalViews}
            loading={dashLoading}
          />
        )}

        {tab === "ama" && profile && (
          <CoachAMA coachId={profile.id} isCoach={true} />
        )}

        {tab === "bob" && profile && (
          <BobAITab
            coachData={bobCoachData}
            coachName={profile.coach_name}
            sport={profile.sport}
          />
        )}

        {tab === "payouts" && profile && (
          <div className="space-y-5">
            <StripeConnectSetup coachProfileId={profile.id} />
            <DigitalProductsSection coachProfileId={profile.id} isOwner={true} />
          </div>
        )}
      </div>

      <VideoUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        coachId={coachId}
        userId={user.id}
        onUploaded={refreshVideos}
      />

      {verifyOpen && profile && (
        <VerificationWizard
          coachProfileId={profile.id}
          coachName={profile.coach_name}
          coachSport={profile.sport}
          onClose={() => setVerifyOpen(false)}
          onSubmitted={() => {
            setVerifyOpen(false);
            setVerificationStatus("pending");
          }}
        />
      )}

      {profile && (
        <CoachHubPreview
          coachProfileId={profile.id}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
};

export default CoachDashboard;
