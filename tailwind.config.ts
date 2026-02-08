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
        ignite: {
          flame: "#FF8C42",
          ember: "#FF4B6E",
          gold: "#FFD700",
          glow: "#FFA726",
          void: "#0a0a1a",
          surface: "#12122a",
          cosmic: "#7B61FF",
          teal: "#00D4AA",
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
