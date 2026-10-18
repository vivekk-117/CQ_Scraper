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
        app: "#F7F8FA",
        surface: "#FFFFFF",
        secondary: "#F1F3F5",
        border: {
          DEFAULT: "#E2E6EA",
          subtle: "#F1F3F5",
        },
        action: {
          DEFAULT: "#2457C5",
          hover: "#1B44A0",
        },
        sponsor: {
          DEFAULT: "#087F8C",
          bg: "#E6F6F8",
        },
        delegation: {
          DEFAULT: "#6B4DB3",
          bg: "#F2EEFA",
        },
        success: {
          DEFAULT: "#18794E",
          bg: "#EBF8F1",
        },
        warning: {
          DEFAULT: "#946200",
          bg: "#FEF7E8",
        },
        error: {
          DEFAULT: "#B42318",
          bg: "#FEE4E2",
        },
        text: {
          primary: "#17202A",
          secondary: "#5F6B76",
          muted: "#77818B",
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
