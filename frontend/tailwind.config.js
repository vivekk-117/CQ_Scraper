/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,mdx}",
    "./components/**/*.{js,jsx,mdx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: "#F7F5F0",
        surface: "#FFFEFB",
        secondary: "#F2EFE9",
        border: {
          DEFAULT: "#E5E0D7",
          subtle: "#F2EFE9",
        },
        action: {
          DEFAULT: "#17664F",
          hover: "#125340",
          tint: "#E8F1EC",
        },
        sponsor: {
          DEFAULT: "#17664F",
          bg: "#E8F1EC",
        },
        delegation: {
          DEFAULT: "#5A4588",
          bg: "#F2EEFA",
        },
        success: {
          DEFAULT: "#17664F",
          bg: "#E8F1EC",
        },
        warning: {
          DEFAULT: "#8A5F00",
          bg: "#FDF4E2",
        },
        error: {
          DEFAULT: "#B42318",
          bg: "#FEECEB",
        },
        text: {
          primary: "#222722",
          secondary: "#69716C",
          muted: "#8C938E",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
