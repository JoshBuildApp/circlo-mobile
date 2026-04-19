import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type V2Theme = "dark" | "light";
const STORAGE_KEY = "circlo:v2_theme";

interface ThemeContextShape {
  theme: V2Theme;
  setTheme: (t: V2Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextShape | null>(null);

function readStoredTheme(): V2Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* noop */
  }
  // Fall back to system preference
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

export function V2ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<V2Theme>(() =>
    typeof window === "undefined" ? "dark" : readStoredTheme()
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  const setTheme = useCallback((next: V2Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    []
  );

  const value = useMemo<ThemeContextShape>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useV2Theme(): ThemeContextShape {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useV2Theme must be used inside <V2ThemeProvider>");
  return ctx;
}
