import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import { schadcnPreset } from "./schadcn-preset";

const config: Config = {
  presets: [schadcnPreset],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        satoshi: ["var(--font-satoshi)", "sans-serif", ...fontFamily.sans],
        reimbrandt: ["var(--font-reimbrandt)", "serif", ...fontFamily.serif],
      },
      colors: {
        cream: {
          50: "#f7f7f5",
          100: "#eae9e3",
          200: "#dad7ce",
          300: "#c2beaf",
          400: "#a9a28e",
          500: "#988e77",
          600: "#8b7f6b",
          700: "#74695a",
          800: "#60574c",
          900: "#4f483f",
          950: "#292521",
          default: "#d7dfcb",
        },
        "light-green": {
          50: "#f4f6ef",
          100: "#e6ebdc",
          200: "#d9e1cc",
          300: "#b0c096",
          400: "#92a774",
          500: "#758c56",
          600: "#5b6e42",
          700: "#475536",
          800: "#3a462e",
          900: "#333d2a",
          950: "#1a2013",
          default: "#d9e1cc",
        },
        green: {
          50: "#f5f8f7",
          100: "#dee9e7",
          200: "#bcd3ce",
          300: "#92b6af",
          400: "#6b968f",
          500: "#517b75",
          600: "#3f625e",
          700: "#37524f",
          800: "#2e413f",
          900: "#293836",
          950: "#141f1f",
          default: "#37524f",
        },
        "dark-green": {
          50: "#ecfdf7",
          100: "#d2f9ea",
          200: "#a8f2da",
          300: "#70e5c7",
          400: "#37d0ad",
          500: "#13b696",
          600: "#08937b",
          700: "#067665",
          800: "#085d50",
          900: "#074d43",
          950: "#021f1c",
          default: "#031f1c",
        },
      },
      animations: {
        marquee: "marquee 30s linear infinite",
        marquee2: "marquee2 20s linear infinite",
        rotate: "rotate 20s infinite",
        blob: "blob 7s infinite",
        "gradient-x": "gradient-x 10s ease infinite",
        "gradient-y": "gradient-y 10s ease infinite",
        "gradient-xy": "gradient-xy 10s ease infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "50%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0%)" },
        },
        marquee2: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0%)" },
        },
        rotate: {
          from: { rotate: "0deg" },
          "50%": { scale: "1 1.5" },
          to: { rotate: "360deg" },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(50%, -50%) scale(1.1)",
          },
          "66%": {
            transform: "translate(-40px, 40px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        "gradient-y": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "center top",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "center center",
          },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
