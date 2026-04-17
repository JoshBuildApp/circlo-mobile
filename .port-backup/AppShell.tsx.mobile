import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Search, CalendarDays, User, MessageSquare, Users, Play, Plus,
  UserPlus, Shield, Video, ArrowLeft, Palette, Bell, Zap, ChevronDown,
  LogOut, Settings, Bookmark, Menu, X, LayoutDashboard, Compass,
  Rss, BookOpen, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import CircloLogo from "@/components/CircloLogo";
import { CoachSearchAutocomplete } from "@/components/CoachSearchAutocomplete";
import { useMobile } from "@/hooks/use-mobile";
import { useUnreadCount } from "@/hooks/use-unread-count";
import DevModeToggle from "@/components/DevModeToggle";
import { useDevGate } from "@/contexts/DevGateContext";
import { useActivity } from "@/hooks/use-activity";
import { CoachAvatar } from "@/components/ui/coach-avatar";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Footer from "@/components/Footer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const NewContentCreator = lazy(() => import("@/components/NewContentCreator"));
const InviteModal = lazy(() => import("@/components/InviteModal"));
const PostSessionReviewPrompt = lazy(() => import("@/components/PostSessionReviewPrompt"));

const coachTabs = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/discover", label: "Discover", icon: Search },
  { path: "/book", label: "Book", icon: Zap, isCenter: true },
  { path: "/schedule", label: "Schedule", icon: CalendarDays },
  { path: "/profile", label: "Profile", icon: User },
];

const playerTabs = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/discover", label: "Discover", icon: Search },
  { path: "/book", label: "Book", icon: Zap, isCenter: true },
  { path: "/schedule", label: "Bookings", icon: CalendarDays },
  { path: "/profile", label: "Profile", icon: User },
];

// Sidebar navigation items
const sidebarItems = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/discover", label: "Discover", icon: Compass },
  { path: "/feed", label: "Feed", icon: Rss },
  { path: "/inbox", label: "Inbox", icon: MessageSquare },
  { path: "/book", label: "Book", icon: Zap },
  { path: "/plays", label: "Plays", icon: Play },
  { path: "/schedule", label: "Schedule", icon: CalendarDays },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/saved", label: "Saved", icon: Bookmark },
];

// Desktop nav links (center)
const desktopLinks = [
  { path: "/home", label: "Home" },
  { path: "/discover", label: "Discover" },
  { path: "/book", label: "Book" },
  { path: "/community", label: "Community" },
  { path: "/plays", label: "Plays" },
];

const TAB_PATHS = ["/home", "/discover", "/plays", "/schedule", "/profile", "/feed", "/community", "/book"];

const DASHBOARD_URL = "http://localhost:8080";

const AppShell = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, signOut } = useAuth();
  useActivity();
  const isCoach = role === "coach" || isAdmin;
  const tabs = isCoach ? coachTabs : playerTabs;
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<string | undefined>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const isMobile = useMobile();
  const { showGate } = useDevGate();
  const unreadCount = useUnreadCount();
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout>>();
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogoTap = (e: React.MouseEvent) => {
    e.preventDefault();
    if (showDevMenu) {
      setShowDevMenu(false);
      logoTapCount.current = 0;
      return;
    }
    logoTapCount.current += 1;
    clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      setShowDevMenu(true);
    } else {
      logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 1500);
    }
  };

  const navDepth = useRef(0);
  useEffect(() => {
    navDepth.current += 1;
    document.body.style.overflow = "";
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
  const isImmersive = false; // Nav always visible on all screens
  const isChat = pathname.startsWith("/chat/");

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background select-none touch-action-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Skip to main content — WCAG 2.1 AA */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-agent-teal focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* ═══ DESKTOP TOP NAV (md+) ═══ */}
      {!hideChrome && !isImmersive && !isChat && (
        <header className="app-top-nav sticky top-0 z-50 w-full bg-card/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-border/15 transition-colors duration-300">
          <div className="flex h-[60px] w-full max-w-[1200px] mx-auto items-center justify-between px-4 md:px-8 lg:px-12">
            {/* LEFT — Hamburger + Logo + back */}
            <div className="flex shrink-0 items-center gap-2.5">
              {/* Mobile hamburger */}
              {!showBack && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 active:scale-90 transition-all duration-200"
                  aria-label="Open menu"
                >
                  <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              )}
              {/* Desktop sidebar toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex h-8 w-8 -ml-1 rounded-full items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 active:scale-90 transition-all duration-200"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
              {showBack && (
                <button
                  onClick={handleBack}
                  className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 active:scale-90 transition-all duration-200"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              )}
              <Link to="/home" className="flex items-center gap-2 group" onClick={handleLogoTap}>
                <CircloLogo variant="full" size="md" theme="light" className="transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-95" />
              </Link>
              <span className="hidden sm:inline-flex px-1.5 py-[3px] rounded-md bg-primary/8 text-primary text-[9px] font-bold uppercase tracking-[0.15em] leading-none">Beta</span>
              <DevModeToggle />
            </div>

            {/* CENTER — Desktop nav links */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-0.5 bg-secondary/40 rounded-full px-1.5 py-1">
              {desktopLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  aria-current={isActive(path) ? "page" : undefined}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200",
                    isActive(path)
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              ))}

              {user && isAdmin && (
                <Link
                  to="/admin"
                  aria-current={pathname === "/admin" ? "page" : undefined}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200",
                    pathname === "/admin"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Admin
                </Link>
              )}

              {user && (role === "coach" || isAdmin) && (
                <Link
                  to="/coach-dashboard"
                  aria-current={pathname === "/coach-dashboard" ? "page" : undefined}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200",
                    pathname === "/coach-dashboard"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Dashboard
                </Link>
              )}
            </nav>

            {/* CENTER-RIGHT — Global Search */}
            <div className="hidden md:block w-full max-w-[260px] lg:max-w-[320px] mx-3">
              <CoachSearchAutocomplete
                placeholder="Search coaches..."
                compact
                onSearchSubmit={(q) => navigate(`/discover?q=${encodeURIComponent(q)}`)}
              />
            </div>

            {/* RIGHT — Actions */}
            <div className="flex shrink-0 items-center gap-0.5">

              {/* Mobile search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
                aria-label="Search"
              >
                {searchOpen ? <X className="h-[17px] w-[17px]" strokeWidth={1.8} /> : <Search className="h-[17px] w-[17px]" strokeWidth={1.8} />}
              </button>

              {user && (
                <button
                  onClick={() => setCreateOpen(true)}
                  className="hidden md:flex h-9 items-center gap-1.5 px-3.5 rounded-full text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
                  aria-label="Create content"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.2} />
                  <span className="hidden lg:inline">Create</span>
                </button>
              )}

              <Link
                to="/inbox"
                className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200 relative"
                aria-label="Inbox"
              >
                <MessageSquare className="h-[17px] w-[17px]" strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 ring-2 ring-background">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* User avatar dropdown (desktop) */}
              {user ? (
                <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                  <PopoverTrigger asChild>
                    <button aria-label="User menu" className="hidden md:flex items-center gap-1.5 ml-1 h-9 pl-1 pr-2 rounded-full hover:bg-foreground/5 transition-all duration-200">
                      <CoachAvatar src={profile?.avatar_url} name={profile?.username} size="xs" className="ring-[1.5px] ring-border/50" />
                      <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-1.5 rounded-2xl border-border/20 shadow-xl" align="end" sideOffset={8}>
                    <div className="px-3 py-2.5 border-b border-border/20 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">{profile?.username || "User"}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/5 transition-colors">
                      <User className="h-4 w-4 text-muted-foreground/60" /> Profile
                    </Link>
                    <Link to="/schedule" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/5 transition-colors">
                      <CalendarDays className="h-4 w-4 text-muted-foreground/60" /> My Schedule
                    </Link>
                    <Link to="/saved" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/5 transition-colors">
                      <Bookmark className="h-4 w-4 text-muted-foreground/60" /> Saved
                    </Link>
                    <button
                      onClick={() => { setInviteOpen(true); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/5 transition-colors"
                    >
                      <UserPlus className="h-4 w-4 text-muted-foreground/60" /> Invite a Coach
                    </button>
                    <div className="border-t border-border/20 mt-1 pt-1 px-3 py-2">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5" /> Appearance
                      </p>
                      <ThemeSwitcher layout="grid" />
                    </div>
                    <div className="border-t border-border/20 mt-1 pt-1">
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <Link to="/login" className="flex items-center h-8 px-4 rounded-full text-[13px] font-medium text-muted-foreground hover:text-foreground transition-all duration-200">
                    Log In
                  </Link>
                  <Link to="/signup" className="flex items-center h-8 px-5 rounded-full bg-foreground text-background text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all duration-200">
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile-only: create + invite buttons */}
              {user && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="md:hidden h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                  aria-label="Invite"
                >
                  <UserPlus className="h-[17px] w-[17px]" strokeWidth={1.8} />
                </button>
              )}
              {user && (
                <button
                  onClick={() => setCreateOpen(true)}
                  className="md:hidden h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                  aria-label="Create content"
                >
                  <Plus className="h-[17px] w-[17px]" strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Mobile search dropdown */}
      <AnimatePresence>
        {searchOpen && !hideChrome && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden sticky top-[60px] z-40 bg-card/95 backdrop-blur-xl border-b border-border/15 overflow-hidden"
          >
            <div className="px-4 py-3">
              <CoachSearchAutocomplete
                placeholder="Search coaches, sports..."
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

      {/* Desktop sidebar + Main content */}
      <div className="flex flex-1 w-full min-w-0 overflow-hidden">
        {/* ═══ DESKTOP SIDEBAR (md+) ═══ */}
        {!hideChrome && !isImmersive && !isChat && (
          <motion.aside
            animate={{ width: sidebarCollapsed ? 64 : 240 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="hidden md:flex flex-col flex-shrink-0 bg-card/50 border-r border-border/15 overflow-hidden h-[calc(100vh-60px)] sticky top-[60px]"
          >
            {/* User info */}
            {user && (
              <div className={cn("flex items-center gap-3 px-3 py-4 border-b border-border/15", sidebarCollapsed && "justify-center")}>
                <CoachAvatar src={profile?.avatar_url} name={profile?.username} size="sm" className="ring-[1.5px] ring-border/50 shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm font-semibold text-foreground truncate">{profile?.username || "User"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Nav items */}
            <nav aria-label="Sidebar navigation" className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
              {sidebarItems.map(({ path, label, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group",
                      active
                        ? "bg-gradient-to-r from-[#00D4AA]/15 to-[#00D4AA]/5 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
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
              })}

              {/* Role-specific items */}
              {user && (role === "coach" || isAdmin) && (
                <Link
                  to="/coach-dashboard"
                  aria-label="Dashboard"
                  aria-current={isActive("/coach-dashboard") ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                    isActive("/coach-dashboard")
                      ? "bg-gradient-to-r from-[#00D4AA]/15 to-[#00D4AA]/5 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                  title={sidebarCollapsed ? "Dashboard" : undefined}
                >
                  <LayoutDashboard className="h-5 w-5 shrink-0" strokeWidth={isActive("/coach-dashboard") ? 2.2 : 1.5} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="truncate">
                        Dashboard
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}

              {user && isAdmin && (
                <Link
                  to="/admin"
                  aria-label="Admin"
                  aria-current={isActive("/admin") ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                    isActive("/admin")
                      ? "bg-gradient-to-r from-[#00D4AA]/15 to-[#00D4AA]/5 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                  title={sidebarCollapsed ? "Admin" : undefined}
                >
                  <Shield className="h-5 w-5 shrink-0" strokeWidth={isActive("/admin") ? 2.2 : 1.5} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="truncate">
                        Admin
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}
            </nav>

            {/* Settings at bottom */}
            <div className="px-2 py-3 border-t border-border/15">
              <Link
                to="/edit-profile"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200",
                  sidebarCollapsed && "justify-center px-0"
                )}
                title={sidebarCollapsed ? "Settings" : undefined}
              >
                <Settings className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="truncate">
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
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

          <div
            key={pathname}
            className={cn(
              "animate-page-enter w-full min-w-0",
              isImmersive ? "h-full max-w-none" : "min-h-full max-w-[1200px] mx-auto px-0 md:px-8 lg:px-12",
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      {!hideChrome && !isImmersive && !isChat && <Footer />}

      {/* Content Creator + Invite modals */}
      <Suspense fallback={null}>
        {createOpen && <NewContentCreator open={createOpen} onClose={() => { setCreateOpen(false); setCreateInitialType(undefined); }} initialType={createInitialType} />}
        {inviteOpen && <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />}
      </Suspense>

      {/* ═══ MOBILE BOTTOM TABS (< md) ═══ */}
      {!hideChrome && !isChat && !isImmersive && (
        <nav role="navigation" aria-label="Main navigation" className="app-bottom-nav fixed bottom-0 left-0 right-0 z-[9999] border-t safe-area-bottom glass border-border/20 shadow-nav md:hidden">
          <div className="flex items-center justify-around h-[56px] max-w-lg mx-auto px-1">
            {tabs.map(({ path, label, icon: Icon, isCenter }) => {
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
                      "bg-gradient-to-br from-[#00D4AA] to-[#00B894] shadow-[0_4px_15px_rgba(0,212,170,0.4)]",
                      active && "shadow-[0_4px_20px_rgba(0,212,170,0.6)] scale-105"
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
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User info */}
              {user && (
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border/15">
                  <CoachAvatar src={profile?.avatar_url} name={profile?.username} size="sm" className="ring-[1.5px] ring-border/50" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{profile?.username || "User"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Nav items */}
              <nav aria-label="Mobile navigation" className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
                {sidebarItems.map(({ path, label, icon: Icon }) => {
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
                          ? "bg-gradient-to-r from-[#00D4AA]/15 to-[#00D4AA]/5 text-primary"
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
                        ? "bg-gradient-to-r from-[#00D4AA]/15 to-[#00D4AA]/5 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span>Coach Dashboard</span>
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
                        ? "bg-gradient-to-r from-[#00D4AA]/15 to-[#00D4AA]/5 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    <Shield className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span>Admin</span>
                  </Link>
                )}
              </nav>

              {/* Bottom actions */}
              <div className="px-3 py-3 border-t border-border/15 space-y-0.5">
                <Link
                  to="/edit-profile"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
                >
                  <Settings className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                  <span>Settings</span>
                </Link>
                {user && (
                  <button
                    onClick={() => { signOut(); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-destructive hover:bg-destructive/5 transition-all"
                  >
                    <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dev Menu — appears after 5 logo taps */}
      {showDevMenu && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowDevMenu(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: "linear-gradient(135deg, #00D4AA22, #FF6B2C22)", border: "1px solid rgba(0,212,170,0.3)" }}>
                  🔐
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Developer Access</h3>
                  <p className="text-xs" style={{ color: "#8B9CB8" }}>Choose your destination</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => { setShowDevMenu(false); showGate(); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.98]"
                style={{ background: "rgba(255,107,44,0.1)", border: "1px solid rgba(255,107,44,0.2)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: "rgba(255,107,44,0.15)" }}>⚡</div>
                <div>
                  <div className="text-white font-semibold text-sm">Dev Mode</div>
                  <div className="text-xs mt-0.5" style={{ color: "#8B9CB8" }}>Enter code to unlock developer access</div>
                </div>
                <div className="ml-auto text-white/30 text-lg">›</div>
              </button>
              <button
                onClick={() => { setShowDevMenu(false); window.open(DASHBOARD_URL, "_blank"); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.98]"
                style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: "rgba(0,212,170,0.15)" }}>🦾</div>
                <div>
                  <div className="text-white font-semibold text-sm">Agent Dashboard</div>
                  <div className="text-xs mt-0.5" style={{ color: "#8B9CB8" }}>Open Circlo Hub — manage agents & tasks</div>
                </div>
                <div className="ml-auto text-white/30 text-lg">›</div>
              </button>
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => setShowDevMenu(false)} className="w-full py-2.5 rounded-xl text-sm transition-colors" style={{ color: "#8B9CB8", background: "rgba(255,255,255,0.05)" }}>
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
