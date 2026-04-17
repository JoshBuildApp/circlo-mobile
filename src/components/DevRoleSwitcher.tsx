import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDataMode } from "@/contexts/DataModeContext";
import { Code2, Shield, User, Video, Database, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "user" as const, label: "User", icon: User },
  { value: "coach" as const, label: "Coach", icon: Video },
  { value: "admin" as const, label: "Admin", icon: Shield },
] as const;

/** Dev-only floating role switcher + data mode toggle */
const DevRoleSwitcher = () => {
  const { isDeveloper, activeRole, setActiveRole } = useAuth();
  const { dataMode, setDataMode } = useDataMode();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((prev) => !prev);
    window.addEventListener("toggle-dev-tools", toggle);
    return () => window.removeEventListener("toggle-dev-tools", toggle);
  }, []);

  if (!isDeveloper) return null;

  const current = activeRole || "developer";
  const currentLabel = ROLES.find(r => r.value === current)?.label || "Dev";

  if (!open) return null;

  return (
    <div className="fixed bottom-20 right-3 z-[10000] flex flex-col items-end gap-1.5 animate-fade-in">
      {/* Close button */}
      <button
        onClick={() => setOpen(false)}
        className="h-6 w-6 rounded-full bg-background/90 backdrop-blur border border-accent/30 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Data mode toggle */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/90 backdrop-blur border border-accent/30 shadow-lg">
        <Database className="h-3 w-3 text-accent shrink-0" />
        {(["real", "demo"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setDataMode(mode)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150",
              dataMode === mode
                ? mode === "real"
                  ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                  : "bg-amber-500/20 text-amber-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {mode === "real" ? <Eye className="h-3 w-3" /> : <Database className="h-3 w-3" />}
            {mode === "real" ? "Real" : "Demo"}
          </button>
        ))}
      </div>

      {/* Mode indicator */}
      <div className="px-2.5 py-1 rounded-lg bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest shadow-lg">
        {currentLabel} Mode
      </div>
      {/* Role switcher */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/90 backdrop-blur border border-accent/30 shadow-lg">
        <Code2 className="h-3 w-3 text-accent shrink-0" />
        {ROLES.map(({ value, label, icon: Icon }) => {
          const isActive = current === value;
          return (
            <button
              key={value}
              onClick={() => {
                setActiveRole(value);
                if (value === "admin") navigate("/admin");
                else if (value === "coach") navigate("/coach-dashboard");
                else navigate("/profile");
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DevRoleSwitcher;
