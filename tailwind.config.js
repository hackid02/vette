/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0D0B",
        panel: "#10140F",
        line: "#1E241F",
        vet: "#C6FF4A",
        warn: "#FFB020",
        danger: "#FF5A65",
        muted: "#7E857C",
        soft: "#E4E7DF",
        cream: "#F4F1E6",
      },
      fontFamily: {
        mono: ["Space Mono", "ui-monospace", "Menlo", "Consolas", "monospace"],
        serif: ["Fraunces", "Georgia", "Times New Roman", "serif"],
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
