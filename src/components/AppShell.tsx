import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatedOutlet } from "@/components/AnimatedOutlet";
import { openExternal } from "@/lib/platform";
import {
  Home, Search, CalendarDays, User, MessageSquare, Users, Play, Plus,
  UserPlus, Shield, Video, ArrowLeft, Palette, Bell, Zap, ChevronDown,
  LogOut, Settings, Bookmark, Menu, X, LayoutDashboard, Compass,
  Clock, Crown, Dumbbell, Trophy, Rocket,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import CircloLogo from "@/components/CircloLogo";
import { CoachSearchAutocomplete } from "@/components/CoachSearchAutocomplete";
import { useMobile } from "@/hooks/use-mobile";
import { useUnreadCount } from "@/hooks/use-unread-count";
import DevModeToggle from "@/components/DevModeToggle";
import { useActivity } from "@/hooks/use-activity";
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { CoachAvatar } from "@/components/ui/coach-avatar";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const NewContentCreator = lazy(() => import("@/components/NewContentCreator"));
const InviteModal = lazy(() => import("@/components/InviteModal"));
const PostSessionReviewPrompt = lazy(() => import("@/components/PostSessionReviewPrompt"));
const GuestAuthSheet = lazy(() => import("@/components/GuestAuthSheet"));
const PWAInstallPrompt = lazy(() =>
  import("@/components/PWAInstallPrompt").then((m) => ({ default: m.PWAInstallPrompt }))
);

const coachTabs = [
  { path: "/home", labelKey: "nav.home", icon: Home },
  { path: "/discover", labelKey: "nav.discover", icon: Search },
  { path: "/book", labelKey: "nav.book", icon: Zap, isCenter: true },
  { path: "/schedule", labelKey: "nav.schedule", icon: CalendarDays },
  { path: "/profile", labelKey: "nav.profile", icon: User },
];

const playerTabs = [
  { path: "/home", labelKey: "nav.home", icon: Home },
  { path: "/discover", labelKey: "nav.discover", icon: Search },
  { path: "/book", labelKey: "nav.book", icon: Zap, isCenter: true },
  { path: "/schedule", labelKey: "nav.bookings", icon: CalendarDays },
  { path: "/profile", labelKey: "nav.profile", icon: User },
];

// Sidebar navigation items
const sidebarItems = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/discover", label: "Discover", icon: Compass },
  { path: "/inbox", label: "Inbox", icon: MessageSquare },
  { path: "/book", label: "Book", icon: Zap },
  { path: "/plays", label: "Plays", icon: Play },
  { path: "/schedule", label: "Schedule", icon: CalendarDays },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/saved", label: "Saved", icon: Bookmark },
];

// Desktop nav links (center)
const desktopLinks = [
  { path: "/home", labelKey: "nav.home" },
  { path: "/discover", labelKey: "nav.discover" },
  { path: "/book", labelKey: "nav.book" },
  { path: "/community", labelKey: "nav.community" },
  { path: "/plays", labelKey: "nav.plays" },
];

const TAB_PATHS = ["/home", "/discover", "/plays", "/schedule", "/profile", "/community", "/book"];

// Agent control dashboard (OpenClaw / Circlo Hub) — opened from the dev panel
// entry in the top nav. Dev-only; regular users never see the trigger.
const AGENT_DASHBOARD_URL = "https://circlo-agent-core.lovable.app";

const AppShell = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, isDeveloper, signOut } = useAuth();
  // Dev panel visibility — replaces the old 5-logo-taps reveal. Directly
  // toggled by a visible "Rocket" button in the top nav for developers.
  const [showDevMenu, setShowDevMenu] = useState(false);
  useActivity();
  usePresenceHeartbeat();
  const isCoach = role === "coach" || isAdmin;
  const tabs = isCoach ? coachTabs : playerTabs;
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<string | undefined>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const isMobile = useMobile();
  const unreadCount = useUnreadCount();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Start expanded on desktop (md+), collapsed on tablet
    if (typeof window !== "undefined") return window.innerWidth < 1024;
    return true;
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [topBarCollapsed, setTopBarCollapsed] = useState(false);
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(() =>
    localStorage.getItem("notif-banner-dismissed") === "1"
  );
  const { isSupported: pushSupported, permission: pushPermission, subscribe: subscribePush } = usePushNotifications();

  // Auto-subscribe when user is authenticated and permission already granted
  useEffect(() => {
    if (user && pushSupported && pushPermission === "granted") {
      subscribePush();
    }
  }, [user, pushSupported, pushPermission, subscribePush]);

  const handleEnableNotifications = async () => {
    await subscribePush();
    setNotifBannerDismissed(true);
    localStorage.setItem("notif-banner-dismissed", "1");
  };

  const handleDismissBanner = () => {
    setNotifBannerDismissed(true);
    localStorage.setItem("notif-banner-dismissed", "1");
  };

  const navDepth = useRef(0);
  useEffect(() => {
    navDepth.current += 1;
    document.body.style.overflow = "";
    // Reset scroll of the route container on path change so a new page starts at the top.
    // Delay one frame so AnimatedOutlet's enter transition isn't fighting us.
    const raf = requestAnimationFrame(() => {
      const scroller = document.querySelector<HTMLElement>("[data-route-scroll]");
      if (scroller) scroller.scrollTop = 0;
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  const isTabRoute = TAB_PATHS.some(p => p === pathname);
  const showBack = !isTabRoute;

  const handleBack = () => {
    if (navDepth.current > 1) navigate(-1);
    else navigate("/home");
  };

  useEffect(() => {
    const openCreator = () => setCreateOpen(true);
    const openCreatorWithType = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setCreateInitialType(detail);
      setCreateOpen(true);
    };
    const openInvite = () => setInviteOpen(true);
    window.addEventListener("open-upload-flow", openCreator);
    window.addEventListener("open-create-sheet", openCreator);
    window.addEventListener("open-create-content", openCreatorWithType);
    window.addEventListener("open-invite-modal", openInvite);
    return () => {
      window.removeEventListener("open-upload-flow", openCreator);
      window.removeEventListener("open-create-sheet", openCreator);
      window.removeEventListener("open-create-content", openCreatorWithType);
      window.removeEventListener("open-invite-modal", openInvite);
    };
  }, []);

  const hideChrome = ["/login", "/signup", "/forgot-password", "/reset-password"].some((p) =>
    pathname.startsWith(p)
  );
  const isImmersive = pathname === "/reels" || pathname === "/plays";
  const isChat = pathname.startsWith("/chat/");

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(path);
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-background select-none touch-action-pan-y overflow-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Skip to main content — WCAG 2.1 AA */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-agent-teal focus:text-white focus:rounded-lg focus:outline-none"
      >
        {t("nav.skipToContent")}
      </a>

      {/* ═══ TOP BAR — slim utility bar (logo + search + user) ═══ */}
      {!hideChrome && !isImmersive && !isChat && (
        <AnimatePresence initial={false}>
          {!topBarCollapsed && (
            <motion.header
              key="topbar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="app-top-nav sticky top-0 z-50 w-full bg-card/80 backdrop-blur-2xl border-b border-border/20 overflow-hidden shrink-0"
            >
              {/* Brand accent line */}
              <div className="h-[2px] bg-brand-gradient w-full" />
              <div className="flex h-12 w-full items-center justify-between gap-4 px-4 md:px-6">

                {/* LEFT — sidebar toggle + logo + back */}
                <div className="flex shrink-0 items-center gap-2">
                  {/* Mobile hamburger */}
                  {!showBack && (
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="md:hidden h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 active:scale-90 transition-all"
                      aria-label={t("nav.openMenu")}
                    >
                      <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
                    </button>
                  )}
                  {/* Desktop: sidebar collapse toggle */}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="hidden md:flex h-8 w-8 -ml-1 rounded-full items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/5 active:scale-90 transition-all"
                    aria-label={t("nav.toggleSidebar")}
                  >
                    <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
                  </button>
                  {showBack && (
                    <button
                      onClick={handleBack}
                      className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 active:scale-90 transition-all"
                      aria-label={t("common.back")}
                    >
                      <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
                    </button>
                  )}
                  <Link to="/home" className="flex shrink-0 items-center gap-2 group min-w-0">
                    <CircloLogo variant="icon" size="md" theme="light" className="md:hidden transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-95" />
                    <CircloLogo variant="full" size="md" theme="light" className="hidden md:block transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-95" />
                  </Link>
                  <div className="hidden md:block">
                    <DevModeToggle />
                  </div>
                  {/* Dev panel opener — visible only to developers, replaces
                      the legacy "tap logo 5 times" reveal with a clearly
                      discoverable entry point into the Agent Dashboard.
                      Shows on every breakpoint so the launcher is always one
                      tap away. */}
                  {isDeveloper && (
                    <button
                      onClick={() => setShowDevMenu(true)}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-accent hover:bg-accent/10 active:scale-90 transition-all"
                      aria-label="Open developer panel"
                      title="Developer panel"
                    >
                      <Rocket className="h-[17px] w-[17px]" strokeWidth={2} />
                    </button>
                  )}
                </div>

                {/* CENTER — Search (desktop only) */}
                <div className="hidden md:flex flex-1 max-w-sm mx-4">
                  <CoachSearchAutocomplete
                    placeholder={t("nav.searchCoachesPlaceholder")}
                    compact
                    onSearchSubmit={(q) => navigate(`/discover?q=${encodeURIComponent(q)}`)}
                  />
                </div>

                {/* RIGHT — actions */}
                <div className="flex shrink-0 items-center gap-1">
                  {/* Mobile search toggle */}
                  <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="md:hidden h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
                    aria-label={t("common.search")}
                  >
                    {searchOpen ? <X className="h-[17px] w-[17px]" strokeWidth={1.8} /> : <Search className="h-[17px] w-[17px]" strokeWidth={1.8} />}
                  </button>

                  {/* Language switcher */}
                  <LanguageSwitcher />

                  {/* Collapse top bar (desktop) */}
                  <button
                    onClick={() => setTopBarCollapsed(true)}
                    className="hidden md:flex h-8 w-8 rounded-full items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all"
                    aria-label={t("nav.collapseTopBar")}
                    title={t("nav.collapseTopBar")}
                  >
                    <ChevronDown className="h-4 w-4" strokeWidth={1.8} />
                  </button>

                  {user && (
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="hidden md:flex h-8 items-center gap-1.5 px-3 rounded-full text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.2} />
                      <span className="hidden lg:inline text-sm">{t("nav.create")}</span>
                    </button>
                  )}

                  {/* Inbox — logged-in users only. Guests see no messaging affordance. */}
                  {user && (
                    <Link
                      to="/inbox"
                      className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all relative"
                      aria-label={t("nav.inbox")}
                    >
                      <MessageSquare className="h-[17px] w-[17px]" strokeWidth={1.8} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1 ring-2 ring-background">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* User avatar dropdown */}
                  {user ? (
                    <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                      <PopoverTrigger asChild>
                        <button aria-label={t("nav.userMenu")} className="flex items-center gap-1.5 ml-0.5 h-8 pl-1 pr-1.5 rounded-full hover:bg-foreground/5 transition-all">
                          <CoachAvatar src={profile?.avatar_url} name={profile?.username} size="xs" className="ring-[1.5px] ring-border/50" />
                          <ChevronDown className="h-3 w-3 text-muted-foreground/60 hidden md:block" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-1.5 rounded-2xl border-border/20 shadow-xl" align="end" sideOffset={8}>
                        <div className="px-3 py-2.5 border-b border-border/20 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{profile?.username || t("common.user")}</p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                        </div>
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/5 transition-colors">
                          <User className="h-4 w-4 text-muted-foreground/60" /> {t("nav.profile")}
                        </Link>
                        <Link to="/schedule" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/5 transition-colors">
                          <CalendarDays className="h-4 w-4 text-muted-foreground/60" /> {t("nav.mySchedule")}
                        </Link>
                        <Link to="/saved" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/5 transition-colors">
                          <Bookmark className="h-4 w-4 text-muted-foreground/60" /> {t("nav.saved")}
                        </Link>
                        <button
                          onClick={() => { setInviteOpen(true); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/5 transition-colors"
                        >
                          <UserPlus className="h-4 w-4 text-muted-foreground/60" /> {t("nav.inviteCoach")}
                        </button>
                        <div className="border-t border-border/20 mt-1 pt-1 px-3 py-2">
                          <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Palette className="h-3.5 w-3.5" /> {t("nav.appearance")}
                          </p>
                          <ThemeSwitcher layout="grid" />
                        </div>
                        <div className="border-t border-border/20 mt-1 pt-1">
                          <button
                            onClick={() => { signOut(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-destructive hover:bg-destructive/5 transition-colors"
                          >
                            <LogOut className="h-4 w-4" /> {t("nav.signOut")}
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <>
                      {/* Desktop: full log-in + sign-up buttons */}
                      <div className="hidden md:flex items-center gap-2 ml-1">
                        <Link to="/login" className="flex items-center h-8 px-3 rounded-full text-[13px] font-medium text-muted-foreground hover:text-foreground transition-all">
                          {t("nav.logIn")}
                        </Link>
                        <Link to="/signup" className="flex items-center h-8 px-4 rounded-full bg-brand-gradient text-white text-[13px] font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-primary/20">
                          {t("nav.signUp")}
                        </Link>
                      </div>
                      {/* Mobile: compact gradient "Log in" pill — the only nav affordance a guest sees */}
                      <Link
                        to="/login"
                        className="md:hidden flex items-center h-8 px-3 rounded-full bg-brand-gradient text-white text-[12px] font-semibold shadow-sm shadow-primary/20 active:scale-95 transition-all ml-1"
                        aria-label={t("nav.logIn")}
                      >
                        {t("nav.logIn")}
                      </Link>
                    </>
                  )}

                  {/* Create/Invite are reachable from the user menu on mobile — kept off the top bar to save space. */}
                  {user && (
                    <button onClick={() => setInviteOpen(true)} className="hidden h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all" aria-label={t("nav.inviteCoach")}>
                      <UserPlus className="h-[17px] w-[17px]" strokeWidth={1.8} />
                    </button>
                  )}
                  {user && (
                    <button onClick={() => setCreateOpen(true)} className="hidden h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all" aria-label={t("nav.create")}>
                      <Plus className="h-[17px] w-[17px]" strokeWidth={2.2} />
                    </button>
                  )}
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>
      )}

      {/* Collapsed top bar restore button (desktop only) */}
      {!hideChrome && !isImmersive && !isChat && topBarCollapsed && (
        <button
          onClick={() => setTopBarCollapsed(false)}
          className="hidden md:flex fixed top-2 left-1/2 -translate-x-1/2 z-50 items-center gap-1.5 h-7 px-3 rounded-full bg-card/90 backdrop-blur border border-border/30 shadow-sm text-[12px] text-muted-foreground hover:text-foreground transition-all"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-180" strokeWidth={1.8} />
          {t("nav.showBar")}
        </button>
      )}

      {/* Mobile search dropdown */}
      <AnimatePresence>
        {searchOpen && !hideChrome && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden sticky top-16 z-40 bg-card/95 backdrop-blur-xl border-b border-border/15 overflow-hidden"
          >
            <div className="px-4 py-3">
              <CoachSearchAutocomplete
                placeholder={t("nav.searchCoachesSportsPlaceholder")}
                compact
                onSearchSubmit={(q) => {
                  navigate(`/discover?q=${encodeURIComponent(q)}`);
                  setSearchOpen(false);
                }}
                onCoachSelect={(id) => {
                  navigate(`/coach/${id}`);
                  setSearchOpen(false);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Push notification permission banner — full-width, above sidebar+content */}
      {user && pushSupported && pushPermission === "default" && !notifBannerDismissed && (
        <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between gap-3 text-sm shrink-0">
          <div className="flex items-center gap-2 text-foreground/80">
            <Bell className="h-4 w-4 text-primary shrink-0" />
            <span>{t("nav.notifBanner")}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnableNotifications}
              className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors active:scale-95"
            >
              {t("nav.enable")}
            </button>
            <button
              onClick={handleDismissBanner}
              className="h-6 w-6 flex items-center justify-center rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
              aria-label={t("nav.dismiss")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar + Main content */}
      <div className="flex flex-1 w-full min-w-0 overflow-hidden h-0">
        {/* ═══ DESKTOP SIDEBAR (md+) ═══ */}
        {!hideChrome && !isImmersive && !isChat && (
          <motion.aside
            animate={{ width: sidebarCollapsed ? 64 : 260 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="hidden md:flex flex-col flex-shrink-0 bg-card border-r border-border/30 overflow-hidden h-full"
          >
            {/* User info */}
            {user && (
              <div className={cn("flex items-center gap-3 px-3 py-4 border-b border-border/15", sidebarCollapsed && "justify-center")}>
                <CoachAvatar src={profile?.avatar_url} name={profile?.username} size="sm" className="ring-2 ring-primary/20 shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm font-semibold text-foreground truncate mb-1">{profile?.username || t("common.user")}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Nav items — logged-in users only. Guests see a single Log in / Sign up CTA. */}
            <nav aria-label={t("nav.openMenu")} className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
              {!user ? (
                <div className={cn("flex flex-col gap-2", sidebarCollapsed ? "items-center px-0" : "px-1 pt-2")}>
                  <Link
                    to="/login"
                    title={sidebarCollapsed ? t("nav.logIn") : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-sm shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all",
                      sidebarCollapsed ? "h-10 w-10 justify-center p-0" : "px-3 py-3"
                    )}
                  >
                    <User className="h-5 w-5 shrink-0" strokeWidth={2} />
                    {!sidebarCollapsed && <span className="truncate">{t("nav.logIn")}</span>}
                  </Link>
                  {!sidebarCollapsed && (
                    <Link
                      to="/signup"
                      className="flex items-center gap-3 rounded-xl border border-border/40 px-3 py-3 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
                    >
                      <UserPlus className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
                      <span className="truncate">{t("nav.signUp")}</span>
                    </Link>
                  )}
                </div>
              ) : (
                sidebarItems.map(({ path, label, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                      active
                        ? "bg-primary/10 text-primary font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} strokeWidth={active ? 2.2 : 1.5} />
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="truncate"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {active && <div className="absolute left-0 w-[3px] h-5 rounded-r-full bg-primary" />}
                  </Link>
                );
              })
              )}

              {/* Role-specific items */}
              {user && (role === "coach" || isAdmin) && (
                <Link
                  to="/coach-dashboard"
                  aria-label={t("nav.dashboard")}
                  aria-current={isActive("/coach-dashboard") ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive("/coach-dashboard")
                      ? "bg-primary/10 text-primary font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                  title={sidebarCollapsed ? t("nav.dashboard") : undefined}
                >
                  <LayoutDashboard className="h-5 w-5 shrink-0" strokeWidth={isActive("/coach-dashboard") ? 2.2 : 1.5} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="truncate">
                        {t("nav.dashboard")}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}

              {user && isAdmin && (
                <Link
                  to="/admin"
                  aria-label={t("nav.admin")}
                  aria-current={isActive("/admin") ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive("/admin")
                      ? "bg-primary/10 text-primary font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                  title={sidebarCollapsed ? t("nav.admin") : undefined}
                >
                  <Shield className="h-5 w-5 shrink-0" strokeWidth={isActive("/admin") ? 2.2 : 1.5} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="truncate">
                        {t("nav.admin")}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}

            </nav>

            {/* Collapse toggle + Settings (logged-in only) at bottom */}
            <div className="px-2 py-4 border-t border-border/15 space-y-0.5">
              {user && (
                <Link
                  to="/edit-profile"
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                  title={sidebarCollapsed ? t("nav.settings") : undefined}
                >
                  <Settings className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="truncate">
                        {t("nav.settings")}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200",
                  sidebarCollapsed && "justify-center px-0"
                )}
                title={sidebarCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
                aria-label={sidebarCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
              >
                <motion.div
                  animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown className="h-5 w-5 shrink-0 -rotate-90" strokeWidth={1.5} />
                </motion.div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="truncate">
                      {t("nav.collapse")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.aside>
        )}

        {/* Main content */}
        <main
          id="main-content"
          data-route-scroll
          className={cn(
            "flex-1 w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto",
            isImmersive ? "overflow-hidden" : "",
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}>

          <AnimatedOutlet
            className={cn(
              "min-w-0",
              isImmersive ? "h-full max-w-none" : "min-h-full w-full px-0 md:px-4 lg:px-6",
            )}
          />
          {/* Footer inside scroll area so it appears at the bottom of content */}
          {!hideChrome && !isImmersive && !isChat && <Footer />}
        </main>
      </div>

      {/* Content Creator + Invite modals */}
      <Suspense fallback={null}>
        {createOpen && <NewContentCreator open={createOpen} onClose={() => { setCreateOpen(false); setCreateInitialType(undefined); }} initialType={createInitialType} />}
        {inviteOpen && <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />}
      </Suspense>

      {/* ═══ MOBILE BOTTOM TABS (< md) — guest mode shows a single Log in / Sign up bar ═══ */}
      {!hideChrome && !isChat && !isImmersive && !user && (
        <nav role="navigation" aria-label="Authentication" className="app-bottom-nav fixed bottom-0 left-0 right-0 z-[9999] border-t safe-area-bottom glass border-border/20 shadow-nav md:hidden">
          <div className="flex items-center gap-2 h-[56px] max-w-lg mx-auto px-3">
            <Link
              to="/login"
              className="flex-1 h-10 flex items-center justify-center rounded-full border border-border/40 text-sm font-semibold text-foreground hover:bg-foreground/5 active:scale-[0.98] transition-all"
            >
              {t("nav.logIn")}
            </Link>
            <Link
              to="/signup"
              className="flex-1 h-10 flex items-center justify-center rounded-full bg-brand-gradient text-white text-sm font-semibold shadow-sm shadow-primary/20 active:scale-[0.98] transition-all"
            >
              {t("nav.signUp")}
            </Link>
          </div>
        </nav>
      )}
      {!hideChrome && !isChat && !isImmersive && user && (
        <nav role="navigation" aria-label="Main navigation" className="app-bottom-nav fixed bottom-0 left-0 right-0 z-[9999] border-t safe-area-bottom glass border-border/20 shadow-nav md:hidden">
          <div className="flex items-center justify-around h-[56px] max-w-lg mx-auto px-1">
            {tabs.map(({ path, labelKey, icon: Icon, isCenter }) => {
              const label = t(labelKey);
              const active = isActive(path);
              if (isCenter) {
                return (
                  <Link
                    key={path}
                    to={path}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    className="flex flex-col items-center justify-center flex-1 -mt-4"
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90",
                      "bg-brand-gradient shadow-[0_4px_15px_hsl(var(--primary)/0.4)]",
                      active && "shadow-[0_4px_20px_hsl(var(--primary)/0.6)] scale-105"
                    )}>
                      <Icon className="h-5 w-5 text-white fill-current" strokeWidth={2.2} />
                    </div>
                    <span className={cn("text-[10px] mt-0.5", active ? "font-bold text-primary" : "font-medium text-muted-foreground")}>{label}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={path}
                  to={path}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center justify-center gap-[2px] flex-1 min-h-[44px] py-1.5 px-1 transition-all relative",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute top-0.5 h-[3px] w-5 rounded-full bg-primary" />
                  )}
                  <Icon className={cn("h-5 w-5 transition-all", active ? "stroke-[2.5px] scale-110" : "stroke-[1.5px]")} />
                  <span className={cn("text-[10px]", active ? "font-bold text-primary" : "font-medium")}>{label}</span>
                  <span className="sr-only">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ═══ MOBILE SIDEBAR DRAWER ═══ */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-[10001] w-[280px] bg-card border-r border-border/20 shadow-2xl flex flex-col md:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border/15">
                <CircloLogo variant="full" size="md" theme="light" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all"
                  aria-label={t("nav.closeMenu")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User info */}
              {user && (
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border/15">
                  <CoachAvatar src={profile?.avatar_url} name={profile?.username} size="sm" className="ring-[1.5px] ring-border/50" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{profile?.username || t("common.user")}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Nav items — logged-in users only. Guests see login/signup CTA. */}
              <nav aria-label={t("nav.openMenu")} className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
                {!user && (
                  <div className="flex flex-col gap-2 pt-2">
                    <Link
                      to="/login"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold shadow-sm shadow-primary/20 active:scale-[0.98] transition-all"
                    >
                      <User className="h-4 w-4" strokeWidth={2.2} />
                      {t("nav.logIn")}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-border/40 text-sm font-semibold text-foreground hover:bg-foreground/5 active:scale-[0.98] transition-all"
                    >
                      <UserPlus className="h-4 w-4 text-primary" strokeWidth={2} />
                      {t("nav.signUp")}
                    </Link>
                  </div>
                )}
                {user && sidebarItems.map(({ path, label, icon: Icon }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                        active
                          ? "bg-primary/8 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                      )}
                    >
                      <span className="relative">
                        <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} strokeWidth={active ? 2.2 : 1.5} />
                        {path === "/inbox" && unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-0.5">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </span>
                      <span>{label}</span>
                    </Link>
                  );
                })}

                {user && (role === "coach" || isAdmin) && (
                  <Link
                    to="/coach-dashboard"
                    onClick={() => setSidebarOpen(false)}
                    aria-current={isActive("/coach-dashboard") ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                      isActive("/coach-dashboard")
                        ? "bg-primary/8 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span>{t("nav.coachDashboard")}</span>
                  </Link>
                )}

                {user && isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setSidebarOpen(false)}
                    aria-current={isActive("/admin") ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200",
                      isActive("/admin")
                        ? "bg-primary/8 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    <Shield className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span>{t("nav.admin")}</span>
                  </Link>
                )}
              </nav>

              {/* Bottom actions */}
              <div className="px-3 py-3 border-t border-border/15 space-y-0.5">
                {user && (
                  <Link
                    to="/edit-profile"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
                  >
                    <Settings className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span>{t("nav.settings")}</span>
                  </Link>
                )}
                {user && (
                  <button
                    onClick={() => { signOut(); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-destructive hover:bg-destructive/5 transition-all"
                  >
                    <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span>{t("nav.signOut")}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PWA Install Prompt */}
      <Suspense fallback={null}>
        <PWAInstallPrompt />
      </Suspense>

      {/* Guest auth gate — opens when a logged-out user taps a coach card,
          Book, Message, etc. Mounted at shell level so it floats above the
          bottom tab bar. */}
      <Suspense fallback={null}>
        <GuestAuthSheet />
      </Suspense>

      {/* ═══ DEV PANEL — Agent Dashboard launcher ═══
          Opened by the Rocket button in the top nav (developers only).
          Replaces the legacy "tap logo 5 times" reveal. */}
      {showDevMenu && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowDevMenu(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Developer panel"
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #00D4AA22, #FF6B2C22)", border: "1px solid rgba(0,212,170,0.3)" }}
                >
                  <Rocket className="h-4 w-4" style={{ color: "#00D4AA" }} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Developer Panel</h3>
                  <p className="text-xs" style={{ color: "#8B9CB8" }}>Choose your destination</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => { setShowDevMenu(false); openExternal(AGENT_DASHBOARD_URL); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.98]"
                style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,212,170,0.15)" }}
                >
                  <LayoutDashboard className="h-5 w-5" style={{ color: "#00D4AA" }} />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm">Agent Dashboard</div>
                  <div className="text-xs mt-0.5" style={{ color: "#8B9CB8" }}>Open Circlo Hub — manage agents &amp; tasks</div>
                </div>
                <div className="ml-auto text-white/30 text-lg">›</div>
              </button>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowDevMenu(false)}
                className="w-full py-2.5 rounded-xl text-sm transition-colors"
                style={{ color: "#8B9CB8", background: "rgba(255,255,255,0.05)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;
