import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Wrench, X, Database, Layers, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/v2/RoleContext";
import {
  isDeveloperAccount,
  useDataMode,
  setDataMode,
  type DataMode,
} from "@/lib/v2/devMode";
import {
  isBobEnabled,
  isLiveEnabled,
  isShopEnabled,
} from "@/lib/v2/featureFlag";
import { cn } from "@/lib/utils";

/**
 * Floating dev panel — only visible to allowlisted internal accounts.
 * Provides quick role switching + demo/real data mode toggle + preview-flag
 * toggles for Bob / Live / Shop. Persists selections to localStorage so they
 * survive reloads. Re-renders the whole v2 tree after a toggle because most
 * hooks read the flag once at query-time.
 */
export function DevPanel() {
  const { user } = useAuth();
  const { role, setRole } = useRole();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dataMode = useDataMode(); // reactive — buttons reflect the live flag

  if (!isDeveloperAccount(user)) return null;

  const changeDataMode = (next: DataMode) => {
    if (next === dataMode) return;
    setDataMode(next); // notifies subscribers — useDataMode re-renders
    // Invalidate v2 cache so query consumers re-run their queryFn. useCoaches
    // also has the mode in its queryKey so it gets a fresh cache entry.
    qc.invalidateQueries({ queryKey: ["v2"] });
  };

  const changeRole = (next: "player" | "coach") => {
    setRole(next);
    setOpen(false);
    navigate(next === "coach" ? "/v2/coach-me" : "/v2/home");
  };

  const togglePreview = (key: string) => {
    try {
      const cur = window.localStorage.getItem(key) === "true";
      window.localStorage.setItem(key, (!cur).toString());
    } catch {
      /* noop */
    }
    // Force a soft refresh — preview flags are read synchronously at render.
    window.location.reload();
  };

  return (
    <>
      {/* Floating trigger — bottom-right, just above the bottom nav. */}
      <button
        aria-label="Dev panel"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full bg-orange text-white flex items-center justify-center shadow-lg"
        style={{ boxShadow: "0 8px 24px rgba(255,107,44,0.35)" }}
      >
        <Wrench size={18} strokeWidth={2.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Developer panel"
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-[20px] bg-navy-card border-t border-navy-line p-5 pb-10 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-[10px] font-extrabold tracking-widest text-orange">DEV PANEL</div>
                <h2 className="text-[18px] font-extrabold tracking-tight mt-1">Switch mode</h2>
              </div>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full bg-navy-card-2 text-offwhite flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Role switch */}
            <section className="mb-5">
              <div className="flex items-center gap-2 text-[11px] text-v2-muted font-bold tracking-widest uppercase mb-2">
                <Layers size={12} /> Active role
              </div>
              <div className="grid grid-cols-2 gap-2">
                <RoleButton active={role === "player"} label="Player" onClick={() => changeRole("player")} />
                <RoleButton active={role === "coach"} label="Coach" onClick={() => changeRole("coach")} />
              </div>
              <p className="text-[11px] text-v2-muted mt-2">
                Jumps to Home (player) or Coach dashboard (coach).
              </p>
            </section>

            {/* Data mode */}
            <section className="mb-5">
              <div className="flex items-center gap-2 text-[11px] text-v2-muted font-bold tracking-widest uppercase mb-2">
                <Database size={12} /> Data source
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ModeButton
                  active={dataMode === "demo"}
                  label="Demo data"
                  sub="Mock coaches + sessions"
                  onClick={() => changeDataMode("demo")}
                />
                <ModeButton
                  active={dataMode === "real"}
                  label="Real data"
                  sub="Live Supabase (may be empty)"
                  onClick={() => changeDataMode("real")}
                />
              </div>
              <p className="text-[11px] text-v2-muted mt-2">
                Real mode returns honest empty states. Demo mode shows mocks
                even when authenticated — useful for screenshots + demos.
              </p>
            </section>

            {/* Preview features */}
            <section className="mb-3">
              <div className="text-[11px] text-v2-muted font-bold tracking-widest uppercase mb-2">
                Preview features
              </div>
              <div className="flex flex-col gap-1.5">
                <PreviewRow label="Bob AI"          storageKey="circlo:preview_bob"   on={isBobEnabled()}   onToggle={() => togglePreview("circlo:preview_bob")} />
                <PreviewRow label="Live sessions"   storageKey="circlo:preview_live"  on={isLiveEnabled()}  onToggle={() => togglePreview("circlo:preview_live")} />
                <PreviewRow label="Shop tab"        storageKey="circlo:preview_shop"  on={isShopEnabled()}  onToggle={() => togglePreview("circlo:preview_shop")} />
              </div>
              <p className="text-[11px] text-v2-muted mt-2">
                Toggling reloads the app so flags are re-read everywhere.
              </p>
            </section>

            <div className="text-center text-[11px] text-v2-muted-2 pt-3 border-t border-navy-line mt-4">
              Signed in as {user?.email}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RoleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "py-3 rounded-[12px] font-bold text-[14px] border transition-colors",
        active
          ? "bg-teal text-navy-deep border-teal"
          : "bg-navy-card-2 text-offwhite border-navy-line"
      )}
    >
      {label}
    </button>
  );
}

function ModeButton({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "py-3 px-3 rounded-[12px] text-left border transition-colors",
        active
          ? "bg-teal text-navy-deep border-teal"
          : "bg-navy-card-2 text-offwhite border-navy-line"
      )}
    >
      <div className="text-[13px] font-bold">{label}</div>
      <div className={cn("text-[11px] mt-0.5", active ? "text-navy-deep/75" : "text-v2-muted")}>
        {sub}
      </div>
    </button>
  );
}

function PreviewRow({
  label,
  storageKey,
  on,
  onToggle,
}: {
  label: string;
  storageKey: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between p-3 rounded-[10px] bg-navy-card-2 border border-navy-line"
    >
      <div className="text-left">
        <div className="text-[13px] font-bold">{label}</div>
        <div className="text-[11px] text-v2-muted-2 font-mono">{storageKey}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-[11px] font-bold", on ? "text-teal" : "text-v2-muted")}>
          {on ? "ON" : "OFF"}
        </span>
        <ChevronRight size={14} className="text-v2-muted" />
      </div>
    </button>
  );
}
