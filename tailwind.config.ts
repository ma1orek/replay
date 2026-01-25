import type { Config } from "tailwindcss";
// @ts-ignore - tailwindcss internal module
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // === SHADCN CSS VARIABLE MAPPINGS ===
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
        
        // === PREMIUM DARK THEME ===
        
        // Backgrounds - Deep blacks with subtle blue tint
        surface: {
          0: "#0a0a0f",      // Deepest - main bg
          1: "#0f0f18",      // Elevated - gradient bottom
          2: "#14141e",      // Cards base
          3: "#1a1a26",      // Cards hover
          4: "#22222e",      // Elevated cards
        },
        
        // Glass backgrounds (with alpha for backdrop-blur)
        glass: {
          card: "rgba(25, 25, 30, 0.6)",
          "card-hover": "rgba(30, 30, 38, 0.7)",
          sidebar: "rgba(20, 20, 25, 0.8)",
          input: "rgba(255, 255, 255, 0.03)",
          elevated: "rgba(15, 15, 20, 0.9)",
        },
        
        // Accent colors
        accent: {
          orange: "#FF6E3C",
          "orange-hover": "#FF8F5C",
          "orange-glow": "rgba(255, 110, 60, 0.25)",
          blue: "#3B82F6",
          "blue-hover": "#60A5FA",
          "blue-glow": "rgba(59, 130, 246, 0.2)",
          purple: "#8B5CF6",
          "purple-glow": "rgba(139, 92, 246, 0.2)",
        },
        
        // Borders
        border: {
          DEFAULT: "var(--border)",
          subtle: "rgba(255, 255, 255, 0.06)",
          default: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.12)",
          focus: "rgba(255, 110, 60, 0.4)",
        },
        
        // Text colors
        text: {
          primary: "#fafafa",
          secondary: "rgba(255, 255, 255, 0.7)",
          muted: "rgba(255, 255, 255, 0.4)",
          disabled: "rgba(255, 255, 255, 0.25)",
        },
        
        // Status colors
        status: {
          success: "#10B981",
          "success-bg": "rgba(16, 185, 129, 0.15)",
          error: "#EF4444",
          "error-bg": "rgba(239, 68, 68, 0.15)",
          warning: "#F59E0B",
          "warning-bg": "rgba(245, 158, 11, 0.15)",
          info: "#3B82F6",
          "info-bg": "rgba(59, 130, 246, 0.15)",
        },
        
        // Chart colors
        chart: {
          blue: "#3B82F6",
          orange: "#FF6E3C",
          green: "#10B981",
          purple: "#8B5CF6",
          cyan: "#06B6D4",
        },
      },
      
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        "data-lg": ["32px", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "data-xl": ["48px", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      
      borderRadius: {
        "sm": "8px",
        "md": "12px",
        "lg": "16px",
        "xl": "20px",
        "2xl": "24px",
      },
      
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "20px",
        xl: "32px",
        "2xl": "48px",
      },
      
      boxShadow: {
        "glass": "0 4px 16px rgba(0, 0, 0, 0.3)",
        "glass-lg": "0 8px 32px rgba(0, 0, 0, 0.4)",
        "glass-xl": "0 12px 48px rgba(0, 0, 0, 0.5)",
        "glow-orange": "0 0 40px rgba(255, 110, 60, 0.15)",
        "glow-orange-lg": "0 0 60px rgba(255, 110, 60, 0.25)",
        "glow-blue": "0 0 40px rgba(59, 130, 246, 0.1)",
        "btn-primary": "0 4px 20px rgba(255, 110, 60, 0.35)",
        "btn-primary-hover": "0 8px 32px rgba(255, 110, 60, 0.45)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.4)",
        "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
      },
      
      animation: {
        // Existing
        marquee: "marquee 30s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "recording": "recording 1.5s ease-in-out infinite",
        
        // New premium animations
        "gradient-shift": "gradientShift 3s ease infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "border-glow": "borderGlow 3s ease-in-out infinite",
        "skeleton": "skeletonPulse 1.5s ease-in-out infinite",
        
        // Aurora
        aurora: "aurora 60s linear infinite",
        "aurora-slow": "aurora 90s linear infinite",
        "aurora-fast": "aurora 40s linear infinite reverse",
        grid: "grid 15s linear infinite",
        
        // Shimmer button
        "shimmer-slide": "shimmer-slide var(--speed) ease-in-out infinite alternate",
        "spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
      },
      
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(99, 102, 241, 0.6)" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        recording: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        
        // New premium keyframes
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(255, 255, 255, 0.08)" },
          "50%": { borderColor: "rgba(255, 110, 60, 0.3)" },
        },
        skeletonPulse: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        
        // Aurora
        aurora: {
          from: { backgroundPosition: "50% 50%, 50% 50%" },
          to: { backgroundPosition: "350% 50%, 350% 50%" },
        },
        grid: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
        
        // Shimmer button
        "spin-around": {
          "0%": { transform: "translateZ(0) rotate(0)" },
          "15%, 35%": { transform: "translateZ(0) rotate(90deg)" },
          "65%, 85%": { transform: "translateZ(0) rotate(270deg)" },
          "100%": { transform: "translateZ(0) rotate(360deg)" },
        },
        "shimmer-slide": {
          to: { transform: "translate(calc(100cqw - 100%), 0)" },
        },
      },
      
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-dark": "linear-gradient(180deg, #0a0a0f 0%, #0f0f18 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%)",
        "gradient-orange": "linear-gradient(135deg, #FF6E3C 0%, #FF8F5C 100%)",
        "gradient-blue": "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
        "grid-pattern": `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        "shimmer": "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)",
      },
      
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
      },
    },
  },
  plugins: [
    // Plugin to add Tailwind colors as CSS variables
    function addVariablesForColors({ addBase, theme }: { addBase: Function; theme: Function }) {
      const allColors = flattenColorPalette(theme("colors"));
      const newVars = Object.fromEntries(
        Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
      );
      addBase({
        ":root": newVars,
      });
    },
  ],
};

export default config;
