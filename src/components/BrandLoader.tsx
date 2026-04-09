import { cn } from "@/lib/utils";

interface BrandLoaderProps {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE = { sm: 48, md: 72, lg: 96 };
const DOT = { sm: 6, md: 8, lg: 10 };

const BrandLoader = ({ text = "Loading your experience", className, size = "md" }: BrandLoaderProps) => {
  const s = SIZE[size];
  const d = DOT[size];
  const r = s / 2;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-5", className)}>
      <div className="relative" style={{ width: s, height: s }}>
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{ background: "var(--brand-gradient)" }}
        />

        {/* Orbit ring 1 — outer, slow */}
        <svg
          className="absolute inset-0"
          width={s}
          height={s}
          viewBox={`0 0 ${s} ${s}`}
          style={{ animation: "brand-orbit 3.5s linear infinite" }}
        >
          <circle
            cx={r}
            cy={r}
            r={r - 4}
            fill="none"
            stroke="url(#grad1)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray={`${(r - 4) * 1.8} ${(r - 4) * 4.5}`}
          />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FF6B2C" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>

        {/* Orbit ring 2 — middle, medium speed, reverse */}
        <svg
          className="absolute inset-0"
          width={s}
          height={s}
          viewBox={`0 0 ${s} ${s}`}
          style={{ animation: "brand-orbit 2.4s linear infinite reverse" }}
        >
          <circle
            cx={r}
            cy={r}
            r={r - 12}
            fill="none"
            stroke="url(#grad2)"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeDasharray={`${(r - 12) * 1.2} ${(r - 12) * 5}`}
          />
          <defs>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF6B2C" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00D4AA" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Orbiting dot */}
        <div
          className="absolute"
          style={{
            width: d * 0.7,
            height: d * 0.7,
            top: 2,
            left: r - d * 0.35,
            transformOrigin: `${d * 0.35}px ${r - 2}px`,
            animation: "brand-orbit 2.4s linear infinite",
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{ background: "hsl(var(--accent))", opacity: 0.6 }}
          />
        </div>

        {/* Center dot with pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div
              className="rounded-full"
              style={{
                width: d,
                height: d,
                background: "var(--brand-gradient)",
                animation: "brand-pulse 2s ease-in-out infinite",
              }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-30 blur-sm"
              style={{ background: "var(--brand-gradient)" }}
            />
          </div>
        </div>
      </div>

      {text && (
        <p
          className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground/50 font-medium"
          style={{ animation: "brand-text-fade 2.5s ease-in-out infinite" }}
        >
          {text}
        </p>
      )}

      <style>{`
        @keyframes brand-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes brand-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }
        @keyframes brand-text-fade {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default BrandLoader;
