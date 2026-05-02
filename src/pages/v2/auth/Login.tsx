import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "./components/PageHeader";
import { FormField } from "./components/FormField";
import { PasswordField } from "./components/PasswordField";
import { useHaptics } from "@/native/useNative";

/**
 * Login screen for the v2 auth flow — wired to Supabase via
 * supabase.auth.signInWithPassword. On success, navigates into the v2 shell.
 *
 * Visual reference: prototype/auth-flow.html → screenLogin().
 */
export default function Login() {
  const navigate = useNavigate();
  const { tap } = useHaptics();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.length > 0 && password.length > 0 && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/v2/home", { replace: true });
  };

  return (
    <div className="circlo-screen overflow-y-auto">
      <PageHeader onBack={() => navigate("/v2/auth/welcome")} />

      <div className="circlo-screen-enter">
        <h1 className="circlo-screen-title">Welcome back</h1>
        <p className="circlo-screen-subtitle">
          Log in to pick up where you left off.
        </p>

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
          autoComplete="current-password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? (
          <div
            role="alert"
            style={{
              color: "var(--circlo-error)",
              fontSize: 13,
              marginTop: -8,
              marginBottom: 12,
              paddingLeft: 4,
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="circlo-link-row">
          <Link to="/v2/forgot-password" onClick={() => tap("light")} className="circlo-link min-h-[44px] inline-flex items-center">
            Forgot password?
          </Link>
        </div>

        <button
          type="button"
          className="circlo-btn circlo-btn-primary"
          disabled={!canSubmit}
          onClick={() => {
            tap("light");
            submit();
          }}
        >
          {loading ? "Signing in…" : "Log in"}
        </button>

        <div className="circlo-divider">
          <span>or</span>
        </div>

        <div className="circlo-btn-stack">
          <button
            type="button"
            className="circlo-btn circlo-btn-apple"
            onClick={async () => {
              tap("light");
              const { signInWithProvider } = await import("@/lib/oauth");
              const r = await signInWithProvider("apple", "/home");
              if (!r.ok) {
                const { toast } = await import("sonner");
                toast.error(r.reason);
              }
            }}
          >
            <AppleGlyph /> Continue with Apple
          </button>
          <button
            type="button"
            className="circlo-btn circlo-btn-google"
            onClick={async () => {
              tap("light");
              const { signInWithProvider } = await import("@/lib/oauth");
              const r = await signInWithProvider("google", "/home");
              if (!r.ok) {
                const { toast } = await import("sonner");
                toast.error(r.reason);
              }
            }}
          >
            <GoogleGlyph /> Continue with Google
          </button>
        </div>

        <div className="circlo-footer-link">
          New here?
          <Link to="/v2/auth/signup/role" onClick={() => tap("light")} className="circlo-link min-h-[44px] inline-flex items-center ml-1">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

function AppleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5.04c1.98 0 3.72.68 5.1 2.01l3.82-3.82C18.43 1.19 15.48 0 12 0 7.39 0 3.41 2.65 1.48 6.51l4.45 3.45C6.89 7.04 9.22 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.23-2.45H12v4.63h6.47c-.28 1.5-1.12 2.77-2.39 3.62l3.7 2.87c2.16-1.99 3.4-4.93 3.4-8.45l.34-.22z"
      />
      <path
        fill="#FBBC05"
        d="M5.93 14.33c-.23-.69-.36-1.43-.36-2.18s.13-1.49.36-2.18L1.48 6.51C.54 8.23 0 10.05 0 12s.54 3.77 1.48 5.49l4.45-3.16z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.7-2.87c-1.03.69-2.34 1.1-4.23 1.1-2.78 0-5.11-1.87-5.95-4.51l-4.45 3.16C3.41 21.35 7.39 24 12 24z"
      />
    </svg>
  );
}
