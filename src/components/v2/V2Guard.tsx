import { type ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isV2Enabled, setV2Enabled } from "@/lib/v2/featureFlag";
import { V2RoleProvider } from "@/contexts/v2/RoleContext";

/**
 * Wraps every /v2/* route. If the user appends ?flag=on the flag is set
 * and the page reloads. Otherwise, if the flag is off, we redirect to
 * /v2/enable where a button can turn it on.
 */
export function V2Guard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const flagParam = params.get("flag");
  const enabled = isV2Enabled();

  useEffect(() => {
    if (flagParam === "on") setV2Enabled(true);
    if (flagParam === "off") setV2Enabled(false);
  }, [flagParam]);

  if (!enabled && location.pathname !== "/v2/enable") {
    return <Navigate to="/v2/enable" replace state={{ from: location.pathname }} />;
  }

  return <V2RoleProvider>{children}</V2RoleProvider>;
}
