import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Welcome — guest landing screen.
 *
 * Faithful to the brand mockup: circlo ring logo (teal + orange arcs + dot),
 * lowercase wordmark, "FIND YOUR CIRCLE" tagline, sport-silhouette decor,
 * 3-dot progress indicator. Whole screen is tappable → /signup. Tiny
 * login / guest links at the very bottom so the layout stays quiet.
 */

/* ─── Logo: teal + orange arc ring with orange "i-dot" ──────────────────── */
function CircloRingLogo({ size = 128 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Circlo"
    >
      {/* Teal arc — roughly left + bottom (about 200°) */}
      <path
        d="M 94 24 A 48 48 0 1 0 104 88"
        stroke="#1fbf95"
        strokeWidth="16"
        strokeLinecap="round"
      />
      {/* Orange arc — right side (about 140°) */}
      <path
        d="M 104 88 A 48 48 0 0 0 98 36"
        stroke="#e85c1c"
        strokeWidth="16"
        strokeLinecap="round"
      />
      {/* Orange dot — sits like an "i" dot at top-right of the ring */}
      <circle cx="102" cy="22" r="8" fill="#e85c1c" />
    </svg>
  );
}

/* ─── Sport silhouette icons (line-art, low-opacity corner decor) ─────── */
const Racket = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 64 96" fill="none" className={className} aria-hidden>
    <ellipse cx="32" cy="28" rx="22" ry="24" stroke="currentColor" strokeWidth="2.5" />
    <g stroke="currentColor" strokeWidth="1" opacity="0.6">
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`h${i}`} x1="12" y1={16 + i * 5} x2="52" y2={16 + i * 5} />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`v${i}`} x1={18 + i * 5.5} y1="8" x2={18 + i * 5.5} y2="48" />
      ))}
    </g>
    <rect x="30" y="50" width="4" height="38" rx="2" stroke="currentColor" strokeWidth="2.5" />
    <rect x="27" y="78" width="10" height="14" rx="3" stroke="currentColor" strokeWidth="2.5" />
  </svg>
);

const Basketball = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden>
    <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="2.5" />
    <path d="M6 40 H74" stroke="currentColor" strokeWidth="2" />
    <path d="M40 6 V74" stroke="currentColor" strokeWidth="2" />
    <path d="M14 14 Q40 40 14 66" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M66 14 Q40 40 66 66" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const SoccerBall = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden>
    <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="2.5" />
    <polygon points="40,22 52,30 48,44 32,44 28,30" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M40 22 V8 M52 30 L64 24 M48 44 L60 52 M32 44 L20 52 M28 30 L16 24" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const BoxingGlove = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 64 80" fill="none" className={className} aria-hidden>
    <path
      d="M16 22 Q16 10 28 10 L42 10 Q54 10 54 24 L54 46 Q54 58 42 58 L30 58 Q24 58 22 52 L18 44 Q12 42 12 34 Q12 26 16 22 Z"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
    />
    <path d="M16 64 Q16 76 28 76 L44 76 Q54 76 54 64" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <path d="M22 30 Q28 32 34 30" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const Sneaker = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 96 48" fill="none" className={className} aria-hidden>
    <path
      d="M8 36 L8 28 Q8 22 16 20 L28 16 Q34 12 40 16 L56 26 Q64 30 78 30 L86 32 Q92 34 92 40 L92 42 Q92 44 90 44 L10 44 Q8 44 8 42 Z"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
    />
    <path d="M32 18 L38 26 M40 20 L46 28 M48 22 L54 30" stroke="currentColor" strokeWidth="2" />
    <path d="M8 38 H92" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const YogaPose = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 80 96" fill="none" className={className} aria-hidden>
    <circle cx="40" cy="16" r="8" stroke="currentColor" strokeWidth="2.5" />
    <path
      d="M40 26 Q40 40 40 52 M28 42 Q20 32 12 36 M52 42 Q60 32 68 36 M40 52 Q24 62 18 82 M40 52 Q56 62 62 82"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/signup")}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-between py-16 px-8 app-top-nav app-bottom-nav bg-background cursor-pointer select-none"
      role="button"
      aria-label="Tap to get started"
    >
      {/* Central soft glow — subtle teal + orange */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] h-80 w-80 rounded-full bg-[#1fbf95]/15 dark:bg-[#1fbf95]/20 blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-[40%] -translate-y-[45%] h-64 w-64 rounded-full bg-[#e85c1c]/12 dark:bg-[#e85c1c]/15 blur-[80px]" />
      </div>

      {/* Scattered sport silhouettes — low opacity, corner-placed */}
      <div className="pointer-events-none absolute inset-0 text-foreground/15 dark:text-foreground/20">
        <Racket className="absolute top-24 left-6 w-20 h-28 rotate-[-25deg]" />
        <Basketball className="absolute top-28 right-8 w-20 h-20" />
        <YogaPose className="absolute top-28 left-1/2 -translate-x-1/2 w-16 h-20 hidden sm:block" />
        <SoccerBall className="absolute bottom-32 right-6 w-20 h-20" />
        <Racket className="absolute bottom-36 right-14 w-20 h-28 rotate-[15deg]" />
        <BoxingGlove className="absolute bottom-40 left-6 w-16 h-20" />
        <Sneaker className="absolute bottom-28 left-1/2 -translate-x-1/2 w-24 h-12 hidden sm:block" />
      </div>

      {/* Spacer top */}
      <div className="h-4" />

      {/* Main cluster: ring logo + wordmark + tagline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="mb-8">
          <CircloRingLogo size={132} />
        </div>
        <h1 className="text-6xl md:text-7xl font-black lowercase text-foreground tracking-tight leading-none mb-4">
          circlo
        </h1>
        <p className="text-xs md:text-sm font-black uppercase tracking-[0.35em] text-[#1fbf95]">
          Find your circle
        </p>
      </motion.div>

      {/* Footer: progress dots + tiny auth affordances */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1fbf95]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
          <span className="w-2 h-2 rounded-full bg-[#e85c1c]" />
        </div>
        <div
          className="flex items-center gap-4 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Link to="/login" className="hover:text-foreground transition-colors">
            Log in
          </Link>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <Link to="/home" className="hover:text-foreground transition-colors">
            Continue as guest
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
