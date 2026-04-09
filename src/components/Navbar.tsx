import { Link, useLocation } from "react-router-dom";
import { Compass, Home, LogOut, Play, Shield, User, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CircloLogo from "@/components/CircloLogo";

const Navbar = () => {
  const { pathname } = useLocation();
  const { user, profile, role, isAdmin, signOut } = useAuth();

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/feed", label: "Feed", icon: Play },
    { to: "/discover", label: "Discover", icon: Compass },
    { to: "/plays", label: "Plays", icon: Video },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/40">
      <div className="container flex items-center justify-between h-14">
        <Link to="/home" className="flex items-center gap-2.5 group">
          <CircloLogo variant="full" size="md" theme="light" className="transition-transform duration-150 group-hover:scale-105 group-active:scale-95" />
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === to
                  ? "bg-brand-gradient text-primary-foreground shadow-brand-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname === "/admin"
                      ? "bg-brand-gradient text-primary-foreground shadow-brand-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              {(role === "coach" || isAdmin) && (
                <Link
                  to="/coach-dashboard"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname === "/coach-dashboard"
                      ? "bg-brand-gradient text-primary-foreground shadow-brand-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Video className="h-4 w-4" />
                  <span className="hidden sm:inline">My Videos</span>
                </Link>
              )}

              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
                <Link to="/profile" className="h-8 w-8 rounded-xl bg-brand-gradient-soft flex items-center justify-center hover:shadow-brand-sm transition-all">
                  <span className="text-xs font-bold text-primary">
                    {profile?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </Link>
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border/50">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-brand-gradient text-primary-foreground shadow-brand-sm hover:brightness-110 transition-all duration-200"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
