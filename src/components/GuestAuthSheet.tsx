import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import CircloLogo from "@/components/CircloLogo";
import { useGuestGate } from "@/contexts/GuestGateContext";

/**
 * GuestAuthSheet — bottom sheet shown when an unauthenticated user taps
 * something gated (coach profile, Book, Message, etc.). Offers a clear
 * "Sign up" (primary) and "Log in" (secondary) path.
 *
 * Mounted once by AppShell. Opened via `useGuestGate().requireAuth(...)`.
 */
const GuestAuthSheet = () => {
  const navigate = useNavigate();
  const { isOpen, returnTo, close } = useGuestGate();

  const goToSignup = () => {
    close();
    navigate("/signup", { state: returnTo ? { from: { pathname: returnTo } } : undefined });
  };

  const goToLogin = () => {
    close();
    navigate("/login", { state: returnTo ? { from: { pathname: returnTo } } : undefined });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 pb-[calc(var(--safe-bottom,0px)+16px)] max-h-[80vh] border-t border-border/20"
      >
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="mb-5">
            <CircloLogo variant="icon" size="lg" theme="light" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-3">
            <Sparkles className="h-3 w-3" />
            Join to continue
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">
            Create your Circlo account
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Book coaches, follow your favorites, and save your progress.
            Free to start.
          </p>
        </div>

        <div className="px-6 pb-2 flex flex-col gap-2.5">
          <button
            onClick={goToSignup}
            className="w-full h-12 rounded-2xl bg-brand-gradient text-white text-[15px] font-semibold shadow-md shadow-primary/20 active:scale-[0.98] transition-transform"
          >
            Sign up — it's free
          </button>
          <button
            onClick={goToLogin}
            className="w-full h-12 rounded-2xl bg-secondary/60 text-foreground text-[15px] font-semibold active:scale-[0.98] transition-transform"
          >
            I already have an account
          </button>
          <button
            onClick={close}
            className="w-full h-10 mt-1 text-[13px] text-muted-foreground active:scale-[0.98] transition-transform"
          >
            Keep browsing
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GuestAuthSheet;
