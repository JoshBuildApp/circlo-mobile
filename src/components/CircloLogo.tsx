import { useId } from "react";
import { useTheme, LOGO_COLORS } from "@/contexts/ThemeContext";

interface CircloLogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg" | number;
  theme?: "auto" | "light" | "dark" | "white";
  className?: string;
  tagline?: string;
}

const SIZE_MAP = { sm: 28, md: 36, lg: 48 } as const;
const GAP_MAP = { sm: 8, md: 10, lg: 12 } as const;

const DEFAULT_COLORS = LOGO_COLORS.light;

/**
 * Safe wrapper: useTheme throws if outside ThemeProvider.
 * CircloLogo can render in ErrorBoundary (outside providers),
 * so we catch and fall back to "light".
 */
function useSafeThemeColors() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { theme } = useTheme();
    return LOGO_COLORS[theme] || DEFAULT_COLORS;
  } catch {
    return DEFAULT_COLORS;
  }
}

const CircloLogo = ({
  variant = "full",
  size = "md",
  theme: themeProp = "auto",
  className = "",
  tagline,
}: CircloLogoProps) => {
  const uid = useId().replace(/:/g, "");
  const gradId = `circloGrad-${uid}`;
  const gradId2 = `circloGrad2-${uid}`;

  const colors = useSafeThemeColors();

  const px = typeof size === "number" ? size : SIZE_MAP[size];
  const sizeKey = typeof size === "number"
    ? (size <= 32 ? "sm" : size <= 40 ? "md" : "lg")
    : size;
  const gap = GAP_MAP[sizeKey];

  const isWhite = themeProp === "white";
  const isDark = themeProp === "dark";
  const isLight = themeProp === "light";

  const wordColor = isWhite
    ? "#FFFFFF"
    : isDark
      ? "#FFFFFF"
      : isLight
        ? "hsl(var(--foreground))"
        : "currentColor";

  const mark = (
    <svg
      viewBox="0 0 56 56"
      width={px}
      height={px}
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        {!isWhite && (
          <>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="50%" stopColor={colors.mid} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
            <linearGradient id={gradId2} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.dot} />
              <stop offset="100%" stopColor={colors.dotEnd} />
            </linearGradient>
          </>
        )}
      </defs>
      <circle
        cx="28"
        cy="28"
        r="21"
        fill="none"
        stroke={isWhite ? "#FFFFFF" : `url(#${gradId})`}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeDasharray="110 22"
      />
      <circle
        cx="45"
        cy="15"
        r="4.5"
        fill={isWhite ? "#FFFFFF" : `url(#${gradId2})`}
      />
    </svg>
  );

  if (variant === "icon") {
    return <span className={`inline-flex items-center ${className}`}>{mark}</span>;
  }

  const fontSize = Math.round(px * 0.6);
  const taglineSize = Math.round(px * 0.22);

  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap }}>
      {mark}
      <span className="flex flex-col">
        <span
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontWeight: 700,
            fontSize,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            color: wordColor,
          }}
        >
          Circlo
        </span>
        {tagline && (
          <span
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 600,
              fontSize: taglineSize,
              letterSpacing: "0.14em",
              lineHeight: 1,
              marginTop: 3,
              color: isWhite ? "rgba(255,255,255,0.7)" : colors.from,
              textTransform: "uppercase",
            }}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
};

export default CircloLogo;