import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, User } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { FormField } from "../components/FormField";
import { PasswordField } from "../components/PasswordField";
import { useSignup } from "../SignupContext";

/**
 * Step 3/4 of signup: collect name, email, password, confirm password.
 *
 * Visual reference: prototype/auth-flow.html → screenCredentials().
 *
 * Password strength meter lives inside PasswordField — 4 bars colour-shift
 * red → orange → teal as score rises (0-4 on the scorePassword heuristic).
 *
 * Continue is unlocked when every field is non-empty AND the two password
 * fields match. We don't yet surface a mismatch error inline; that's a
 * future polish pass.
 */
export default function Credentials() {
  const navigate = useNavigate();
  const { role, fullName, email, password, setFullName, setEmail, setPassword } =
    useSignup();

  const [confirm, setConfirm] = useState("");

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 1 &&
    confirm === password;

  const subtitle =
    role === "coach"
      ? "Let's get your coach profile started."
      : "Just the basics — takes 30 seconds.";

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
      </div>

      <div className="circlo-bottom-cta">
        <button
          type="button"
          className="circlo-btn circlo-btn-primary"
          disabled={!canSubmit}
          onClick={() => navigate("/v2/auth/signup/verify")}
        >
          Continue
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
