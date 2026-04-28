/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fafaf7",
        ink: "#1a1816",
        graphite: "#4a4744",
        rule: "#e8e5df",
        chip: {
          openBg:    "#eef0f2",  openText:    "#3a3936",
          paidBg:    "#e6efe8",  paidText:    "#2c4a35",
          cancelBg:  "#f0e6e6",  cancelText:  "#5c2a2a",
          reviewBg:  "#fbf0d6",  reviewText:  "#6b4a08",
        },
        amber: "#c47d00",
        forest: "#2c5e3f",
      },
      fontFamily: {
        sans: ['"Inter Tight"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.15rem" }],
        base: ["0.9rem", { lineHeight: "1.35rem" }],
      },
    },
  },
  plugins: [],
};

