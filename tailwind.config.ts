import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // WLFS design system
        background: "#0A0E14", // deep charcoal/navy
        gold: {
          DEFAULT: "#D4A94E", // metallic gold accent
          50: "#FBF6EA",
          100: "#F4E7C6",
          200: "#EBD69C",
          300: "#E1C472",
          400: "#D4A94E",
          500: "#C08F2E",
          600: "#9A7124",
          700: "#74551B",
          800: "#4E3912",
          900: "#281D09",
        },
        crimson: {
          DEFAULT: "#C0392B", // crimson accent
          50: "#F8E4E1",
          100: "#EFC0BB",
          200: "#E29A91",
          300: "#D57367",
          400: "#C84D3D",
          500: "#C0392B",
          600: "#992D22",
          700: "#73221A",
          800: "#4C1611",
          900: "#260B09",
        },
        offwhite: "#F5F1E8", // off-white text
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      backgroundImage: {
        "gold-metallic":
          "linear-gradient(135deg, #E1C472 0%, #D4A94E 45%, #9A7124 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
