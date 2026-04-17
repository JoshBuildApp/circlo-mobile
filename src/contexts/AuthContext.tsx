import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAILS } from "@/config/dev";

type AppRole = "admin" | "user" | "coach" | "developer";

interface UserProfile {
  username: string;
  avatar_url: string | null;
  age: number | null;
  interests: string[];
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  /** The currently active (simulated) role — only differs from `role` for dev users */
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Whether the current user has admin-level access (admin or developer) */
  isAdmin: boolean;
  /** Whether the current user is the developer */
  isDeveloper: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  activeRole: null,
  setActiveRole: () => {},
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  isAdmin: false,
  isDeveloper: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(() => {
    const stored = localStorage.getItem("circlo_active_role");
    return stored ? (stored as AppRole) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("username, avatar_url, age, interests").eq("user_id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    ]);

    if (profileRes.data) {
      setProfile({
        username: profileRes.data.username,
        avatar_url: profileRes.data.avatar_url,
        age: profileRes.data.age,
        interests: (profileRes.data.interests as string[]) || [],
      });
    }
    if (roleRes.data) setRole(roleRes.data.role as AppRole);
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    window.location.href = "/login";
  };

  // Developer status is determined ONLY by the user_roles table — no email
  // fallback. The DB row is the source of truth so a compromised frontend
  // bundle can't grant itself privileges.
  const isDeveloper = role === "developer";

  // For dev users, use the simulated activeRole; for everyone else, use real role
  const effectiveRole = isDeveloper && activeRole ? activeRole : role;

  const setActiveRole = (r: AppRole) => {
    if (!isDeveloper) return;
    setActiveRoleState(r);
    localStorage.setItem("circlo_active_role", r);

    // Auto-create coach profile if switching to coach and none exists
    if (r === "coach" && user) {
      supabase
        .from("coach_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) {
            supabase.from("coach_profiles").insert({
              user_id: user.id,
              coach_name: profile?.username || "Dev Coach",
              sport: "Multi-Sport",
            });
          }
        });
    }
  };

  // For dev users: isAdmin only when simulating admin (or no role selected yet)
  const isAdmin = isDeveloper
    ? (!activeRole || activeRole === "admin" || activeRole === "developer")
    : (effectiveRole === "admin" || effectiveRole === "developer");

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      role: effectiveRole,
      activeRole: effectiveRole,
      setActiveRole,
      loading,
      signOut,
      refreshProfile,
      isAdmin,
      isDeveloper,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
