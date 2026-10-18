/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#080B11",
        surface: {
          1: "#0F172A",
          2: "#1E293B",
          3: "#334155",
        },
        border: {
          subtle: "#1E293B",
          active: "#3B82F6",
        },
        brand: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
        },
        sponsor: {
          DEFAULT: "#14B8A6",
          bg: "rgba(20, 184, 166, 0.1)",
          border: "rgba(20, 184, 166, 0.2)",
        },
        delegation: {
          DEFAULT: "#8B5CF6",
          bg: "rgba(139, 92, 246, 0.1)",
          border: "rgba(139, 92, 246, 0.2)",
        },
        verified: {
          DEFAULT: "#10B981",
          bg: "rgba(16, 185, 129, 0.1)",
          border: "rgba(16, 185, 129, 0.2)",
        },
        derived: {
          DEFAULT: "#F59E0B",
          bg: "rgba(245, 158, 11, 0.1)",
          border: "rgba(245, 158, 11, 0.2)",
        },
        dead: {
          DEFAULT: "#F43F5E",
          bg: "rgba(244, 63, 94, 0.1)",
          border: "rgba(244, 63, 94, 0.2)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

