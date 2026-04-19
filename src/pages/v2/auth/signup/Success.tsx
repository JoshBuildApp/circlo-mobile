import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useSignup } from "../SignupContext";
import "./success.css";

/**
 * Signup terminal state: confetti, animated C-collapse on the ring (driven
 * by AuthLayout), and a role-specific congratulations block.
 *
 * Visual reference: prototype/auth-flow.html → screenSuccess().
 *
 * The C-collapse stroke animation is handled entirely by Success's imported
 * CSS + the `opening` class AuthLayout toggles on the CirloRing. This
 * component's only responsibilities are:
 *   - The page header (back button, no progress bar on the terminal state).
 *   - Confetti pieces (28 pieces, randomized horizontal drift + delays,
 *     frozen on mount via useMemo so re-renders don't re-randomize).
 *   - The staggered title + CTAs.
 *
 * Phase 11 scope: ends at "Start exploring" / "Go to dashboard" CTA, which
 * for now routes into the v2 shell entry point (/v2/home) without any real
 * account creation side-effects. A future pass replaces that with a proper
 * post-signup handoff.
 */
export default function Success() {
  const navigate = useNavigate();
  const { role, fullName, reset } = useSignup();

  const isCoach = role === "coach";
  const firstName =
    fullName?.trim().split(/\s+/)[0] ??
    (isCoach ? "Coach" : "Player");
  const displayName = firstName || (isCoach ? "Coach" : "Player");

  const subtitle = isCoach
    ? "Your coach profile is ready. Let's set up your first circle."
    : "Your circle is ready. Let's find your first coach.";

  const confetti = useMemo(() => generateConfetti(), []);

  const handleBackToStart = () => {
    reset();
    navigate("/v2/auth/welcome");
  };

  const handlePrimaryCta = () => {
    navigate("/v2/home");
  };

  return (
    <div
      className="circlo-screen"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <PageHeader onBack={handleBackToStart} />

      {confetti.map((piece, i) => (
        <span
          key={i}
          className="circlo-confetti"
          style={{
            left: `${piece.left}px`,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            ["--circlo-confetti-tx" as string]: `${piece.tx}px`,
          }}
        />
      ))}

      <div className="circlo-spacer-success" />

      <div
        className="circlo-success-wrap circlo-screen-enter"
        style={{ animationDelay: "1.2s" }}
      >
        <div className="circlo-success-title">
          You're in the circle, {displayName}!
        </div>
        <div className="circlo-success-subtitle">{subtitle}</div>

        <div
          className="circlo-btn-stack"
          style={{ maxWidth: 280, margin: "0 auto" }}
        >
          <button
            type="button"
            className="circlo-btn circlo-btn-primary"
            onClick={handlePrimaryCta}
          >
            {isCoach ? "Go to dashboard" : "Start exploring"}
          </button>
          <button
            type="button"
            className="circlo-btn circlo-btn-secondary"
            onClick={handleBackToStart}
          >
            Back to start
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfettiPiece {
  left: number;
  tx: number;
  delay: number;
  color: string;
}

/**
 * Generate 28 confetti pieces with the prototype's randomization:
 *   - left: Math.random() * 340 - 20            (pixel offset, -20..320)
 *   - tx  : (Math.random() - 0.5) * 200         (horizontal drift -100..100)
 *   - delay: 0.8 + Math.random() * 1.2          (seconds)
 */
function generateConfetti(): ConfettiPiece[] {
  const colors = ["#00D4AA", "#FF6B2C", "#FFD700", "#FF4D6D", "#00B894"];
  return Array.from({ length: 28 }, () => ({
    left: Math.random() * 340 - 20,
    tx: (Math.random() - 0.5) * 200,
    delay: 0.8 + Math.random() * 1.2,
    color: colors[Math.floor(Math.random() * colors.length)]!,
  }));
}
