/**
 * CircloSplash — full-screen branded launch/loading screen.
 *
 * Shown on:
 *   • Initial app launch while AuthContext is resolving a saved session
 *   • Lazy-loaded route chunks (Suspense fallback)
 *   • Protected route auth check
 *   • Logout transition (natural, via AuthContext.signOut window.location reload)
 *
 * Design spec (from product image):
 *   • Huge gradient logo mark (teal → orange) with orbiting dot
 *   • "circlo" wordmark (lowercase, the way the brand renders it)
 *   • "FIND YOUR CIRCLE" tagline in teal, letter-spaced uppercase
 *   • Subtle sport-icon silhouettes ghosted at ~6% opacity in the corners
 *   • Small mini-logo loader spinning near the bottom
 *   • Dark (navy) or light (off-white) background, picks current theme
 */
import { useEffect, useState } from "react";

type SplashTheme = "auto" | "dark" | "light";

interface CircloSplashProps {
  /** Force a specific background. Defaults to reading `.dark` on <html>. */
  theme?: SplashTheme;
  /** Tagline under the wordmark. Defaults to "FIND YOUR CIRCLE". */
  tagline?: string;
  /** Root className for positioning tweaks. */
  className?: string;
}

const TEAL = "#00D4AA";
const ORANGE = "#FF6B2C";
const NAVY = "#14162B";
const LIGHT_BG = "#F7F7FA";

function resolveTheme(theme: SplashTheme): "dark" | "light" {
  if (theme === "dark" || theme === "light") return theme;
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const CircloSplash = ({
  theme = "auto",
  tagline = "FIND YOUR CIRCLE",
  className = "",
}: CircloSplashProps) => {
  const [mode, setMode] = useState<"dark" | "light">(() => resolveTheme(theme));

  // Re-read theme if it changes mid-mount (e.g. user toggles before auth resolves).
  useEffect(() => {
    if (theme !== "auto") return;
    const el = document.documentElement;
    const obs = new MutationObserver(() => setMode(resolveTheme("auto")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [theme]);

  const isDark = mode === "dark";
  const bg = isDark ? NAVY : LIGHT_BG;
  const wordColor = isDark ? "#FFFFFF" : "#14162B";
  const iconStroke = isDark ? "rgba(255,255,255,0.07)" : "rgba(20,22,43,0.06)";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Circlo"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden ${className}`}
      style={{ background: bg }}
    >
      {/* Radial glow behind logo — teal bleed → orange bleed */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 520,
          height: 520,
          background: `radial-gradient(circle at 38% 52%, ${TEAL}66 0%, transparent 58%),
                       radial-gradient(circle at 68% 48%, ${ORANGE}55 0%, transparent 55%)`,
          filter: "blur(48px)",
          opacity: isDark ? 0.85 : 0.45,
        }}
      />

      {/* Ghosted sport silhouettes in the corners */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Top-left — padel racket */}
        <svg
          viewBox="0 0 120 160"
          className="absolute"
          style={{ top: -20, left: -30, width: 180, color: iconStroke }}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <ellipse cx="60" cy="55" rx="42" ry="48" />
          <circle cx="60" cy="55" r="2.5" fill="currentColor" stroke="none" />
          <circle cx="48" cy="42" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="72" cy="42" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="48" cy="68" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="72" cy="68" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="60" cy="38" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="60" cy="72" r="1.5" fill="currentColor" stroke="none" />
          <rect x="55" y="100" width="10" height="50" rx="4" />
        </svg>

        {/* Top-right — basketball */}
        <svg
          viewBox="0 0 100 100"
          className="absolute"
          style={{ top: 40, right: -28, width: 140, color: iconStroke }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        >
          <circle cx="50" cy="50" r="42" />
          <path d="M50 8 V92" />
          <path d="M8 50 H92" />
          <path d="M18 22 Q50 50 82 22" />
          <path d="M18 78 Q50 50 82 78" />
        </svg>

        {/* Bottom-left — basketball (mirrored composition) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute"
          style={{ bottom: 60, left: -34, width: 150, color: iconStroke }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        >
          <circle cx="50" cy="50" r="42" />
          <path d="M50 8 V92" />
          <path d="M8 50 H92" />
          <path d="M18 22 Q50 50 82 22" />
          <path d="M18 78 Q50 50 82 78" />
        </svg>

        {/* Bottom-right — boxing glove */}
        <svg
          viewBox="0 0 120 130"
          className="absolute"
          style={{ bottom: -10, right: -20, width: 160, color: iconStroke }}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M30 30 Q30 10 55 10 Q90 10 95 40 Q100 65 90 80 Q85 95 80 105 L40 105 Q28 105 26 92 L20 55 Q18 30 30 30 Z" />
          <path d="M40 105 L40 120 Q40 125 45 125 L78 125 Q83 125 83 120 L83 105" />
          <path d="M30 30 Q45 28 55 38" />
        </svg>
      </div>

      {/* ────────  MAIN LOCK-UP  ──────── */}
      <div className="relative z-10 flex flex-col items-center" style={{ animation: "circlo-splash-in 600ms ease-out" }}>
        {/* Large logo mark — matches CircloLogo shape, scaled up + animated */}
        <svg
          viewBox="0 0 200 200"
          width={200}
          height={200}
          aria-hidden
          style={{ animation: "circlo-splash-breathe 3.2s ease-in-out infinite" }}
        >
          <defs>
            <linearGradient id="circloSplashRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={TEAL} />
              <stop offset="55%" stopColor={ORANGE} />
              <stop offset="100%" stopColor={ORANGE} />
            </linearGradient>
            <linearGradient id="circloSplashDot" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={TEAL} />
              <stop offset="100%" stopColor={ORANGE} />
            </linearGradient>
          </defs>
          {/* Open ring with a gap (same DNA as CircloLogo) */}
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="none"
            stroke="url(#circloSplashRing)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeDasharray="390 80"
            transform="rotate(-28 100 100)"
          />
          {/* Orbit group — rotates the dot around the ring */}
          <g style={{ transformOrigin: "100px 100px", animation: "circlo-splash-orbit 6s linear infinite" }}>
            <circle cx="160" cy="58" r="14" fill="url(#circloSplashDot)" />
          </g>
        </svg>

        {/* Wordmark */}
        <div
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontWeight: 800,
            fontSize: 72,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: wordColor,
            marginTop: 18,
          }}
        >
          circlo
        </div>

        {/* Tagline */}
        {tagline && (
          <div
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.36em",
              marginTop: 14,
              color: TEAL,
              textTransform: "uppercase",
            }}
          >
            {tagline}
          </div>
        )}
      </div>

      {/* Mini spinning logo — bottom loading indicator */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: "11%" }}
      >
        <svg
          viewBox="0 0 200 200"
          width={36}
          height={36}
          style={{ animation: "circlo-splash-spin 1.4s linear infinite" }}
        >
          <defs>
            <linearGradient id="circloSplashMiniRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={TEAL} />
              <stop offset="100%" stopColor={ORANGE} />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="none"
            stroke="url(#circloSplashMiniRing)"
            strokeWidth="26"
            strokeLinecap="round"
            strokeDasharray="390 80"
            transform="rotate(-28 100 100)"
          />
          <circle cx="160" cy="58" r="16" fill="url(#circloSplashMiniRing)" />
        </svg>
      </div>

      <style>{`
        @keyframes circlo-splash-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes circlo-splash-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes circlo-splash-breathe {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 18px ${TEAL}33); }
          50%      { transform: scale(1.03); filter: drop-shadow(0 0 28px ${ORANGE}55); }
        }
        @keyframes circlo-splash-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CircloSplash;
