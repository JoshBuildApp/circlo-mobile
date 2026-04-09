import { useState } from "react";
import { useDevGate } from "@/contexts/DevGateContext";
import { Lock, ShieldAlert, X, Loader2, Code2, LayoutDashboard, ArrowLeft, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";

const DASHBOARD_URL = "http://localhost:8080";
const DEV_CODES = ["C1rcl0DevX992!", "BackupDev884!"];
const DASHBOARD_AUTH_KEY = "circlo_dashboard_auth";
const AUTH_DURATION = 24 * 60 * 60 * 1000; // 24 hours

type Screen = "choose" | "devcode" | "dashboard-code" | "dashboard-redirect";

const isDashboardAuthed = (): boolean => {
  const stored = localStorage.getItem(DASHBOARD_AUTH_KEY);
  if (!stored) return false;
  const expiry = parseInt(stored, 10);
  if (Date.now() > expiry) {
    localStorage.removeItem(DASHBOARD_AUTH_KEY);
    return false;
  }
  return true;
};

const setDashboardAuth = () => {
  localStorage.setItem(DASHBOARD_AUTH_KEY, String(Date.now() + AUTH_DURATION));
};

const DevGateModal = () => {
  const { gateOpen, setGateOpen, validateCode, attemptsLeft, isLockedOut, isLoggingIn } = useDevGate();
  const [code, setCode] = useState("");
  const [dashCode, setDashCode] = useState("");
  const [error, setError] = useState(false);
  const [dashError, setDashError] = useState(false);
  const [shake, setShake] = useState(false);
  const [screen, setScreen] = useState<Screen>("choose");

  if (!gateOpen && !isLoggingIn) return null;

  // Signing in state
  if (!gateOpen && isLoggingIn) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
        <div className="w-full max-w-sm bg-card border border-border/50 rounded-2xl p-6 shadow-2xl animate-fade-in text-center">
          <Loader2 className="h-8 w-8 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-sm font-medium text-foreground">Signing in as developer...</p>
        </div>
      </div>
    );
  }

  const handleClose = () => {
    setGateOpen(false);
    setCode("");
    setDashCode("");
    setError(false);
    setDashError(false);
    setScreen("choose");
  };

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLockedOut) return;
    const success = validateCode(code.trim());
    if (!success) {
      setError(true);
      setShake(true);
      setCode("");
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 3000);
    }
  };

  const openDashboard = () => {
    setScreen("dashboard-redirect");
    setTimeout(() => {
      window.open(DASHBOARD_URL, "_blank");
      handleClose();
    }, 800);
  };

  const handleDashboardClick = () => {
    // If already authenticated in the last 24h, skip code entry
    if (isDashboardAuthed()) {
      openDashboard();
      return;
    }
    // Otherwise show code entry
    setScreen("dashboard-code");
  };

  const handleDashCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashCode.trim()) return;
    if (DEV_CODES.includes(dashCode.trim())) {
      setDashboardAuth();
      setDashCode("");
      openDashboard();
    } else {
      setDashError(true);
      setShake(true);
      setDashCode("");
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setDashError(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className={`w-full max-w-sm bg-card border border-border/50 rounded-2xl p-6 shadow-2xl animate-fade-in ${shake ? "animate-shake" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {screen !== "choose" && (
              <button
                onClick={() => { setScreen("choose"); setDashError(false); setError(false); }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <span className="font-heading text-sm font-bold text-foreground">
              {screen === "choose" ? "Access Portal" : screen === "devcode" ? "Developer Access" : screen === "dashboard-code" ? "Dashboard Access" : "Dashboard"}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SCREEN: Choose */}
        {screen === "choose" && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs text-muted-foreground text-center mb-4">What do you want to access?</p>

            <button
              onClick={() => setScreen("devcode")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group text-left"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Dev Mode</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Developer tools, role switching, debug access</p>
              </div>
            </button>

            <button
              onClick={handleDashboardClick}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-200 group text-left"
            >
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                <LayoutDashboard className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Agent Dashboard</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Manage agents, tasks, chat, monitor health</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-orange-500 transition-colors shrink-0" />
            </button>
          </div>
        )}

        {/* SCREEN: Dev Code Entry */}
        {screen === "devcode" && (
          <>
            {isLockedOut ? (
              <div className="text-center py-6 animate-fade-in">
                <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-3" />
                <p className="text-sm font-medium text-destructive">Access Temporarily Locked</p>
                <p className="text-xs text-muted-foreground mt-1">Too many attempts. Try again later.</p>
              </div>
            ) : (
              <form onSubmit={handleDevSubmit} className="space-y-4 animate-fade-in">
                <Input
                  type="password"
                  placeholder="Enter access code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                  className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50 text-center font-mono tracking-widest"
                />
                {error && (
                  <p className="text-xs text-destructive text-center animate-fade-in">
                    Invalid code · {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!code.trim()}
                  className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-40"
                >
                  Unlock Dev Mode
                </button>
              </form>
            )}
          </>
        )}

        {/* SCREEN: Dashboard Code Entry (same code, remembered 24h) */}
        {screen === "dashboard-code" && (
          <form onSubmit={handleDashCodeSubmit} className="space-y-4 animate-fade-in">
            <p className="text-xs text-muted-foreground text-center">Enter your dev code to access the dashboard</p>
            <Input
              type="password"
              placeholder="Enter access code"
              value={dashCode}
              onChange={(e) => setDashCode(e.target.value)}
              autoFocus
              className="h-12 rounded-xl bg-secondary border-border/50 focus:border-orange-500/50 text-center font-mono tracking-widest"
            />
            {dashError && (
              <p className="text-xs text-destructive text-center animate-fade-in">
                Invalid code — use the same dev access code
              </p>
            )}
            <button
              type="submit"
              disabled={!dashCode.trim()}
              className="w-full h-11 bg-orange-500 text-white rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-40"
            >
              Open Dashboard
            </button>
            <p className="text-[10px] text-muted-foreground text-center">You won't need to enter this again for 24 hours</p>
          </form>
        )}

        {/* SCREEN: Dashboard Redirect */}
        {screen === "dashboard-redirect" && (
          <div className="text-center py-6 animate-fade-in">
            <Loader2 className="h-8 w-8 text-orange-500 mx-auto mb-3 animate-spin" />
            <p className="text-sm font-medium text-foreground">Opening Agent Dashboard...</p>
            <p className="text-[11px] text-muted-foreground mt-1">A new tab is opening</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevGateModal;
