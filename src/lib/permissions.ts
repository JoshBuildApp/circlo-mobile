type AppRole = "admin" | "coach" | "user" | "developer";

type Action =
  | "edit_any_profile"
  | "edit_own_profile"
  | "access_admin_dashboard"
  | "access_coach_dashboard"
  | "upload_content"
  | "book_sessions"
  | "view_content"
  | "manage_users"
  | "manage_verification"
  | "assign_admin";

const ROLE_PERMISSIONS: Record<AppRole, Action[]> = {
  developer: [], // developer gets everything via special case (like admin)
  admin: [
    "edit_any_profile",
    "edit_own_profile",
    "access_admin_dashboard",
    "access_coach_dashboard",
    "upload_content",
    "book_sessions",
    "view_content",
    "manage_users",
    "manage_verification",
  ],
  coach: [
    "edit_own_profile",
    "access_coach_dashboard",
    "upload_content",
    "book_sessions",
    "view_content",
  ],
  user: [
    "edit_own_profile",
    "book_sessions",
    "view_content",
  ],
};

export function hasPermission(role: AppRole | null, action: Action): boolean {
  if (!role) return false;
  if (role === "developer") return true; // developer = god mode
  if (role === "admin" && action !== "assign_admin") return true; // admin gets all except assign_admin
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

/** Check if role has admin-level access (admin or developer) */
export function isAdminRole(role: AppRole | null): boolean {
  return role === "admin" || role === "developer";
}

export type { AppRole, Action };
