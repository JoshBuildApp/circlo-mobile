import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        md: "2rem",
        lg: "3rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        // v2 font stack (opt-in via `font-v2` class — does not change v1 default)
        v2: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      spacing: {
        "token-0": "var(--space-0)",
        "token-px": "var(--space-px)",
        "token-0.5": "var(--space-0-5)",
        "token-1": "var(--space-1)",
        "token-1.5": "var(--space-1-5)",
        "token-2": "var(--space-2)",
        "token-3": "var(--space-3)",
        "token-4": "var(--space-4)",
        "token-5": "var(--space-5)",
        "token-6": "var(--space-6)",
        "token-8": "var(--space-8)",
        "token-10": "var(--space-10)",
        "token-12": "var(--space-12)",
        "token-16": "var(--space-16)",
        "token-20": "var(--space-20)",
        "token-24": "var(--space-24)",
      },
      fontSize: {
        "token-xs": ["var(--text-xs)", { lineHeight: "var(--leading-normal)" }],
        "token-sm": ["var(--text-sm)", { lineHeight: "var(--leading-normal)" }],
        "token-base": ["var(--text-base)", { lineHeight: "var(--leading-normal)" }],
        "token-lg": ["var(--text-lg)", { lineHeight: "var(--leading-snug)" }],
        "token-xl": ["var(--text-xl)", { lineHeight: "var(--leading-snug)" }],
        "token-2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-tight)" }],
        "token-3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-tight)" }],
        "token-4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-none)" }],
        "token-5xl": ["var(--text-5xl)", { lineHeight: "var(--leading-none)" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: "hsl(var(--success))",
        // Supporting palette
        amber: {
          warm: "hsl(var(--amber-warm))",
          "warm-light": "hsl(var(--amber-warm-light))",
        },
        indigo: {
          depth: "hsl(var(--indigo-depth))",
          light: "hsl(var(--indigo-light))",
        },
        "slate-blue": "hsl(var(--slate-blue))",
        "light-teal": "hsl(var(--light-teal))",
        "light-orange": "hsl(var(--light-orange))",
        "deep-navy": "hsl(var(--deep-navy))",
        "table-stripe": "hsl(var(--table-stripe))",
        // Landing page palette (v1) + v2 UI tokens (additive)
        teal: {
          DEFAULT: "#00D4AA",
          dark: "#00B892",
          soft: "#00D4AA33",
          dim: "#00D4AA1A",
        },
        orange: {
          DEFAULT: "#FF6B2C",
          dark: "#E55A1B",
          soft: "#FF6B2C33",
          dim: "#FF6B2C1A",
        },
        "navy-deep": "#0A0A0F",
        "navy-card": "#1A1A2E",
        "navy-card-2": "#21213A",
        "navy-line": "#2A2A42",
        "navy-light": "#252542",
        // v2 muted tones (dark-theme aware; shadcn `muted` semantic preserved)
        "v2-muted": "#9A9AB0",
        "v2-muted-2": "#6B6B80",
        offwhite: "#F5F2EC",
        danger: "#FF4D6D",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "1.5rem",
        // v2 radii
        card: "18px",
        pill: "999px",
      },
      boxShadow: {
        "card": "0 2px 8px 0 rgba(26, 26, 46, 0.04)",
        "card-hover": "0 4px 16px -2px rgba(26, 26, 46, 0.08)",
        "elevated": "0 8px 24px -4px rgba(26, 26, 46, 0.10)",
        "soft": "0 1px 4px 0 rgba(26, 26, 46, 0.04)",
        "nav": "0 -1px 8px 0 rgba(26, 26, 46, 0.03)",
        "brand": "0 4px 16px -4px rgba(26, 26, 46, 0.12)",
        "brand-sm": "0 2px 8px -2px rgba(26, 26, 46, 0.08)",
        "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.04)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "page-enter": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.99)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "like-pop": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.3)" },
          "50%": { transform: "scale(0.9)" },
          "70%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up-spring": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "page-enter": "page-enter 0.25s ease-out forwards",
        "like-pop": "like-pop 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
        "bounce-in": "bounce-in 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards",
        "slide-up-spring": "slide-up-spring 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
