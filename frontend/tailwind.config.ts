import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#dde3dc",
        background: "#f7f8f5",
        foreground: "#17211d",
        primary: {
          DEFAULT: "#3C89D0",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#7c3f58",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#eef2ed",
          foreground: "#66736d",
        },
        destructive: {
          DEFAULT: "#b42318",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
