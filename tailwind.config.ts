import type { Config } from "tailwindcss";

import { schadcnPreset } from "./schadcn-preset";

const config = {
  presets: [schadcnPreset],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
} satisfies Config;

export default config;
