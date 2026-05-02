import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "../components/PageHeader";
import { OTPInput } from "../components/OTPInput";
import { useSignup } from "../SignupContext";
import { useHaptics } from "@/native/useNative";

/**
 * Step 4/4 of signup: wait for the user to confirm via the email link that
 * Supabase dispatches on signUp. If the user's Supabase config sends a
 * 6-digit code instead of a magic link, they can enter it in the OTP boxes
 * and we'll call verifyOtp directly. Either way, when a session appears we
 * route into the v2 shell.
 */
export default function Verify() {
  const navigate = useNavigate();
  const { email, otp, setOtp } = useSignup();
  const { tap } = useHaptics();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Watch auth state — if the magic link is tapped in another tab / the
  // user's mail app, Supabase writes a session here and we proceed.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        toast.success("Email confirmed!");
        navigate("/v2/auth/signup/success");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleComplete = async (code: string) => {
    if (code.length !== 6 || !email) return;
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email",
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success("Email confirmed!");
    navigate("/v2/auth/signup/success");
  };

  const handleContinue = async () => {
    // If the user already tapped the magic link, a session is present.
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    setLoading(false);
    if (data.session) {
      navigate("/v2/auth/signup/success");
      return;
    }
    if (otp.length === 6) {
      await handleComplete(otp);
      return;
    }
    setError(
      "Tap the confirmation link in your email, then come back here and press Continue.",
    );
  };

  const handleResend = async () => {
    if (!email) return;
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });
    if (err) toast.error(err.message);
    else toast.success("Resent. Check your inbox.");
  };

  return (
    <div className="circlo-screen overflow-y-auto">
      <PageHeader step={4} onBack={() => navigate("/v2/auth/signup/credentials")} />
      <div className="circlo-spacer-verify" />

      <div className="circlo-screen-enter">
        <h1 className="circlo-screen-title" style={{ textAlign: "center" }}>
          Check your email
        </h1>
        <p className="circlo-screen-subtitle" style={{ textAlign: "center" }}>
          We sent a confirmation to
        </p>

        <div className="circlo-email-display">
          {email || "your inbox"}
        </div>

        <p
          className="circlo-screen-subtitle"
          style={{ textAlign: "center", fontSize: 13 }}
        >
          Tap the link in your email. If you received a 6-digit code instead,
          enter it below.
        </p>

        <OTPInput value={otp} onChange={setOtp} onComplete={handleComplete} />

        {error ? (
          <div
            role="alert"
            style={{
              color: "var(--circlo-error)",
              fontSize: 13,
              textAlign: "center",
              padding: "0 4px",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="circlo-resend-row">
          Didn't get it?{" "}
          <button type="button" className="circlo-link min-h-[44px] inline-flex items-center" onClick={() => { tap("light"); handleResend(); }}>
            Resend code
          </button>
        </div>
      </div>

      <div className="circlo-bottom-cta">
        <button
          type="button"
          className="circlo-btn circlo-btn-primary"
          disabled={loading}
          onClick={() => {
            tap("light");
            handleContinue();
          }}
        >
          {loading ? "Checking…" : "Verify and continue"}
        </button>
      </div>
    </div>
  );
}
