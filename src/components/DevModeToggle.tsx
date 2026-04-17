import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDataMode } from "@/contexts/DataModeContext";
import {
  Code2, Shield, User, Video, Database, Eye, Settings,
  LayoutDashboard, Zap, Globe, ChevronDown, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const ROLES = [
  { value: "user" as const, label: "User", icon: User, color: "text-blue-500 bg-blue-500/10" },
  { value: "coach" as const, label: "Coach", icon: Video, color: "text-emerald-500 bg-emerald-500/10" },
  { value: "admin" as const, label: "Admin", icon: Shield, color: "text-amber-500 bg-amber-500/10" },
] as const;

const QUICK_LINKS = [
  { label: "Admin Panel", path: "/admin", icon: Shield },
  { label: "Coach Dashboard", path: "/coach-dashboard", icon: LayoutDashboard },
  { label: "Edit Profile", path: "/edit-profile", icon: Settings },
];

const DevModeToggle = () => {
  const { isDeveloper, activeRole, setActiveRole } = useAuth();
  const { dataMode, setDataMode } = useDataMode();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = 288;
    const viewportPadding = 16;
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      window.innerWidth - panelWidth - viewportPadding
    );

    setPanelPosition({
      top: rect.bottom + 8,
      left,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleViewportChange = () => updatePanelPosition();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!isDeveloper) return null;

  const current = ROLES.find((r) => r.value === activeRole) || ROLES[0];

  return (
    <div className="relative ml-2">
      {/* Badge — click to open panel */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 active:scale-95 transition-all"
      >
        <Code2 className="h-3 w-3 text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent select-none">
          Dev
        </span>
        <ChevronDown className={cn("h-2.5 w-2.5 text-accent transition-transform", open && "rotate-180")} />
      </button>

      {/* Panel */}
      {open && panelPosition && createPortal(
        <>
          <div className="fixed inset-0 z-[100000]" onClick={() => setOpen(false)} />

          <div
            className="fixed z-[100001] w-72 rounded-2xl border border-border/50 bg-card p-4 shadow-2xl animate-fade-in-scale"
            style={{ top: panelPosition.top, left: panelPosition.left }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
                  <Zap className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Developer Panel</p>
                  <p className="text-[10px] text-muted-foreground">{current.label} mode · {dataMode} data</p>
                </div>
              </div>
              <button
                onClick={async () => { await supabase.auth.signOut(); setOpen(false); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Sign out"
              >
                <Lock className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mb-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Role</p>
              <div className="grid grid-cols-3 gap-1.5">
                {ROLES.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setActiveRole(value);
                      if (value === "admin") navigate("/admin");
                      else if (value === "coach") navigate("/coach-dashboard");
                      else navigate("/");
                      setOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-bold transition-all",
                      activeRole === value
                        ? `${color} ring-1 ring-current/20`
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data Source</p>
              <div className="flex gap-1.5">
                {(["real", "demo"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDataMode(mode)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all",
                      dataMode === mode
                        ? mode === "real"
                          ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {mode === "real" ? <Eye className="h-3.5 w-3.5" /> : <Database className="h-3.5 w-3.5" />}
                    {mode === "real" ? "Real Data" : "Demo Data"}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-3 border-t border-border/30" />

            <div className="space-y-0.5">
              {QUICK_LINKS.map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setOpen(false); }}
                  className="w-full text-left flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 border-t border-border/30 pt-3">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                <Globe className="h-3 w-3" />
                <span>Local · {new Date().toLocaleDateString()}</span>
                <span className="ml-auto flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default DevModeToggle;
