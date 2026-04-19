import { Link } from "react-router-dom";
import { Home, Search, Calendar, MessageSquare, User, LayoutGrid, Bot, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/v2/RoleContext";

export type PlayerTab = "home" | "discover" | "calendar" | "messages" | "profile";
export type CoachTab = "dashboard" | "messages" | "bob" | "content" | "profile";
export type AnyTab = PlayerTab | CoachTab;

export interface TabBarProps {
  /** Optional override; defaults to current RoleContext role. */
  mode?: "player" | "coach";
  active: AnyTab;
  className?: string;
}

const PLAYER_TABS: { key: PlayerTab; label: string; to: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", to: "/v2/home", icon: Home },
  { key: "discover", label: "Discover", to: "/v2/discover", icon: Search },
  { key: "calendar", label: "Calendar", to: "/v2/calendar", icon: Calendar },
  { key: "messages", label: "Messages", to: "/v2/messages", icon: MessageSquare },
  { key: "profile", label: "Profile", to: "/v2/profile", icon: User },
];

const COACH_TABS: { key: CoachTab; label: string; to: string; icon: typeof Home }[] = [
  { key: "dashboard", label: "Dashboard", to: "/v2/coach-me", icon: LayoutGrid },
  { key: "messages", label: "Messages", to: "/v2/messages", icon: MessageSquare },
  { key: "bob", label: "Bob", to: "/v2/bob", icon: Bot },
  { key: "content", label: "Content", to: "/v2/coach-me/content", icon: Film },
  { key: "profile", label: "Profile", to: "/v2/coach-me", icon: User },
];

/**
 * Context-aware bottom navigation. Sticky to bottom of PhoneFrame,
 * respects Capacitor safe area. Active tab shows teal icon/label.
 */
export function TabBar({ mode, active, className }: TabBarProps) {
  // Default to current role context if no explicit override provided.
  const ctx = useRole();
  const resolvedMode: "player" | "coach" = mode ?? ctx.role;
  const tabs = resolvedMode === "coach" ? COACH_TABS : PLAYER_TABS;
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "v2-safe-bottom fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 border-t border-navy-line bg-[rgba(10,10,15,0.92)] backdrop-blur-xl",
        className
      )}
    >
      <div className="flex justify-around items-center px-4 pt-2.5 pb-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === active;
          return (
            <Link
              key={t.key}
              to={t.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-[10px] text-[10px] font-medium transition-colors",
                isActive ? "text-teal" : "text-v2-muted-2"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={2} />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
