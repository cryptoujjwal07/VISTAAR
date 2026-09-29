/** @type {import('tailwindcss').Config} */
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
          bg: "#FAF7F0",       // Mandatory warm beige/ivory background
          surface: "#FFFFFF",  // Clean white cards and surfaces
          text: "#17202A",     // Primary dark charcoal text
          muted: "#5F6B76",    // Secondary slate text
          border: "#E7E0D5",   // Warm beige border
          primary: "#2563EB",  // Scientific Deep Blue
          scientific: "#0E7490", // Arctic / Polar Cyan
          success: "#15803D",  // Forest green
          warning: "#B45309",  // Amber caution
          danger: "#B91C1C",   // Alert crimson
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-merriweather)", "serif"],
      },
    },
  },
  plugins: [],
};
