import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "@/types/v2";

const ROLE_STORAGE_KEY = "circlo:v2_role";

interface RoleContextShape {
  role: UserRole;
  setRole: (role: UserRole) => void;
  switchRole: (role?: UserRole) => void;
  isCoach: boolean;
}

const RoleContext = createContext<RoleContextShape | null>(null);

function readStoredRole(): UserRole {
  try {
    const stored = window.localStorage.getItem(ROLE_STORAGE_KEY);
    if (stored === "coach" || stored === "player") return stored;
  } catch {
    /* noop */
  }
  return "player";
}

export function V2RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() =>
    typeof window === "undefined" ? "player" : readStoredRole()
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      /* noop */
    }
  }, [role]);

  const setRole = useCallback((next: UserRole) => setRoleState(next), []);

  const switchRole = useCallback(
    (next?: UserRole) => setRoleState((prev) => next ?? (prev === "coach" ? "player" : "coach")),
    []
  );

  const value = useMemo<RoleContextShape>(
    () => ({ role, setRole, switchRole, isCoach: role === "coach" }),
    [role, setRole, switchRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextShape {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside <V2RoleProvider>");
  return ctx;
}
