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
        // Replay Dark Theme - Inspired by Linear/VS Code
        surface: {
          0: "#0a0a0b",
          1: "#111113",
          2: "#18181b",
          3: "#1f1f23",
          4: "#27272b",
        },
        accent: {
          primary: "#6366f1",
          secondary: "#818cf8",
          tertiary: "#a5b4fc",
          glow: "rgba(99, 102, 241, 0.15)",
        },
        neural: {
          cyan: "#22d3ee",
          purple: "#a855f7",
          pink: "#ec4899",
          green: "#10b981",
          amber: "#f59e0b",
        },
        text: {
          primary: "#fafafa",
          secondary: "#a1a1aa",
          tertiary: "#71717a",
          muted: "#52525b",
        },
        border: {
          subtle: "#27272a",
          default: "#3f3f46",
          prominent: "#52525b",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "recording": "recording 1.5s ease-in-out infinite",
        // Aurora animations
        "aurora": "aurora 60s linear infinite",
        "aurora-slow": "aurora 90s linear infinite",
        "aurora-fast": "aurora 40s linear infinite reverse",
      },
      keyframes: {
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
        // Aurora keyframes - smooth background movement
        aurora: {
          "from": {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          "to": {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern": `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2327272a' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      },
    },
  },
  plugins: [
    // Plugin to add Tailwind colors as CSS variables (e.g., var(--blue-500))
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


