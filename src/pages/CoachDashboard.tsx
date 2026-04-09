import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle, Clock, Bell, Bot, TrendingUp,
  CalendarDays, DollarSign, Users, Video, BarChart3, CalendarRange, CalendarCog,
} from "lucide-react";
import VideoUploadModal from "@/components/VideoUploadModal";
import VerificationWizard from "@/components/VerificationWizard";
import CoachOnboardingChecklist from "@/components/dashboard/CoachOnboardingChecklist";
import OverviewTab, { type RecentReview } from "@/components/dashboard/OverviewTab";
import BookingsTab, { type BookingRecord } from "@/components/dashboard/BookingsTab";
import ClientsTab, { type ClientRecord } from "@/components/dashboard/ClientsTab";
import ContentTab, { type VideoRecord } from "@/components/dashboard/ContentTab";
import AnalyticsTab from "@/components/dashboard/AnalyticsTab";
import BobAITab, { type CoachBusinessData } from "@/components/dashboard/BobAITab";
import CalendarTab from "@/components/dashboard/CalendarTab";
import VisualAvailabilityManager from "@/components/VisualAvailabilityManager";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OverviewSkeleton,
  BookingsSkeleton,
  ClientsSkeleton,
  ContentSkeleton,
  AnalyticsSkeleton,
} from "@/components/CoachDashboardSkeleton";

type Tab = "overview" | "bookings" | "calendar" | "schedule" | "clients" | "content" | "analytics" | "bob";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "calendar", label: "Calendar", icon: CalendarRange },
  { id: "schedule", label: "Schedule", icon: CalendarCog },
  { id: "clients", label: "Clients", icon: Users },
  { id: "content", label: "Content", icon: Video },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "bob", label: "Bob AI", icon: Bot },
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

const CoachDashboard = () => {
  const { user, role, isAdmin, isDeveloper, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  // Dashboard data
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [pendingBookings, setPendingBookings] = useState<BookingRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [newFollowersCount, setNewFollowersCount] = useState(0);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  const coachId = user?.id || "";

  // Fetch coach profile
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

  // Fetch all dashboard data
  useEffect(() => {
    if (!profile) return;
    const fetchDashboard = async () => {
      setDashLoading(true);
      const today = new Date().toISOString().split("T")[0];

      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [bookingsRes, videosRes, followersRes, reviewsRes] = await Promise.all([
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
          .from("user_follows")
          .select("id", { count: "exact", head: true })
          .eq("coach_id", profile.id)
          .gte("created_at", weekAgo),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, user_id, user_name")
          .eq("coach_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const rawBookings = bookingsRes.data || [];
      const rawVideos = videosRes.data || [];

      // Enrich bookings with user names
      const bookingUserIds = [...new Set(rawBookings.map((b: any) => b.user_id))];
      let profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
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

      // Videos
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

      // Build clients from bookings
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

      // New followers count (last 7 days)
      setNewFollowersCount(followersRes.count || 0);

      // Recent reviews — enrich with reviewer profiles
      const rawReviews = reviewsRes.data || [];
      if (rawReviews.length > 0) {
        const reviewerIds = [...new Set(rawReviews.map((r: any) => r.user_id))];
        const { data: reviewerProfiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", reviewerIds);
        const reviewerMap: Record<string, { username: string; avatar_url: string | null }> = {};
        if (reviewerProfiles) {
          reviewerProfiles.forEach((p: any) => {
            reviewerMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
          });
        }
        setRecentReviews(rawReviews.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer_username: reviewerMap[r.user_id]?.username || r.user_name || "Anonymous",
          reviewer_avatar: reviewerMap[r.user_id]?.avatar_url || null,
        })));
      } else {
        setRecentReviews([]);
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
    let pMap: Record<string, { username: string; avatar_url: string | null }> = {};
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

  // Derived data
  const nonCancelledBookings = useMemo(() =>
    allBookings.filter(b => b.status !== "cancelled"), [allBookings]);

  const totalEarnings = useMemo(() =>
    nonCancelledBookings.reduce((s, b) => s + (b.price || 0), 0), [nonCancelledBookings]);

  const weeklyEarnings = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    return nonCancelledBookings.filter(b => b.date >= weekAgo).reduce((s, b) => s + (b.price || 0), 0);
  }, [nonCancelledBookings]);

  const monthlyEarnings = useMemo(() => {
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    return nonCancelledBookings.filter(b => b.date >= monthAgo).reduce((s, b) => s + (b.price || 0), 0);
  }, [nonCancelledBookings]);

  const yearlyEarnings = useMemo(() => {
    const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
    return nonCancelledBookings.filter(b => b.date >= yearAgo).reduce((s, b) => s + (b.price || 0), 0);
  }, [nonCancelledBookings]);

  const earningsChart = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(Date.now() - (7 - i) * 7 * 86400000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const weekEndStr = weekEnd.toISOString().split("T")[0];
      const earnings = nonCancelledBookings
        .filter(b => b.date >= weekStartStr && b.date < weekEndStr)
        .reduce((s, b) => s + (b.price || 0), 0);
      return { week: `${weekStart.toLocaleString("default", { month: "short" })} ${weekStart.getDate()}`, earnings };
    });
  }, [nonCancelledBookings]);

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

  const totalViews = useMemo(() => videos.reduce((s, v) => s + v.views, 0), [videos]);
  const totalLikes = useMemo(() => videos.reduce((s, v) => s + v.likes_count, 0), [videos]);

  // Retention data for clients tab
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

  // Follower growth (simulated from video creation dates)
  const followerGrowth = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const weekStart = new Date(Date.now() - (5 - i) * 7 * 86400000);
      return {
        week: `${weekStart.toLocaleString("default", { month: "short" })} ${weekStart.getDate()}`,
        followers: Math.max(0, (profile?.followers || 0) - (5 - i) * Math.floor(Math.random() * 3)),
      };
    });
  }, [profile?.followers]);

  // Bob AI coach data
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
      completionRate: totalSessions > 0 ? Math.round(((totalSessions - cancelled) / Math.max(1, totalSessions + cancelled)) * 100) : 0,
      bookingsByDay,
      period: "all-time",
      cancellationRate,
      rebookingRate,
      avgSessionPrice: profile?.price || 0,
      monthlyGrowthPct: weeklyGrowthPct,
      topPerformingContent: videos.length > 0 ? videos.reduce((best, v) => v.views > best.views ? v : best).title : "",
    };
  }, [nonCancelledBookings, allBookings, totalEarnings, profile, videos, totalViews, totalLikes, weeklyGrowthPct]);

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
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (role !== "coach" && !isAdmin && !isDeveloper)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="rounded-[28px] border border-border/10 bg-card p-6 text-center space-y-3 max-w-sm">
          <h1 className="font-heading text-lg font-bold text-foreground">Coach Dashboard</h1>
          <p className="text-sm text-muted-foreground">This area is for coaches only.</p>
          <Link to="/profile" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-heading font-bold text-primary-foreground">
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-secondary overflow-hidden">
              {profile?.image_url ? (
                <img src={profile.image_url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : null}
              {!profile?.image_url && (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                  {profile?.coach_name?.[0] || "C"}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">{profile?.coach_name || "Coach"}</h1>
              <p className="text-[11px] text-muted-foreground">{profile?.sport}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile?.is_verified && (
              <div className="h-7 px-2 rounded-lg bg-accent/10 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-semibold text-accent">Verified</span>
              </div>
            )}
            <button
              onClick={() => navigate("/inbox")}
              className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Onboarding Checklist */}
      {tab === "overview" && profile && !dashLoading && (
        <div className="px-4 mb-4">
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
        </div>
      )}

      {/* Tab content */}
      <div className="px-4 space-y-5">
        {tab === "overview" && dashLoading && <OverviewSkeleton />}
        {tab === "overview" && !dashLoading && (
          <OverviewTab
            totalEarnings={totalEarnings}
            weeklyEarnings={weeklyEarnings}
            monthlyEarnings={monthlyEarnings}
            yearlyEarnings={yearlyEarnings}
            pendingEarnings={0}
            receivedEarnings={totalEarnings}
            earningsChart={earningsChart}
            revenueByType={[]}
            payoutHistory={[]}
            todayBookings={todayBookings.map(b => ({
              id: b.id,
              user_id: b.user_id,
              date: b.date,
              time: b.time,
              time_label: b.time_label,
              status: b.status,
              price: b.price,
              user_name: b.user_name,
            }))}
            totalViews={totalViews}
            totalLikes={totalLikes}
            followers={profile?.followers || 0}
            clientsCount={clients.length}
            videosCount={videos.length}
            weeklyGrowthPct={weeklyGrowthPct}
            loading={dashLoading}
            isPro={profile?.is_pro || false}
            isVerified={profile?.is_verified || false}
            verificationStatus={verificationStatus}
            onUpload={() => setUploadOpen(true)}
            onVerify={() => setVerifyOpen(true)}
            onSetTab={(t) => setTab(t as Tab)}
          />
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

        {tab === "calendar" && !dashLoading && profile && (
          <CalendarTab
            allBookings={allBookings}
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

        {tab === "bob" && profile && (
          <BobAITab
            coachData={bobCoachData}
            coachName={profile.coach_name}
            sport={profile.sport}
          />
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
    </div>
  );
};

export default CoachDashboard;
