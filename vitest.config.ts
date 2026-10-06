import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "~": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: "node",
          exclude: ["src/server/**"],
          include: ["src/**/*.test.ts"],
          name: "unit",
        },
      },
      {
        extends: true,
        test: {
          environment: "node",
          include: ["src/server/**/*.test.ts"],
          name: "server",
          setupFiles: ["./src/test/setup-server.ts"],
        },
      },
      {
        extends: true,
        test: {
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          name: "dom",
          setupFiles: ["./src/test/setup-dom.ts"],
        },
      },
    ],
  },
});
