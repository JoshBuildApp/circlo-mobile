import { useTheme, type ThemeName } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const SWATCHES: { id: ThemeName; label: string; bg: string; primary: string }[] = [
  { id: "light",  label: "Light",  bg: "#F8F7F4", primary: "#FF6B2C" },
  { id: "dark",   label: "Dark",   bg: "#0F172A", primary: "#FF6B2C" },
  { id: "ocean",  label: "Ocean",  bg: "#F0FDFA", primary: "#0D9488" },
  { id: "sunset", label: "Sunset", bg: "#FFFBF5", primary: "#EA580C" },
];

interface ThemeSwitcherProps {
  /** "row" for settings page, "grid" for dropdown */
  layout?: "row" | "grid";
  className?: string;
}

const ThemeSwitcher = ({ layout = "row", className }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        layout === "row" ? "flex items-center gap-4" : "grid grid-cols-4 gap-3",
        className
      )}
    >
      {SWATCHES.map((s) => {
        const active = theme === s.id;
        return (
          <button
            key={s.id}
            onClick={() => setTheme(s.id)}
            className="flex flex-col items-center gap-1.5 group outline-none"
            aria-label={`Switch to ${s.label} theme`}
          >
            {/* split-circle swatch */}
            <div
              className={cn(
                "h-9 w-9 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-background transition-all duration-200",
                active ? "ring-primary scale-110" : "ring-transparent group-hover:ring-muted"
              )}
            >
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path d="M18 0 A18 18 0 0 1 18 36 Z" fill={s.bg} />
                <path d="M18 0 A18 18 0 0 0 18 36 Z" fill={s.primary} />
              </svg>
            </div>
            <span
              className={cn(
                "text-[11px] font-medium transition-colors duration-200",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
