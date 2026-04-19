import { Link } from "react-router-dom";
import "./welcome.css";

/**
 * Welcome / splash screen for the v2 auth flow.
 *
 * Visual reference: prototype/auth-flow.html → screenWelcome().
 *
 *   ┌──────────────────────────────┐
 *   │  padel               basket  │  ← floating SVG sport icons
 *   │             [ring]           │  ← CirloRing, owned by AuthLayout
 *   │            circlo            │
 *   │        FIND YOUR CIRCLE      │
 *   │                              │
 *   │  glove                       │
 *   │                              │
 *   │  [ Create account ]          │
 *   │  [ Log in           ]        │
 *   │  ─── or continue with ───    │
 *   │  [ 🍎 ]  [ G ]               │
 *   │  Terms · Privacy             │
 *   └──────────────────────────────┘
 */
export default function Welcome() {
  return (
    <div className="circlo-welcome-root">
      <div className="circlo-welcome-glow" />

      {/* Floating sport icons — low-opacity decorative backdrop. */}
      <svg
        className="circlo-float circlo-float-padel"
        viewBox="0 0 100 120"
        fill="none"
        aria-hidden="true"
      >
        <ellipse
          cx="50"
          cy="40"
          rx="32"
          ry="38"
          stroke="currentColor"
          strokeWidth="3"
          fill="rgba(255,255,255,0.02)"
        />
        {/* Grid of dots inside the padel head — plotted to stay inside the ellipse. */}
        <g fill="currentColor" opacity="0.55">
          {generatePadelDots()}
        </g>
        <rect x="47" y="75" width="6" height="38" rx="3" fill="currentColor" />
        <rect x="44" y="110" width="12" height="8" rx="2" fill="currentColor" />
      </svg>

      <svg
        className="circlo-float circlo-float-basketball"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="3"
          fill="rgba(255,255,255,0.02)"
        />
        <path
          d="M 50 8 Q 50 50 50 92"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M 8 50 Q 50 50 92 50"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M 15 22 Q 50 50 85 22"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M 15 78 Q 50 50 85 78"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
      </svg>

      <svg
        className="circlo-float circlo-float-glove"
        viewBox="0 0 100 110"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M 20 35 Q 20 15 40 15 L 65 15 Q 80 15 80 30 L 80 55 Q 85 58 85 65 Q 85 72 78 72 L 78 85 Q 78 98 65 98 L 30 98 Q 18 98 18 85 L 18 60 Q 15 55 18 48 Q 20 45 20 35 Z"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="rgba(255,255,255,0.02)"
        />
        <line
          x1="30"
          y1="50"
          x2="75"
          y2="50"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

      {/* Wordmark + tagline (ring is rendered by AuthLayout above this block). */}
      <div className="circlo-welcome-text">
        <div className="circlo-wordmark">circlo</div>
        <div className="circlo-tagline">Find your circle</div>
      </div>

      {/* Action stack pinned to the bottom. */}
      <div className="circlo-welcome-actions">
        <Link
          to="/v2/auth/signup/role"
          className="circlo-btn circlo-btn-primary"
        >
          Create account
        </Link>
        <Link to="/v2/auth/login" className="circlo-btn circlo-btn-glass">
          Log in
        </Link>

        <div className="circlo-divider circlo-divider-splash">
          <span>or continue with</span>
        </div>

        <div className="circlo-btn-row">
          <button
            type="button"
            className="circlo-btn circlo-btn-apple circlo-btn-icon-only"
            aria-label="Continue with Apple"
          >
            <AppleIcon />
          </button>
          <button
            type="button"
            className="circlo-btn circlo-btn-google circlo-btn-icon-only"
            aria-label="Continue with Google"
          >
            <GoogleIcon />
          </button>
        </div>

        <div className="circlo-terms-line">
          By continuing you agree to our{" "}
          <button type="button" className="circlo-link">
            Terms
          </button>{" "}
          and{" "}
          <button type="button" className="circlo-link">
            Privacy
          </button>
          .
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Inline vendor-coloured icons. lucide doesn't ship the exact Apple or     */
/*  Google multi-color marks, so we inline the familiar shapes here.         */
/* ------------------------------------------------------------------------- */

function AppleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
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

/**
 * Plot the dot-pattern inside the padel head. The original prototype inlines
 * this with template literals; we render it declaratively so React's reconciler
 * is happy.
 */
function generatePadelDots() {
  const dots: JSX.Element[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      const cx = 30 + c * 10;
      const cy = 14 + r * 8;
      const dx = cx - 50;
      const dy = cy - 40;
      // Keep dots inside the padel-head ellipse (rx=32, ry=38).
      if ((dx * dx) / (32 * 32) + (dy * dy) / (38 * 38) < 0.82) {
        dots.push(<circle key={`${r}-${c}`} cx={cx} cy={cy} r={1.8} />);
      }
    }
  }
  return dots;
}
