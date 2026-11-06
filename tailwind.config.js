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
        background: "#08090a",
        surface: {
          DEFAULT: "#0f1114",
          subtle: "#14171c",
          elevated: "#1b2027",
          border: "#262d38",
        },
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          DEFAULT: "#00E676", // Vibrant athletic green
          glow: "#00FF66",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        athletic: {
          neon: "#00FF66",
          lime: "#22c55e",
          dark: "#0b120e",
          darker: "#060907",
        }
      },
      boxShadow: {
        'neon': '0 0 20px -2px rgba(0, 230, 118, 0.4)',
        'neon-strong': '0 0 30px 2px rgba(0, 255, 102, 0.6)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'athletic-grid': 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
};
