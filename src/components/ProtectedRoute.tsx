import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BrandLoader from "@/components/BrandLoader";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <BrandLoader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
