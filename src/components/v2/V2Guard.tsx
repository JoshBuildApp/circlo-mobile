import { type ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isV2Enabled, setV2Enabled } from "@/lib/v2/featureFlag";
import { V2RoleProvider } from "@/contexts/v2/RoleContext";
import { V2ThemeProvider } from "@/contexts/v2/ThemeContext";
import { V2ErrorBoundary } from "@/components/v2/V2ErrorBoundary";
import { DevPanel } from "@/components/v2/DevPanel";
import { useAuth } from "@/contexts/AuthContext";

/** Exact auth-free routes (legacy paths kept for back-compat). */
const PUBLIC_V2_ROUTES = new Set([
  "/v2/enable",
  "/v2/welcome",
  "/v2/login",
  "/v2/signup",
  "/v2/splash",
  "/v2/forgot-password",
  "/v2/verify-email",
]);

/** Path prefixes that bypass auth (new shared-element /v2/auth/* flow). */
const PUBLIC_V2_PREFIXES = ["/v2/auth"];

function isPublicV2Path(pathname: string): boolean {
  if (PUBLIC_V2_ROUTES.has(pathname)) return true;
  return PUBLIC_V2_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Wraps every /v2/* route.
 * 1. ?flag=on|off persists the v2 feature flag and reloads.
 * 2. Flag off → redirect to /v2/enable.
 * 3. Auth resolved + no user + on a private route → redirect to /v2/welcome.
 *
 * Auth is enforced for every page outside PUBLIC_V2_ROUTES.
 * (The legacy GUEST_BROWSE escape hatch was removed in the v2 security
 * audit; if you need a public preview, use Storybook or screenshots.)
 */

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

  if (!loading && !user && !isPublicV2Path(location.pathname)) {
    return <Navigate to="/v2/auth/welcome" replace state={{ from: location.pathname }} />;
  }

  return (
    <V2ErrorBoundary>
      <V2ThemeProvider>
        <V2RoleProvider>
          {children}
          {/* Internal dev panel — renders null for non-allowlisted users. */}
          <DevPanel />
        </V2RoleProvider>
      </V2ThemeProvider>
    </V2ErrorBoundary>
  );
}
