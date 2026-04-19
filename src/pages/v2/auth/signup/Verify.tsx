import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { OTPInput } from "../components/OTPInput";
import { useSignup } from "../SignupContext";

/**
 * Step 4/4 of signup: verify the email address. UI-only for this pass —
 * the 'Resend code' link is inert and any 6-digit value unlocks Continue.
 *
 * Visual reference: prototype/auth-flow.html → screenVerify().
 */
export default function Verify() {
  const navigate = useNavigate();
  const { email, otp, setOtp } = useSignup();

  const canSubmit = otp.length === 6;

  return (
    <div className="circlo-screen">
      <PageHeader step={4} onBack={() => navigate("/v2/auth/signup/credentials")} />
      <div className="circlo-spacer-verify" />

      <div className="circlo-screen-enter">
        <h1 className="circlo-screen-title" style={{ textAlign: "center" }}>
          Check your email
        </h1>
        <p className="circlo-screen-subtitle" style={{ textAlign: "center" }}>
          We sent a 6-digit code to
        </p>

        <div className="circlo-email-display">
          {email || "you@example.com"}
        </div>

        <OTPInput
          value={otp}
          onChange={setOtp}
          onComplete={() => navigate("/v2/auth/signup/success")}
          autoFocus
        />

        <div className="circlo-resend-row">
          Didn't get it?{" "}
          <button type="button" className="circlo-link">
            Resend code
          </button>
        </div>
      </div>

      <div className="circlo-bottom-cta">
        <button
          type="button"
          className="circlo-btn circlo-btn-primary"
          disabled={!canSubmit}
          onClick={() => navigate("/v2/auth/signup/success")}
        >
          Verify and continue
        </button>
      </div>
    </div>
  );
}
