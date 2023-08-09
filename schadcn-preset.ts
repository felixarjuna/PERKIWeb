import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";
import { schadcnPlugin } from "./schadcn-plugin";

export const schadcnPreset = {
  content: [],
  plugins: [animatePlugin, schadcnPlugin],
} satisfies Config;
