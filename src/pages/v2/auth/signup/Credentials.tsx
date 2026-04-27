import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "../components/PageHeader";
import { FormField } from "../components/FormField";
import { PasswordField } from "../components/PasswordField";
import { useSignup } from "../SignupContext";

/**
 * Step 3/4 of signup: collect name, email, password, confirm password, and
 * call supabase.auth.signUp with the role/name/sports metadata. On success
 * with a session (email confirmation disabled), go straight to Success. With
 * email confirmation on, bounce to Verify so the user can enter the code
 * from their inbox.
 */
export default function Credentials() {
  const navigate = useNavigate();
  const {
    role,
    sports,
    fullName,
    email,
    password,
    setFullName,
    setEmail,
    setPassword,
  } = useSignup();

  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim();
  const canSubmit =
    trimmedName.length > 0 &&
    trimmedEmail.length > 0 &&
    password.length >= 8 &&
    confirm === password &&
    !loading;

  const subtitle =
    role === "coach"
      ? "Let's get your coach profile started."
      : "Just the basics — takes 30 seconds.";

  const submit = async () => {
    if (!canSubmit) return;
    if (!role) {
      setError("Please pick a role first.");
      navigate("/v2/auth/signup/role");
      return;
    }
    setError(null);
    setLoading(true);

    const username = trimmedName.toLowerCase().replace(/\s+/g, ".").slice(0, 30);
    const sportsList = Array.from(sports);

    const { data, error: err } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedName,
          username,
          role,
          sports: sportsList,
        },
        // Use authRedirect() so iOS native gets circlo://v2/auth/login —
        // window.location.origin on Capacitor is capacitor://localhost,
        // which Supabase rejects as a redirect target.
        emailRedirectTo: (await import("@/lib/platform")).authRedirect("/v2/auth/login"),
      },
    });

    // Seed coach_profiles row so coaches appear in discovery immediately.
    if (role === "coach" && data?.user) {
      const { error: coachErr } = await supabase.from("coach_profiles").insert({
        user_id: data.user.id,
        coach_name: trimmedName,
        sport: sportsList[0] ?? "padel",
      });
      if (coachErr) {
        console.error("[v2/auth] coach_profiles insert failed:", coachErr);
      }
    }

    setLoading(false);
    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }

    if (data?.session) {
      // Email confirmation is disabled — account is active, skip Verify.
      toast.success("Account created!");
      navigate("/v2/auth/signup/success");
    } else {
      // Email confirmation required — send to Verify for the 6-digit code.
      toast.success("Check your email for a confirmation link.");
      navigate("/v2/auth/signup/verify");
    }
  };

  return (
    <div className="circlo-screen">
      <PageHeader step={3} onBack={() => navigate("/v2/auth/signup/sports")} />

      <div className="circlo-screen-enter">
        <h1 className="circlo-screen-title">Create your account</h1>
        <p className="circlo-screen-subtitle">{subtitle}</p>

        <FormField
          label="Full name"
          icon={<User size={18} strokeWidth={2} />}
          autoComplete="name"
          placeholder="Guy Avnaim"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <FormField
          label="Email"
          icon={<Mail size={18} strokeWidth={2} />}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          showStrength
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error ? (
          <div
            role="alert"
            style={{
              color: "var(--circlo-error)",
              fontSize: 13,
              padding: "0 4px",
            }}
          >
            {error}
          </div>
        ) : null}
      </div>

      <div className="circlo-bottom-cta">
        <button
          type="button"
          className="circlo-btn circlo-btn-primary"
          disabled={!canSubmit}
          onClick={submit}
        >
          {loading ? "Creating account…" : "Continue"}
        </button>
        <div className="circlo-terms-line">
          By continuing you agree to our{" "}
          <button type="button" className="circlo-link">
            Terms
          </button>{" "}
          and{" "}
          <button type="button" className="circlo-link">
            Privacy Policy
          </button>
          .
        </div>
      </div>
    </div>
  );
}
