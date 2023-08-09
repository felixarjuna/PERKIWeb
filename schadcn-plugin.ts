import { fontFamily } from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

export const schadcnPlugin = plugin(
  // 1. Add CSS variable definitions to the base layer ✅
  function ({ addBase }) {
    addBase({
      ":root": {
        "--background": "174, 82%, 7%",
        "--foreground": "173, 28%, 19%",
        "--card": "174, 82%, 7%",
        "--card-foreground": "173, 28%, 19%",
        "--popover": "174, 82%, 7%",
        "--popover-foreground": "173, 28%, 19%",
        "--primary": "173, 28%, 19%",
        "--primary-foreground": "84, 24%, 84%",
        "--secondary": "84, 24%, 84%",
        "--secondary-foreground": "173, 28%, 19%",
        "--muted": "173, 23%, 23%",
        "--muted-foreground": "215.4 16.3% 46.9%",
        "--accent": "173, 23%, 23%",
        "--accent-foreground": "84, 24%, 75%",
        "--destructive": "320, 57%, 73%",
        "--destructive-foreground": "173, 28%, 19%",
        "--border": "84, 24%, 84%",
        "--input": "84, 24%, 84%",
        "--ring": "84, 24%, 84%",
        "--radius": "0.5rem",
      },
      ".dark": {
        "--background": "222.2 84% 4.9%",
        "--foreground": "210 40% 98%",
        "--card": "222.2 84% 4.9%",
        "--card-foreground": "210 40% 98%",
        "--popover": "222.2 84% 4.9%",
        "--popover-foreground": "210 40% 98%",
        "--primary": "210 40% 98%",
        "--primary-foreground": "222.2 47.4% 11.2%",
        "--secondary": "217.2 32.6% 17.5%",
        "--secondary-foreground": "210 40% 98%",
        "--muted": "217.2 32.6% 17.5%",
        "--muted-foreground": "215 20.2% 65.1%",
        "--accent": "217.2 32.6% 17.5%",
        "--accent-foreground": "210 40% 98%",
        "--destructive": "0 62.8% 30.6%",
        "--destructive-foreground": "210 40% 98%",
        "--border": "217.2 32.6% 17.5%",
        "--input": "217.2 32.6% 17.5%",
        "--ring": "hsl(212.7, 26.8%, 83.9)",
      },
    });

    addBase({
      "*": { "@apply border-border": {} },
      body: {
        "@apply bg-background text-foreground": {},
        "font-feature-settings": '"rlig" 1, "calt" 1',
      },
    });
  },
  // 2. Extend  the Tailwind theme with "themable" utilities
  {
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      screens: {
        xs: { min: "320px", max: "480px" },
        // mobile devices
        sm: { min: "481px", max: "767px" },
        // tablets
        md: { min: "768px", max: "1023px" },
        // ipad, ipad mini
        lg: { min: "1024px", max: "1279px" },
        // ipad air, ipad pro
        xl: { min: "1280px", max: "1535px" },
        // laptops
        "2xl": { min: "1536px" },
        // desktops
      },
      extend: {
        fontFamily: {
          lora: ["Lora", "serif"],
          satoshi: ["Satoshi-Medium", "sans-serif", ...fontFamily.sans],
          founders: ["FoundersGrotesk-Regular", "sans-serif", ...fontFamily.sans],
          reimbrandt: ["Reimbrandt-Regular", "serif", ...fontFamily.serif],
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
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
        animation: {
          marquee: "marquee 30s linear infinite",
          marquee2: "marquee2 20s linear infinite",
          rotate: "rotate 20s infinite",
          blob: "blob 7s infinite",
          "gradient-x": "gradient-x 10s ease infinite",
          "gradient-y": "gradient-y 10s ease infinite",
          "gradient-xy": "gradient-xy 10s ease infinite",
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
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
          "accordion-down": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
        },
      },
    },
  }
);
