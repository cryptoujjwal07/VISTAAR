/** @type {import('tailwindcss').Config} */
const SANS_STACK = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  '"Noto Sans"',
  "sans-serif",
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
  '"Noto Color Emoji"',
];

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vistaar: {
          bg: "#F0F8FF",         // Alice Blue / Polar Ice Snow base
          surface: "#FFFFFF",    // Pure frost white surface
          text: "#0F172A",       // Deep polar navy text
          muted: "#475569",      // Polar slate glacier mist text
          border: "#BAE6FD",     // Luminous sky/ice border
          primary: "#0284C7",    // Arctic Blue
          scientific: "#0E7490", // Polar Glacier Cyan / Scientific Teal
          success: "#059669",    // Glacier emerald
          warning: "#D97706",    // Amber expedition caution
          danger: "#DC2626",     // Alert crimson
          icewhite: "#FFFFFF",
          snowwhite: "#F8FBFF",
          arcticblue: "#0284C7",
          glacialcyan: "#06B6D4",
          polarnavy: "#03172E",
          frostedblue: "#E0F2FE",
          scientificteal: "#0E7490",
        },
      },
      fontFamily: {
        sans: SANS_STACK,
        serif: SANS_STACK,
        heading: SANS_STACK,
      },
      boxShadow: {
        "ice-glass": "0 14px 44px -10px rgba(2, 132, 199, 0.14), inset 0 1px 2px 0 rgba(255, 255, 255, 0.95)",
        "ice-glow": "0 0 35px -5px rgba(56, 189, 248, 0.35)",
        "ice-card": "0 10px 36px -8px rgba(14, 116, 144, 0.12), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)",
      },
    },
  },
  plugins: [],
};
