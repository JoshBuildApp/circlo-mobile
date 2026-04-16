import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CircloSplash from "@/components/CircloSplash";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While Supabase is rehydrating the saved session, show the full-screen
  // branded splash so a guest tapping a protected action doesn't see a flash
  // of the target page before the login redirect.
  if (loading) return <CircloSplash />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
