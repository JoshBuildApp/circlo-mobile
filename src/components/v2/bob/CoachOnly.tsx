import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRole } from "@/contexts/v2/RoleContext";

/**
 * Bob AI is a Pro/coach feature. Players hitting Bob routes get bounced
 * to the home page.
 */
export function CoachOnly({ children }: { children: ReactNode }) {
  const { isCoach } = useRole();
  if (!isCoach) return <Navigate to="/v2/home" replace />;
  return <>{children}</>;
}
