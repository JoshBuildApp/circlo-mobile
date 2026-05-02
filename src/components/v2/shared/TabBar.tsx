import { Link, useNavigate } from "react-router-dom";
import {
  Bot,
  Calendar,
  Film,
  Home,
  LayoutGrid,
  MessageSquare,
  Search,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/v2/RoleContext";
import { useHaptics } from "@/native/useNative";

export type PlayerTab = "home" | "discover" | "book" | "messages" | "profile";
export type CoachTab = "dashboard" | "messages" | "bob" | "content" | "profile";
export type AnyTab = PlayerTab | CoachTab;

export interface TabBarProps {
  /** Optional override; defaults to current RoleContext role. */
  mode?: "player" | "coach";
  active: AnyTab;
  className?: string;
}

interface TabSpec {
  key: AnyTab;
  label: string;
  to: string;
  icon: typeof Home;
  /** If true, clicking this tab flips role to player before navigating. */
  switchToPlayer?: boolean;
}

/**
 * Coach-mode tabs — UNCHANGED from the pre-Book-FAB layout. Profile swaps
 * role back to player before routing.
 */
const COACH_TABS: TabSpec[] = [
  { key: "dashboard", label: "Dashboard", to: "/v2/coach-me", icon: LayoutGrid },
  { key: "messages", label: "Messages", to: "/v2/messages", icon: MessageSquare },
  { key: "bob", label: "Bob", to: "/v2/bob", icon: Bot },
  { key: "content", label: "Content", to: "/v2/coach-me/content", icon: Film },
  { key: "profile", label: "Profile", to: "/v2/profile", icon: User, switchToPlayer: true },
];

/**
 * Player tabs flanking the center FAB. Ordered left-to-right around the
 * raised Book button: [Home, Discover] [FAB] [Messages, Profile].
 */
const PLAYER_LEFT: TabSpec[] = [
  { key: "home", label: "Home", to: "/v2/home", icon: Home },
  { key: "discover", label: "Discover", to: "/v2/discover", icon: Search },
];
const PLAYER_RIGHT: TabSpec[] = [
  { key: "messages", label: "Messages", to: "/v2/messages", icon: MessageSquare },
  { key: "profile", label: "Profile", to: "/v2/profile", icon: User },
];

/**
 * Context-aware bottom navigation. Sticky to bottom of PhoneFrame,
 * respects Capacitor safe area. Active tab shows teal icon/label.
 *
 * Player mode: 5-column grid where the middle cell is a raised orange FAB
 * that is the primary CTA for booking sessions. Coach mode keeps the
 * original 5-tab flex layout untouched.
 */
export function TabBar({ mode, active, className }: TabBarProps) {
  const ctx = useRole();
  const resolvedMode: "player" | "coach" = mode ?? ctx.role;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "v2-safe-bottom fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 border-t border-navy-line bg-navy-deep backdrop-blur-xl",
        className,
      )}
      style={{ backgroundColor: "var(--v2-bg)" }}
    >
      {resolvedMode === "coach" ? (
        <CoachRow active={active} />
      ) : (
        <PlayerRow active={active} />
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------------- */
/*  Coach — preserved original layout                                         */
/* ------------------------------------------------------------------------- */

function CoachRow({ active }: { active: AnyTab }) {
  const ctx = useRole();
  const navigate = useNavigate();
  const { tap } = useHaptics();
  return (
    <div className="flex justify-around items-center px-4 pt-2.5 pb-3">
      {COACH_TABS.map((t) => {
        const Icon = t.icon;
        const isActive = t.key === active;
        const itemClass = cn(
          "flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 min-h-[44px] min-w-[44px] rounded-[10px] text-[10px] font-medium transition-colors",
          isActive ? "text-teal" : "text-v2-muted-2",
        );
        if (t.switchToPlayer) {
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                tap("light");
                ctx.setRole("player");
                navigate(t.to);
              }}
              className={itemClass}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={2} />
              <span>{t.label}</span>
            </button>
          );
        }
        return (
          <Link
            key={t.key}
            to={t.to}
            onClick={() => tap("light")}
            className={itemClass}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={2} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Player — 4 flat tabs + raised center Book FAB                             */
/* ------------------------------------------------------------------------- */

function PlayerRow({ active }: { active: AnyTab }) {
  return (
    <div
      className="px-2 pt-2.5 pb-3 items-start"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 90px 1fr 1fr",
      }}
    >
      {PLAYER_LEFT.map((t) => (
        <PlayerTabItem key={t.key} spec={t} active={active === t.key} />
      ))}
      <BookCenterButton active={active === "book"} />
      {PLAYER_RIGHT.map((t) => (
        <PlayerTabItem key={t.key} spec={t} active={active === t.key} />
      ))}
    </div>
  );
}

function PlayerTabItem({ spec, active }: { spec: TabSpec; active: boolean }) {
  const Icon = spec.icon;
  const { tap } = useHaptics();
  return (
    <Link
      to={spec.to}
      onClick={() => tap("light")}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 min-h-[44px] min-w-[44px] rounded-[10px] text-[10px] font-medium transition-colors",
        active ? "text-teal" : "text-v2-muted-2",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={22} strokeWidth={2} />
      <span>{spec.label}</span>
    </Link>
  );
}

/**
 * Raised orange FAB that floats above the tab bar's baseline by ~28px.
 * Navigates to the Book landing page at /v2/book. Role-specific: the coach
 * row never renders this — coaches have their own dashboard layout.
 */
function BookCenterButton({ active }: { active: boolean }) {
  const { tap } = useHaptics();
  return (
    <div
      className="relative flex justify-center"
      style={{ alignItems: "flex-start" }}
    >
      <Link
        to="/v2/book"
        onClick={() => tap("medium")}
        aria-label="Book a session"
        aria-current={active ? "page" : undefined}
        className="circlo-book-fab absolute flex items-center justify-center text-white"
        style={{
          top: -28,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, var(--orange, #FF6B2C) 0%, var(--orange-dim, #E55A1F) 100%)",
          border: "4px solid var(--navy-deep, #0A0A0F)",
          boxShadow:
            "0 8px 24px var(--orange-glow, rgba(255, 107, 44, 0.45)), 0 0 0 1px rgba(255, 107, 44, 0.3)",
          transition: "transform 0.2s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1))",
        }}
      >
        <Calendar size={26} strokeWidth={2.2} />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--navy-deep, #0A0A0F)",
            border: "2px solid var(--orange, #FF6B2C)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            color: "var(--orange, #FF6B2C)",
            lineHeight: 1,
          }}
        >
          +
        </span>
      </Link>
      <span
        className="absolute text-[10px] font-bold tracking-wide"
        style={{
          top: 42,
          color: "var(--orange, #FF6B2C)",
        }}
      >
        Book
      </span>
    </div>
  );
}
