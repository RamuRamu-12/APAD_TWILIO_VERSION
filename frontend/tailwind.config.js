/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        heading: ['"Outfit"', "system-ui", "sans-serif"],
      },
      colors: {
        neon: {
          cyan: "#00f2fe",
          violet: "#8a2be2",
          emerald: "#10b981",
          rose: "#f43f5e",
        },
        apad: {
          50: "#eef4ff",
          100: "#dce8ff",
          500: "#4565f0",
          600: "#3348e6",
          700: "#2a38cb",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
