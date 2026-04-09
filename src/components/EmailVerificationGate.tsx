import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, RefreshCw, LogOut } from "lucide-react";
import { ADMIN_EMAILS } from "@/config/dev";

const EmailVerificationGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);

  if (loading) return null;

  if (!user) return <>{children}</>;

  const isBypassAccount = ADMIN_EMAILS.some(e => e.toLowerCase() === user.email?.toLowerCase());
  const isVerified = user.email_confirmed_at != null || isBypassAccount;

  if (isVerified) return <>{children}</>;

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email!,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email sent! Check your inbox.");
    }
    setResending(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
          Verify your email
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-2">
          We sent a verification link to
        </p>
        <p className="text-foreground font-medium text-sm mb-6">
          {user.email}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed mb-8">
          Please check your inbox and click the link to activate your account.
          Check your spam folder if you don't see it.
        </p>

        <button
          onClick={handleResend}
          disabled={resending}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 glow-primary disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
        >
          <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
          {resending ? "Sending…" : "Resend Verification Email"}
        </button>

        <button
          onClick={handleLogout}
          className="w-full h-12 bg-secondary text-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-secondary/80 active:scale-95 flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationGate;
