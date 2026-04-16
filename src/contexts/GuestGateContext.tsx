import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * GuestGateContext — lightweight provider used to intercept guest taps on
 * gated actions (viewing a coach profile, booking, messaging) and surface a
 * "sign up or log in" bottom sheet instead of silently redirecting.
 *
 * Consumers call `requireAuth(action, returnTo?)`:
 *   - If the user is authenticated, `action` runs immediately.
 *   - If not, the sheet opens; `returnTo` is stored so post-auth we can deep-link back.
 *
 * The sheet itself is rendered once by AppShell via `<GuestAuthSheet />` — this
 * context only manages open state + the pending redirect.
 */

type GuestGateState = {
  isOpen: boolean;
  returnTo: string | null;
  /** Open the sheet manually (e.g. from a "Join to continue" button). */
  open: (returnTo?: string) => void;
  /** Close without navigating. */
  close: () => void;
  /**
   * Guard an action. If `user` (resolved by caller via useAuth) is truthy,
   * run `action`. Otherwise open the sheet with `returnTo`.
   *
   * Usage:
   *   const { requireAuth } = useGuestGate();
   *   const { user } = useAuth();
   *   requireAuth(!!user, () => navigate(`/coach/${id}`), `/coach/${id}`);
   */
  requireAuth: (
    isAuthenticated: boolean,
    action: () => void,
    returnTo?: string,
  ) => void;
};

const GuestGateCtx = createContext<GuestGateState | null>(null);

export function GuestGateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  const open = useCallback((to?: string) => {
    setReturnTo(to ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const requireAuth = useCallback<GuestGateState["requireAuth"]>(
    (isAuthenticated, action, to) => {
      if (isAuthenticated) {
        action();
      } else {
        setReturnTo(to ?? null);
        setIsOpen(true);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ isOpen, returnTo, open, close, requireAuth }),
    [isOpen, returnTo, open, close, requireAuth],
  );

  return <GuestGateCtx.Provider value={value}>{children}</GuestGateCtx.Provider>;
}

export function useGuestGate(): GuestGateState {
  const ctx = useContext(GuestGateCtx);
  if (!ctx) {
    throw new Error("useGuestGate must be used inside <GuestGateProvider>");
  }
  return ctx;
}
