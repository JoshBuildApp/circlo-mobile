import { useNavigate } from "react-router-dom";
import { ChevronLeft, Cookie, AlertTriangle } from "lucide-react";

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Cookie Policy</h1>
      </div>

      <div className="px-4 space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Placeholder — draft in progress</p>
            <p className="text-xs text-muted-foreground mt-1">
              The final Cookie Policy is being prepared by legal counsel. This page is a stub
              so the route renders; it is not the binding policy.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/10 bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">What this document will cover</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Which cookies and similar technologies Circlo uses (essential, preference,
            analytics), what they store (session, theme, data mode, active role), and how you
            can manage or clear them. No advertising cookies are used.
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center px-4">
          Questions? Contact support@circloclub.com
        </p>
      </div>
    </div>
  );
};

export default CookiePolicy;
