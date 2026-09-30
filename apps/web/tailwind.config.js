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
          bg: "#FAF7F0",         // Warm ivory / glacial snow base
          surface: "#FFFFFF",    // Pure frost white surface
          text: "#17202A",       // Deep alpine charcoal text
          muted: "#5F6B76",      // Slate glacier mist text
          border: "#E7E0D5",     // Warm structural border
          primary: "#2563EB",    // Scientific Ice Blue
          scientific: "#0E7490", // Polar Glacier Cyan
          success: "#15803D",    // Forest green
          warning: "#B45309",    // Amber caution
          danger: "#B91C1C",     // Alert crimson
        },
      },
      fontFamily: {
        sans: SANS_STACK,
        serif: SANS_STACK,
        heading: SANS_STACK,
      },
    },
  },
  plugins: [],
};
