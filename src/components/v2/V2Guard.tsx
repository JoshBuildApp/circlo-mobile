import { type ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isV2Enabled, setV2Enabled } from "@/lib/v2/featureFlag";
import { V2RoleProvider } from "@/contexts/v2/RoleContext";
import { V2ThemeProvider } from "@/contexts/v2/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

/** Routes that don't require auth (auth flow itself + the flag toggle). */
const PUBLIC_V2_ROUTES = new Set([
  "/v2/enable",
  "/v2/welcome",
  "/v2/login",
  "/v2/signup",
  "/v2/splash",
  "/v2/forgot-password",
  "/v2/verify-email",
]);

/**
 * Wraps every /v2/* route.
 * 1. ?flag=on|off persists the v2 feature flag and reloads.
 * 2. Flag off → redirect to /v2/enable.
 * 3. Auth resolved + no user + on a private route → redirect to /v2/welcome.
 *
 * GUEST_BROWSE: when true, anyone can browse /v2/* without an account
 * (mock data fills the gaps). Useful for preview/Stitch demos. MUST be
 * false for any TestFlight or production build — leave it false unless
 * you're staging a guest tour.
 */
const GUEST_BROWSE = false;

export function V2Guard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const flagParam = params.get("flag");
  const enabled = isV2Enabled();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (flagParam === "on") setV2Enabled(true);
    if (flagParam === "off") setV2Enabled(false);
  }, [flagParam]);

  if (!enabled && location.pathname !== "/v2/enable") {
    return <Navigate to="/v2/enable" replace state={{ from: location.pathname }} />;
  }

  if (
    !GUEST_BROWSE &&
    !loading &&
    !user &&
    !PUBLIC_V2_ROUTES.has(location.pathname)
  ) {
    return <Navigate to="/v2/welcome" replace state={{ from: location.pathname }} />;
  }

  return (
    <V2ThemeProvider>
      <V2RoleProvider>{children}</V2RoleProvider>
    </V2ThemeProvider>
  );
}
