import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MapPin } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center space-y-4 max-w-xs">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-heading text-5xl font-bold text-foreground">404</h1>
          <p className="text-sm text-muted-foreground">
            This page doesn't exist or has been moved.
          </p>
        </div>
        <Link
          to="/home"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm active:scale-95 transition-transform"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
