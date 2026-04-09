import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BrandLoader from "@/components/BrandLoader";

// Lazy load non-critical sections
const AppShell = lazy(() => import("@/components/AppShell"));

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth error:", error);
          setIsAuthenticated(false);
        } else if (session?.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          navigate('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <BrandLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Suspense fallback={<BrandLoader />}>
      <AppShell />
    </Suspense>
  );
};

export default Index;