import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { motion } from "framer-motion";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import BrandLoader from "@/components/BrandLoader";
import CircloSplash from "@/components/CircloSplash";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataModeProvider } from "@/contexts/DataModeContext";
import { DevGateProvider } from "@/contexts/DevGateContext";
import { GuestGateProvider } from "@/contexts/GuestGateContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { captureUTMParams } from "@/hooks/use-utm";

const queryClient = new QueryClient();

// Lazy load all pages
const AppShell = lazy(() => import("@/components/AppShell"));
// NOTE: LandingPage is no longer rendered on "/" — guests land directly on /home
// with a locked-down AppShell. Import kept removed to avoid dead-chunk loading.
const HomePage = lazy(() => import("@/pages/HomePage"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Discover = lazy(() => import("@/pages/Discover"));
const Community = lazy(() => import("@/pages/Community"));
const Chat = lazy(() => import("@/pages/Chat"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const PublicCoachProfile = lazy(() => import("@/pages/PublicCoachProfile"));
const Book = lazy(() => import("@/pages/Book"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const MySchedule = lazy(() => import("@/pages/MySchedule"));
const LiveSessions = lazy(() => import("@/pages/LiveSessions"));
const CoachDashboard = lazy(() => import("@/pages/CoachDashboard"));
const CoachOnboarding = lazy(() => import("@/pages/CoachOnboarding"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const CreateContent = lazy(() => import("@/pages/CreateContent"));
const Plays = lazy(() => import("@/pages/Plays"));
const Reels = lazy(() => import("@/pages/Reels"));
const Following = lazy(() => import("@/pages/Following"));
const SavedCollections = lazy(() => import("@/pages/SavedCollections"));
const CircloPro = lazy(() => import("@/pages/CircloPro"));
const BobAI = lazy(() => import("@/pages/BobAI"));
const CoachCommunityPage = lazy(() => import("@/pages/CoachCommunityPage"));
const JoinGroup = lazy(() => import("@/pages/JoinGroup"));
const DataPrivacy = lazy(() => import("@/pages/DataPrivacy"));
const NotificationPreferences = lazy(() => import("@/pages/NotificationPreferences"));
const PaymentReturn = lazy(() => import("@/pages/PaymentReturn"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const CoachAgreement = lazy(() => import("@/pages/legal/CoachAgreement"));
const TraineeWaiver = lazy(() => import("@/pages/legal/TraineeWaiver"));
const CookiePolicy = lazy(() => import("@/pages/legal/CookiePolicy"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogArticle = lazy(() => import("@/pages/BlogArticle"));
const CaseStudies = lazy(() => import("@/pages/CaseStudies"));
const CaseStudyDetail = lazy(() => import("@/pages/CaseStudyDetail"));
const TrainingPlan = lazy(() => import("@/pages/TrainingPlan"));
const DevGateModal = lazy(() => import("@/components/DevGateModal"));

/* ---------- v2 routes (feature-flagged at /v2/*) ---------- */
const V2Guard = lazy(() => import("@/components/v2/V2Guard").then((m) => ({ default: m.V2Guard })));
const EnableV2 = lazy(() => import("@/pages/v2/EnableV2"));
const V2Stub = lazy(() => import("@/pages/v2/V2Stub"));
const V2Home = lazy(() => import("@/pages/v2/HomePage"));
const V2Discover = lazy(() => import("@/pages/v2/DiscoverPage"));
const V2CoachProfile = lazy(() => import("@/pages/v2/CoachProfilePage"));
const V2Tiers = lazy(() => import("@/pages/v2/TiersPage"));
const V2GoPro = lazy(() => import("@/pages/v2/GoProPage"));
const DevRoleSwitcher = lazy(() => import("@/components/DevRoleSwitcher"));
const OfflineBanner = lazy(() => import("@/components/OfflineBanner"));

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function UTMCapture() {
  useEffect(() => {
    captureUTMParams();
  }, []);
  return null;
}

const RouteWrapper = ({ children, routeName }: { children: React.ReactNode; routeName: string }) => (
  <RouteErrorBoundary routeName={routeName}>
    <Suspense fallback={<BrandLoader />}>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="h-full"
      >
        {children}
      </motion.div>
    </Suspense>
  </RouteErrorBoundary>
);

/**
 * ShellWrapper — identical to RouteWrapper but falls back to the full-screen
 * CircloSplash instead of the compact BrandLoader. Used only for the outer
 * AppShell layout route so the initial launch sequence stays visually
 * seamless: native splash → CircloSplash (auth) → CircloSplash (shell chunk)
 * → rendered shell. Inner pages keep the smaller BrandLoader so in-app
 * navigation doesn't feel like a relaunch.
 */
const ShellWrapper = ({ children, routeName }: { children: React.ReactNode; routeName: string }) => (
  <RouteErrorBoundary routeName={routeName}>
    <Suspense fallback={<CircloSplash />}>{children}</Suspense>
  </RouteErrorBoundary>
);

function RootRoute() {
  const { loading, user } = useAuth();
  // While Supabase is rehydrating the saved session, show the branded splash.
  if (loading) return <CircloSplash />;
  // Guests see the Stitch welcome screen. Authenticated users go to /home.
  if (!user) return <Welcome />;
  return <Navigate to="/home" replace />;
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <DataModeProvider>
              <DevGateProvider>
                <GuestGateProvider>
                <Router>
                  <UTMCapture />
                  <Routes>
                    {/* v2 routes — feature-flagged, no AppShell (pages render own chrome) */}
                    <Route path="/v2/enable" element={<RouteWrapper routeName="v2-enable"><EnableV2 /></RouteWrapper>} />
                    <Route path="/v2" element={<Navigate to="/v2/home" replace />} />
                    <Route path="/v2/home" element={<RouteWrapper routeName="v2-home"><V2Guard><V2Home /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/discover" element={<RouteWrapper routeName="v2-discover"><V2Guard><V2Discover /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id" element={<RouteWrapper routeName="v2-coach-about"><V2Guard><V2CoachProfile /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id/community" element={<RouteWrapper routeName="v2-coach-community"><V2Guard><V2CoachProfile /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id/content" element={<RouteWrapper routeName="v2-coach-content"><V2Guard><V2Stub title="Content Library" phase={12} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id/shop" element={<RouteWrapper routeName="v2-coach-shop"><V2Guard><V2CoachProfile /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id/join" element={<RouteWrapper routeName="v2-tiers"><V2Guard><V2Tiers /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/go-pro" element={<RouteWrapper routeName="v2-go-pro"><V2Guard><V2GoPro /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/bob" element={<RouteWrapper routeName="v2-bob"><V2Guard><V2Stub title="Bob" phase={7} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/bob/threads" element={<RouteWrapper routeName="v2-bob-threads"><V2Guard><V2Stub title="Bob · Threads" phase={7} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/bob/settings" element={<RouteWrapper routeName="v2-bob-settings"><V2Guard><V2Stub title="Bob · Settings" phase={7} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/bob/inbox" element={<RouteWrapper routeName="v2-bob-inbox"><V2Guard><V2Stub title="Bob · Inbox" phase={7} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/messages" element={<RouteWrapper routeName="v2-messages"><V2Guard><V2Stub title="Messages" phase={8} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/messages/new" element={<RouteWrapper routeName="v2-new-message"><V2Guard><V2Stub title="New message" phase={8} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/messages/:threadId" element={<RouteWrapper routeName="v2-chat"><V2Guard><V2Stub title="Chat" phase={8} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/calendar" element={<RouteWrapper routeName="v2-calendar"><V2Guard><V2Stub title="Calendar" phase={13} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/calendar/add-workout" element={<RouteWrapper routeName="v2-add-workout"><V2Guard><V2Stub title="Add workout" phase={13} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/calendar/:date" element={<RouteWrapper routeName="v2-day-detail"><V2Guard><V2Stub title="Day detail" phase={13} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/book/:coachId" element={<RouteWrapper routeName="v2-book"><V2Guard><V2Stub title="Book" phase={9} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/book/:bookingId/success" element={<RouteWrapper routeName="v2-book-success"><V2Guard><V2Stub title="Booking success" phase={9} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/profile" element={<RouteWrapper routeName="v2-profile"><V2Guard><V2Stub title="Profile" phase={10} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/profile/bookings" element={<RouteWrapper routeName="v2-my-bookings"><V2Guard><V2Stub title="My bookings" phase={10} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/profile/settings" element={<RouteWrapper routeName="v2-settings"><V2Guard><V2Stub title="Settings" phase={10} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/profile/payments" element={<RouteWrapper routeName="v2-payments"><V2Guard><V2Stub title="Payments" phase={10} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach-me" element={<RouteWrapper routeName="v2-coach-me"><V2Guard><V2Stub title="Coach dashboard" phase={11} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach-me/requests" element={<RouteWrapper routeName="v2-coach-requests"><V2Guard><V2Stub title="Coach · Requests" phase={11} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach-me/content" element={<RouteWrapper routeName="v2-coach-content"><V2Guard><V2Stub title="Coach · Content" phase={12} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/video/:videoId" element={<RouteWrapper routeName="v2-video"><V2Guard><V2Stub title="Video" phase={12} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/live/:sessionId" element={<RouteWrapper routeName="v2-live"><V2Guard><V2Stub title="Live" phase={12} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/live/:sessionId/ended" element={<RouteWrapper routeName="v2-live-ended"><V2Guard><V2Stub title="Live · Recap" phase={12} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/plans/:planId" element={<RouteWrapper routeName="v2-plan"><V2Guard><V2Stub title="Training plan" phase={13} /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/plans/:planId/subscribe" element={<RouteWrapper routeName="v2-plan-subscribe"><V2Guard><V2Stub title="Plan subscribe" phase={13} /></V2Guard></RouteWrapper>} />

                    {/* Auth pages — no AppShell */}
                    <Route path="/login" element={<RouteWrapper routeName="login"><Login /></RouteWrapper>} />
                    <Route path="/signup" element={<RouteWrapper routeName="signup"><Signup /></RouteWrapper>} />
                    <Route path="/forgot-password" element={<RouteWrapper routeName="forgot-password"><ForgotPassword /></RouteWrapper>} />
                    <Route path="/reset-password" element={<RouteWrapper routeName="reset-password"><ResetPassword /></RouteWrapper>} />

                    {/* Payment return landing */}
                    <Route path="/payment/return" element={<ProtectedRoute><RouteWrapper routeName="payment-return"><PaymentReturn /></RouteWrapper></ProtectedRoute>} />

                    {/* Coach onboarding — no AppShell, requires auth */}
                    <Route path="/coach-onboarding" element={<ProtectedRoute><RouteWrapper routeName="coach-onboarding"><CoachOnboarding /></RouteWrapper></ProtectedRoute>} />

                    {/* Landing page for guests — no AppShell */}
                    <Route path="/" element={<RootRoute />} />

                    {/* All other pages — wrapped in AppShell layout.
                        Uses ShellWrapper (full splash fallback) so the first
                        mount after auth resolution is visually continuous. */}
                    <Route element={<ShellWrapper routeName="app-shell"><AppShell /></ShellWrapper>}>
                      {/* Public routes */}
                      <Route path="/home" element={<RouteWrapper routeName="home"><HomePage /></RouteWrapper>} />
                      <Route path="/discover" element={<RouteWrapper routeName="discover"><Discover /></RouteWrapper>} />
                      <Route path="/coach/:id" element={<RouteWrapper routeName="public-coach-profile"><PublicCoachProfile /></RouteWrapper>} />
                      <Route path="/plays" element={<RouteWrapper routeName="plays"><Plays /></RouteWrapper>} />
                      <Route path="/reels" element={<RouteWrapper routeName="reels"><Reels /></RouteWrapper>} />
                      <Route path="/pro" element={<RouteWrapper routeName="circlo-pro"><CircloPro /></RouteWrapper>} />
                      <Route path="/blog" element={<RouteWrapper routeName="blog"><Blog /></RouteWrapper>} />
                      <Route path="/blog/:slug" element={<RouteWrapper routeName="blog-article"><BlogArticle /></RouteWrapper>} />
                      <Route path="/case-studies" element={<RouteWrapper routeName="case-studies"><CaseStudies /></RouteWrapper>} />
                      <Route path="/case-studies/:id" element={<RouteWrapper routeName="case-study-detail"><CaseStudyDetail /></RouteWrapper>} />

                      {/* Legal pages — public */}
                      <Route path="/legal/terms" element={<RouteWrapper routeName="legal-terms"><TermsOfService /></RouteWrapper>} />
                      <Route path="/legal/privacy" element={<RouteWrapper routeName="legal-privacy"><PrivacyPolicy /></RouteWrapper>} />
                      <Route path="/legal/coach-agreement" element={<RouteWrapper routeName="legal-coach-agreement"><CoachAgreement /></RouteWrapper>} />
                      <Route path="/legal/waiver" element={<RouteWrapper routeName="legal-waiver"><TraineeWaiver /></RouteWrapper>} />
                      <Route path="/legal/cookies" element={<RouteWrapper routeName="legal-cookies"><CookiePolicy /></RouteWrapper>} />

                      <Route path="*" element={<RouteWrapper routeName="not-found"><NotFound /></RouteWrapper>} />

                      {/* Protected routes */}
                      <Route path="/onboarding" element={<ProtectedRoute><RouteWrapper routeName="onboarding"><Onboarding /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/feed" element={<Navigate to="/plays?view=feed" replace />} />
                      <Route path="/community" element={<ProtectedRoute><RouteWrapper routeName="community"><Community /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/chat/:partnerId" element={<ProtectedRoute><RouteWrapper routeName="chat"><Chat /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/inbox" element={<ProtectedRoute><RouteWrapper routeName="inbox"><Inbox /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><RouteWrapper routeName="profile"><UserProfile /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/edit-profile" element={<ProtectedRoute><RouteWrapper routeName="edit-profile"><EditProfile /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/data-privacy" element={<ProtectedRoute><RouteWrapper routeName="data-privacy"><DataPrivacy /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/notification-preferences" element={<ProtectedRoute><RouteWrapper routeName="notification-preferences"><NotificationPreferences /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/book/:coachId?" element={<ProtectedRoute><RouteWrapper routeName="book"><Book /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/bookings" element={<ProtectedRoute><RouteWrapper routeName="bookings"><Bookings /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/my-schedule" element={<ProtectedRoute><RouteWrapper routeName="my-schedule"><MySchedule /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/schedule" element={<ProtectedRoute><RouteWrapper routeName="my-schedule"><MySchedule /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/live-sessions" element={<ProtectedRoute><RouteWrapper routeName="live-sessions"><LiveSessions /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/coach-dashboard" element={<ProtectedRoute><RouteWrapper routeName="coach-dashboard"><CoachDashboard /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/bob" element={<ProtectedRoute><RouteWrapper routeName="bob-ai"><BobAI /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/admin" element={<ProtectedRoute><RouteWrapper routeName="admin-dashboard"><AdminDashboard /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/create" element={<ProtectedRoute><RouteWrapper routeName="create-content"><CreateContent /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/following" element={<ProtectedRoute><RouteWrapper routeName="following"><Following /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/saved" element={<ProtectedRoute><RouteWrapper routeName="saved-collections"><SavedCollections /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/training-plan" element={<ProtectedRoute><RouteWrapper routeName="training-plan"><TrainingPlan /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/coach-community" element={<ProtectedRoute><RouteWrapper routeName="coach-community"><CoachCommunityPage /></RouteWrapper></ProtectedRoute>} />
                      <Route path="/join/:groupId" element={<ProtectedRoute><RouteWrapper routeName="join-group"><JoinGroup /></RouteWrapper></ProtectedRoute>} />
                    </Route>
                  </Routes>
                  <Toaster />
                  <SonnerToaster position="top-center" richColors />
                  <Suspense fallback={null}>
                    <OfflineBanner />
                    <DevGateModal />
                    <DevRoleSwitcher />
                  </Suspense>
                </Router>
                </GuestGateProvider>
              </DevGateProvider>
            </DataModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
