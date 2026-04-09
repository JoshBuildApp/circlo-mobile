import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type ThemeName = "light" | "dark" | "ocean" | "sunset";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "circlo-theme";

/* ── colour maps (HSL triples) keyed by CSS variable name ── */
const THEMES: Record<ThemeName, Record<string, string>> = {
  light: {
    "--background": "40 20% 97%",
    "--card": "0 0% 100%",
    "--card-foreground": "240 33% 14%",
    "--foreground": "240 33% 14%",
    "--muted": "220 4% 70%",
    "--muted-foreground": "215 16% 47%",
    "--border": "220 4% 82%",
    "--input": "220 4% 78%",
    "--primary": "18 100% 59%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "40 20% 95%",
    "--secondary-foreground": "240 33% 14%",
    "--accent": "5 100% 75%",
    "--accent-foreground": "0 0% 100%",
    "--success": "166 100% 39%",
    "--warning": "38 92% 50%",
    "--destructive": "0 84% 47%",
    "--destructive-foreground": "0 0% 100%",
    "--ring": "18 100% 59%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "240 33% 14%",
    "--sidebar-background": "0 0% 100%",
    "--sidebar-foreground": "240 33% 14%",
    "--sidebar-primary": "18 100% 59%",
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": "226 100% 97%",
    "--sidebar-accent-foreground": "244 63% 58%",
    "--sidebar-border": "220 4% 82%",
    "--sidebar-ring": "18 100% 59%",
    "--amber-warm": "38 92% 50%",
    "--amber-warm-light": "38 100% 94%",
    "--indigo-depth": "244 63% 58%",
    "--indigo-light": "226 100% 97%",
    "--slate-blue": "215 16% 47%",
    "--light-teal": "166 92% 90%",
    "--light-orange": "18 100% 96%",
    "--deep-navy": "222 47% 11%",
    "--table-stripe": "40 14% 97%",
  },
  dark: {
    "--background": "222 47% 11%",
    "--card": "217 33% 17%",
    "--card-foreground": "210 40% 96%",
    "--foreground": "210 40% 96%",
    "--muted": "217 19% 27%",
    "--muted-foreground": "215 20% 65%",
    "--border": "215 19% 27%",
    "--input": "215 19% 32%",
    "--primary": "18 100% 59%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "217 33% 20%",
    "--secondary-foreground": "210 40% 96%",
    "--accent": "5 100% 75%",
    "--accent-foreground": "0 0% 100%",
    "--success": "166 100% 39%",
    "--warning": "38 92% 50%",
    "--destructive": "0 84% 47%",
    "--destructive-foreground": "0 0% 100%",
    "--ring": "18 100% 59%",
    "--popover": "217 33% 17%",
    "--popover-foreground": "210 40% 96%",
    "--sidebar-background": "222 65% 4%",
    "--sidebar-foreground": "210 40% 96%",
    "--sidebar-primary": "18 100% 59%",
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": "217 33% 20%",
    "--sidebar-accent-foreground": "210 40% 96%",
    "--sidebar-border": "215 19% 27%",
    "--sidebar-ring": "18 100% 59%",
    "--amber-warm": "38 92% 50%",
    "--amber-warm-light": "38 80% 20%",
    "--indigo-depth": "244 63% 68%",
    "--indigo-light": "244 30% 22%",
    "--slate-blue": "215 16% 60%",
    "--light-teal": "166 40% 18%",
    "--light-orange": "18 40% 18%",
    "--deep-navy": "222 47% 11%",
    "--table-stripe": "217 30% 14%",
  },
  ocean: {
    "--background": "166 76% 97%",
    "--card": "0 0% 100%",
    "--card-foreground": "173 56% 19%",
    "--foreground": "173 56% 19%",
    "--muted": "174 60% 65%",
    "--muted-foreground": "174 60% 45%",
    "--border": "166 71% 90%",
    "--input": "166 60% 85%",
    "--primary": "173 83% 32%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "187 72% 45%",
    "--secondary-foreground": "0 0% 100%",
    "--accent": "170 76% 50%",
    "--accent-foreground": "0 0% 100%",
    "--success": "166 100% 39%",
    "--warning": "38 92% 50%",
    "--destructive": "0 84% 47%",
    "--destructive-foreground": "0 0% 100%",
    "--ring": "173 83% 32%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "173 56% 19%",
    "--sidebar-background": "175 82% 9%",
    "--sidebar-foreground": "166 71% 90%",
    "--sidebar-primary": "173 83% 32%",
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": "166 71% 90%",
    "--sidebar-accent-foreground": "173 56% 19%",
    "--sidebar-border": "175 60% 18%",
    "--sidebar-ring": "173 83% 32%",
    "--amber-warm": "38 92% 50%",
    "--amber-warm-light": "38 100% 94%",
    "--indigo-depth": "187 72% 45%",
    "--indigo-light": "166 76% 95%",
    "--slate-blue": "174 40% 45%",
    "--light-teal": "166 71% 90%",
    "--light-orange": "166 76% 95%",
    "--deep-navy": "175 82% 9%",
    "--table-stripe": "166 50% 97%",
  },
  sunset: {
    "--background": "33 100% 98%",
    "--card": "0 0% 100%",
    "--card-foreground": "17 80% 15%",
    "--foreground": "17 80% 15%",
    "--muted": "27 80% 65%",
    "--muted-foreground": "27 80% 48%",
    "--border": "27 80% 83%",
    "--input": "27 70% 78%",
    "--primary": "22 90% 48%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "347 77% 50%",
    "--secondary-foreground": "0 0% 100%",
    "--accent": "38 92% 50%",
    "--accent-foreground": "0 0% 100%",
    "--success": "166 100% 39%",
    "--warning": "38 92% 50%",
    "--destructive": "0 84% 47%",
    "--destructive-foreground": "0 0% 100%",
    "--ring": "22 90% 48%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "17 80% 15%",
    "--sidebar-background": "17 80% 15%",
    "--sidebar-foreground": "27 80% 83%",
    "--sidebar-primary": "22 90% 48%",
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": "27 80% 83%",
    "--sidebar-accent-foreground": "17 80% 15%",
    "--sidebar-border": "17 60% 25%",
    "--sidebar-ring": "22 90% 48%",
    "--amber-warm": "38 92% 50%",
    "--amber-warm-light": "38 100% 94%",
    "--indigo-depth": "347 77% 50%",
    "--indigo-light": "33 100% 95%",
    "--slate-blue": "27 40% 48%",
    "--light-teal": "27 80% 94%",
    "--light-orange": "33 100% 95%",
    "--deep-navy": "17 80% 15%",
    "--table-stripe": "33 60% 97%",
  },
};

/* brand-gradient tokens per theme */
const GRADIENTS: Record<ThemeName, Record<string, string>> = {
  light: {
    "--brand-gradient": "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))",
    "--brand-gradient-soft": "linear-gradient(135deg, hsl(18,100%,59%,0.08), hsl(5,100%,75%,0.04))",
    "--brand-gradient-hover": "linear-gradient(135deg, hsl(18,100%,52%), hsl(5,100%,68%))",
  },
  dark: {
    "--brand-gradient": "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))",
    "--brand-gradient-soft": "linear-gradient(135deg, hsl(18,100%,59%,0.12), hsl(5,100%,75%,0.06))",
    "--brand-gradient-hover": "linear-gradient(135deg, hsl(18,100%,52%), hsl(5,100%,68%))",
  },
  ocean: {
    "--brand-gradient": "linear-gradient(135deg, hsl(173,83%,32%), hsl(187,72%,45%))",
    "--brand-gradient-soft": "linear-gradient(135deg, hsl(173,83%,32%,0.08), hsl(187,72%,45%,0.04))",
    "--brand-gradient-hover": "linear-gradient(135deg, hsl(173,83%,28%), hsl(187,72%,38%))",
  },
  sunset: {
    "--brand-gradient": "linear-gradient(135deg, hsl(22,90%,48%), hsl(347,77%,50%))",
    "--brand-gradient-soft": "linear-gradient(135deg, hsl(22,90%,48%,0.08), hsl(347,77%,50%,0.04))",
    "--brand-gradient-hover": "linear-gradient(135deg, hsl(22,90%,42%), hsl(347,77%,44%))",
  },
};

function applyTheme(name: ThemeName) {
  const root = document.documentElement;
  const vars = THEMES[name];
  const grads = GRADIENTS[name];
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  for (const [k, v] of Object.entries(grads)) root.style.setProperty(k, v);
  // toggle .dark class for Tailwind dark-mode utilities
  if (name === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function detectDefault(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (stored && THEMES[stored]) return stored;
  } catch {}
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(detectDefault);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
    applyTheme(t);
  }, []);

  // Apply on mount
  useEffect(() => { applyTheme(theme); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

/** Logo gradient colours per theme */
export const LOGO_COLORS: Record<ThemeName, { from: string; mid: string; to: string; dot: string; dotEnd: string }> = {
  light:  { from: "#00D4AA", mid: "#5BA88A", to: "#FF6B2C", dot: "#FF6B2C", dotEnd: "#FF8A50" },
  dark:   { from: "#00D4AA", mid: "#5BA88A", to: "#FF6B2C", dot: "#FF6B2C", dotEnd: "#FF8A50" },
  ocean:  { from: "#0D9488", mid: "#0AADAC", to: "#06B6D4", dot: "#0D9488", dotEnd: "#06B6D4" },
  sunset: { from: "#EA580C", mid: "#E43A2F", to: "#E11D48", dot: "#EA580C", dotEnd: "#FF8A50" },
};
