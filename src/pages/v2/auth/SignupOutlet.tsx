import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSignup } from "./SignupContext";

/**
 * Renders the active /v2/auth/signup/* child route and enforces step gating.
 *
 * Rules (match the prototype's linear flow):
 *   /role         — always reachable
 *   /sports       — requires a selected role
 *   /credentials  — requires role + ≥1 sport
 *   /verify       — requires role + ≥1 sport + name + email + password
 *   /success      — reachable after verify (or from /login as a demo target)
 *
 * If a prerequisite is missing, we replace navigation with the earliest
 * missing step rather than bouncing to Welcome — the user's partial state
 * isn't discarded.
 */
export function SignupOutlet() {
  const location = useLocation();
  const signup = useSignup();

  const step = location.pathname.split("/").filter(Boolean).pop() ?? "";

  const gate = stepGate(step, signup);
  if (gate) {
    return <Navigate to={gate} replace />;
  }

  return <Outlet />;
}

function stepGate(
  step: string,
  signup: ReturnType<typeof useSignup>,
): string | null {
  switch (step) {
    case "role":
      return null;
    case "sports":
      return signup.role ? null : "/v2/auth/signup/role";
    case "credentials":
      if (!signup.role) return "/v2/auth/signup/role";
      if (signup.sports.size === 0) return "/v2/auth/signup/sports";
      return null;
    case "verify":
      if (!signup.role) return "/v2/auth/signup/role";
      if (signup.sports.size === 0) return "/v2/auth/signup/sports";
      if (!signup.fullName || !signup.email || !signup.password) {
        return "/v2/auth/signup/credentials";
      }
      return null;
    case "success":
      // Success is reachable as a terminal state. Don't gate; Login uses it
      // as a demo target and we don't want to kick people back through
      // intermediate steps once they've been congratulated.
      return null;
    default:
      return "/v2/auth/signup/role";
  }
}
