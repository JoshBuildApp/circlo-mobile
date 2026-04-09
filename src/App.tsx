import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { lazy, Suspense } from "react";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import BrandLoader from "@/components/BrandLoader";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataModeProvider } from "@/contexts/DataModeContext";
import { DevGateProvider } from "@/contexts/DevGateContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

// Lazy load all pages
const AppShell = lazy(() => import("@/components/AppShell"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Feed = lazy(() => import("@/pages/Feed"));
const Discover = lazy(() => import("@/pages/Discover"));
const Community = lazy(() => import("@/pages/Community"));
const Chat = lazy(() => import("@/pages/Chat"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const CoachProfile = lazy(() => import("@/pages/CoachProfile"));
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
const NotFound = lazy(() => import("@/pages/NotFound"));
const DevGateModal = lazy(() => import("@/components/DevGateModal"));
const DevRoleSwitcher = lazy(() => import("@/components/DevRoleSwitcher"));

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const RouteWrapper = ({ children, routeName }: { children: React.ReactNode, routeName: string }) => (
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

/** Show LandingPage for guests, redirect logged-in users to /home */
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <BrandLoader />;
  if (user) return <Navigate to="/home" replace />;
  return <RouteWrapper routeName="landing"><LandingPage /></RouteWrapper>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DataModeProvider>
            <DevGateProvider>
              <Router>
                <Routes>
                  {/* Auth pages — no AppShell */}
                  <Route path="/login" element={<RouteWrapper routeName="login"><Login /></RouteWrapper>} />
                  <Route path="/signup" element={<RouteWrapper routeName="signup"><Signup /></RouteWrapper>} />
                  <Route path="/forgot-password" element={<RouteWrapper routeName="forgot-password"><ForgotPassword /></RouteWrapper>} />
                  <Route path="/reset-password" element={<RouteWrapper routeName="reset-password"><ResetPassword /></RouteWrapper>} />

                  {/* Coach onboarding — no AppShell, requires auth */}
                  <Route path="/coach-onboarding" element={<ProtectedRoute><RouteWrapper routeName="coach-onboarding"><CoachOnboarding /></RouteWrapper></ProtectedRoute>} />

                  {/* Landing page for guests — no AppShell */}
                  <Route path="/" element={<RootRoute />} />

                  {/* All other pages — wrapped in AppShell layout */}
                  <Route element={<RouteWrapper routeName="app-shell"><AppShell /></RouteWrapper>}>
                    {/* Public routes — no auth required */}
                    <Route path="/home" element={<RouteWrapper routeName="home"><HomePage /></RouteWrapper>} />
                    <Route path="/discover" element={<RouteWrapper routeName="discover"><Discover /></RouteWrapper>} />
                    <Route path="/coach/:id" element={<RouteWrapper routeName="public-coach-profile"><PublicCoachProfile /></RouteWrapper>} />
                    <Route path="/plays" element={<RouteWrapper routeName="plays"><Plays /></RouteWrapper>} />
                    <Route path="/reels" element={<RouteWrapper routeName="reels"><Reels /></RouteWrapper>} />
                    <Route path="/pro" element={<RouteWrapper routeName="circlo-pro"><CircloPro /></RouteWrapper>} />
                    <Route path="*" element={<RouteWrapper routeName="not-found"><NotFound /></RouteWrapper>} />

                    {/* Protected routes — require auth */}
                    <Route path="/onboarding" element={<ProtectedRoute><RouteWrapper routeName="onboarding"><Onboarding /></RouteWrapper></ProtectedRoute>} />
                    <Route path="/feed" element={<ProtectedRoute><RouteWrapper routeName="feed"><Feed /></RouteWrapper></ProtectedRoute>} />
                    <Route path="/community" element={<ProtectedRoute><RouteWrapper routeName="community"><Community /></RouteWrapper></ProtectedRoute>} />
                    <Route path="/chat/:partnerId" element={<ProtectedRoute><RouteWrapper routeName="chat"><Chat /></RouteWrapper></ProtectedRoute>} />
                    <Route path="/inbox" element={<ProtectedRoute><RouteWrapper routeName="inbox"><Inbox /></RouteWrapper></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><RouteWrapper routeName="profile"><UserProfile /></RouteWrapper></ProtectedRoute>} />
                    <Route path="/edit-profile" element={<ProtectedRoute><RouteWrapper routeName="edit-profile"><EditProfile /></RouteWrapper></ProtectedRoute>} />
                    <Route path="/data-privacy" element={<ProtectedRoute><RouteWrapper routeName="data-privacy"><DataPrivacy /></RouteWrapper></ProtectedRoute>} />
                    <Route path="/coach-profile/:id" element={<ProtectedRoute><RouteWrapper routeName="coach-profile"><CoachProfile /></RouteWrapper></ProtectedRoute>} />
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
                    <Route path="/coach-community" element={<ProtectedRoute><RouteWrapper routeName="coach-community"><CoachCommunityPage /></RouteWrapper></ProtectedRoute>} />
                    <Route path="/join/:groupId" element={<ProtectedRoute><RouteWrapper routeName="join-group"><JoinGroup /></RouteWrapper></ProtectedRoute>} />
                  </Route>
                </Routes>
                <Toaster />
                <SonnerToaster position="top-center" richColors />
                <Suspense fallback={null}>
                  <DevGateModal />
                  <DevRoleSwitcher />
                </Suspense>
              </Router>
            </DevGateProvider>
          </DataModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
