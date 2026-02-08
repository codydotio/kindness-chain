import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        alien: {
          50: "#f0f7ff",
          100: "#dfeeff",
          200: "#b8dcff",
          300: "#79c0ff",
          400: "#3a9eff",
          500: "#0b76ef",
          600: "#005bcc",
          700: "#0048a5",
          800: "#053d88",
          900: "#0a3470",
          950: "#07214a",
        },
        kindness: {
          glow: "#FFD700",
          warm: "#FF8C42",
          heart: "#FF4B6E",
          aurora: "#7B61FF",
          cosmic: "#00D4AA",
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
