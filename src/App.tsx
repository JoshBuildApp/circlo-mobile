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
import { isV2Enabled } from "@/lib/v2/featureFlag";

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
const V2Bob = lazy(() => import("@/pages/v2/BobPage"));
const V2BobDrawer = lazy(() => import("@/pages/v2/BobDrawerPage"));
const V2BobSettings = lazy(() => import("@/pages/v2/BobSettingsPage"));
const V2BobInbox = lazy(() => import("@/pages/v2/BobInboxPage"));
const V2Messages = lazy(() => import("@/pages/v2/MessagesInboxPage"));
const V2Chat = lazy(() => import("@/pages/v2/ChatPage"));
const V2NewMessage = lazy(() => import("@/pages/v2/NewMessagePage"));
const V2Booking = lazy(() => import("@/pages/v2/BookingFlowPage"));
const V2BookLanding = lazy(() => import("@/pages/v2/BookLandingPage"));
const V2BookingSuccess = lazy(() => import("@/pages/v2/BookingSuccessPage"));
const V2UserProfile = lazy(() => import("@/pages/v2/UserProfileV2"));
const V2MyBookings = lazy(() => import("@/pages/v2/MyBookingsPage"));
const V2Settings = lazy(() => import("@/pages/v2/SettingsV2Page"));
const V2Payments = lazy(() => import("@/pages/v2/PaymentMethodsPage"));
const V2CoachSelf = lazy(() => import("@/pages/v2/CoachSelfPage"));
const V2CoachRequests = lazy(() => import("@/pages/v2/CoachRequestsPage"));
const V2Library = lazy(() => import("@/pages/v2/ContentLibraryPage"));
const V2VideoPlayer = lazy(() => import("@/pages/v2/VideoPlayerPage"));
const V2Live = lazy(() => import("@/pages/v2/LiveViewerPage"));
const V2LiveEnded = lazy(() => import("@/pages/v2/LiveEndedPage"));
const V2Calendar = lazy(() => import("@/pages/v2/CalendarPage"));
const V2DayDetail = lazy(() => import("@/pages/v2/DayDetailPage"));
const V2AddWorkout = lazy(() => import("@/pages/v2/AddWorkoutPage"));
const V2PlanDetail = lazy(() => import("@/pages/v2/TrainingPlanDetailPage"));
const V2PlanSubscribe = lazy(() => import("@/pages/v2/PlanSubscribeFlowPage"));
const V2Splash = lazy(() => import("@/pages/v2/SplashV2"));
const V2Welcome = lazy(() => import("@/pages/v2/WelcomeV2"));
const V2Login = lazy(() => import("@/pages/v2/LoginV2"));
const V2Signup = lazy(() => import("@/pages/v2/SignupV2"));
const V2ForgotPassword = lazy(() => import("@/pages/v2/ForgotPasswordV2"));
const V2EditProfile = lazy(() => import("@/pages/v2/EditProfileV2"));
const V2VerifyEmail = lazy(() => import("@/pages/v2/VerifyEmailV2"));
const V2PlayerOnboarding = lazy(() => import("@/pages/v2/PlayerOnboardingV2"));
const V2CoachOnboarding = lazy(() => import("@/pages/v2/CoachOnboardingV2"));
/* v2 auth flow — new shared-element onboarding under /v2/auth/* */
const V2AuthLayout = lazy(() => import("@/pages/v2/auth/AuthLayout"));
const V2AuthWelcome = lazy(() => import("@/pages/v2/auth/Welcome"));
const V2AuthLogin = lazy(() => import("@/pages/v2/auth/Login"));
const V2AuthSignupOutlet = lazy(() => import("@/pages/v2/auth/SignupOutlet").then((m) => ({ default: m.SignupOutlet })));
const V2AuthRole = lazy(() => import("@/pages/v2/auth/signup/Role"));
const V2AuthSports = lazy(() => import("@/pages/v2/auth/signup/Sports"));
const V2AuthCredentials = lazy(() => import("@/pages/v2/auth/signup/Credentials"));
const V2AuthVerify = lazy(() => import("@/pages/v2/auth/signup/Verify"));
const V2AuthSuccess = lazy(() => import("@/pages/v2/auth/signup/Success"));
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
  // Builds with VITE_V2_FORCE=true (or with the localStorage flag set) land
  // on the v2 splash, which then routes to /v2/home or /v2/login.
  if (isV2Enabled()) return <Navigate to="/v2/splash" replace />;
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
                    {/* v2 auth flow — shared-element ring onboarding under /v2/auth/* */}
                    <Route path="/v2/auth" element={<RouteWrapper routeName="v2-auth-layout"><V2Guard><V2AuthLayout /></V2Guard></RouteWrapper>}>
                      <Route index element={<Navigate to="welcome" replace />} />
                      <Route path="welcome" element={<RouteWrapper routeName="v2-auth-welcome"><V2AuthWelcome /></RouteWrapper>} />
                      <Route path="login" element={<RouteWrapper routeName="v2-auth-login"><V2AuthLogin /></RouteWrapper>} />
                      <Route path="signup" element={<V2AuthSignupOutlet />}>
                        <Route index element={<Navigate to="role" replace />} />
                        <Route path="role" element={<RouteWrapper routeName="v2-auth-signup-role"><V2AuthRole /></RouteWrapper>} />
                        <Route path="sports" element={<RouteWrapper routeName="v2-auth-signup-sports"><V2AuthSports /></RouteWrapper>} />
                        <Route path="credentials" element={<RouteWrapper routeName="v2-auth-signup-credentials"><V2AuthCredentials /></RouteWrapper>} />
                        <Route path="verify" element={<RouteWrapper routeName="v2-auth-signup-verify"><V2AuthVerify /></RouteWrapper>} />
                        <Route path="success" element={<RouteWrapper routeName="v2-auth-signup-success"><V2AuthSuccess /></RouteWrapper>} />
                      </Route>
                    </Route>
                    <Route path="/v2/splash" element={<RouteWrapper routeName="v2-splash"><V2Guard><V2Splash /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/welcome" element={<RouteWrapper routeName="v2-welcome"><V2Guard><V2Welcome /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/login" element={<RouteWrapper routeName="v2-login"><V2Guard><V2Login /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/signup" element={<RouteWrapper routeName="v2-signup"><V2Guard><V2Signup /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/forgot-password" element={<RouteWrapper routeName="v2-forgot-password"><V2Guard><V2ForgotPassword /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/verify-email" element={<RouteWrapper routeName="v2-verify-email"><V2Guard><V2VerifyEmail /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/onboarding" element={<RouteWrapper routeName="v2-onboarding"><V2Guard><V2PlayerOnboarding /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach-onboarding" element={<RouteWrapper routeName="v2-coach-onboarding"><V2Guard><V2CoachOnboarding /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/profile/edit" element={<RouteWrapper routeName="v2-edit-profile"><V2Guard><V2EditProfile /></V2Guard></RouteWrapper>} />
                    <Route path="/v2" element={<Navigate to="/v2/splash" replace />} />
                    <Route path="/v2/home" element={<RouteWrapper routeName="v2-home"><V2Guard><V2Home /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/discover" element={<RouteWrapper routeName="v2-discover"><V2Guard><V2Discover /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id" element={<RouteWrapper routeName="v2-coach-about"><V2Guard><V2CoachProfile /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id/community" element={<RouteWrapper routeName="v2-coach-community"><V2Guard><V2CoachProfile /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id/content" element={<RouteWrapper routeName="v2-coach-content"><V2Guard><V2Library /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id/shop" element={<RouteWrapper routeName="v2-coach-shop"><V2Guard><V2CoachProfile /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach/:id/join" element={<RouteWrapper routeName="v2-tiers"><V2Guard><V2Tiers /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/go-pro" element={<RouteWrapper routeName="v2-go-pro"><V2Guard><V2GoPro /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/bob" element={<RouteWrapper routeName="v2-bob"><V2Guard><V2Bob /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/bob/threads" element={<RouteWrapper routeName="v2-bob-threads"><V2Guard><V2BobDrawer /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/bob/settings" element={<RouteWrapper routeName="v2-bob-settings"><V2Guard><V2BobSettings /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/bob/inbox" element={<RouteWrapper routeName="v2-bob-inbox"><V2Guard><V2BobInbox /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/messages" element={<RouteWrapper routeName="v2-messages"><V2Guard><V2Messages /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/messages/new" element={<RouteWrapper routeName="v2-new-message"><V2Guard><V2NewMessage /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/messages/:threadId" element={<RouteWrapper routeName="v2-chat"><V2Guard><V2Chat /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/calendar" element={<RouteWrapper routeName="v2-calendar"><V2Guard><V2Calendar /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/calendar/add-workout" element={<RouteWrapper routeName="v2-add-workout"><V2Guard><V2AddWorkout /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/calendar/:date" element={<RouteWrapper routeName="v2-day-detail"><V2Guard><V2DayDetail /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/book" element={<RouteWrapper routeName="v2-book-landing"><V2Guard><V2BookLanding /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/book/:coachId" element={<RouteWrapper routeName="v2-book"><V2Guard><V2Booking /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/book/:bookingId/success" element={<RouteWrapper routeName="v2-book-success"><V2Guard><V2BookingSuccess /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/profile" element={<RouteWrapper routeName="v2-profile"><V2Guard><V2UserProfile /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/profile/bookings" element={<RouteWrapper routeName="v2-my-bookings"><V2Guard><V2MyBookings /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/profile/settings" element={<RouteWrapper routeName="v2-settings"><V2Guard><V2Settings /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/profile/payments" element={<RouteWrapper routeName="v2-payments"><V2Guard><V2Payments /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach-me" element={<RouteWrapper routeName="v2-coach-me"><V2Guard><V2CoachSelf /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach-me/requests" element={<RouteWrapper routeName="v2-coach-requests"><V2Guard><V2CoachRequests /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/coach-me/content" element={<RouteWrapper routeName="v2-coach-content"><V2Guard><V2Library /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/video/:videoId" element={<RouteWrapper routeName="v2-video"><V2Guard><V2VideoPlayer /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/live/:sessionId" element={<RouteWrapper routeName="v2-live"><V2Guard><V2Live /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/live/:sessionId/ended" element={<RouteWrapper routeName="v2-live-ended"><V2Guard><V2LiveEnded /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/plans/:planId" element={<RouteWrapper routeName="v2-plan"><V2Guard><V2PlanDetail /></V2Guard></RouteWrapper>} />
                    <Route path="/v2/plans/:planId/subscribe" element={<RouteWrapper routeName="v2-plan-subscribe"><V2Guard><V2PlanSubscribe /></V2Guard></RouteWrapper>} />

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
                  <SonnerToaster
                    position="bottom-center"
                    richColors
                    closeButton
                    expand={false}
                    offset={96}
                    toastOptions={{
                      classNames: {
                        toast: "font-sans",
                      },
                    }}
                  />
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
