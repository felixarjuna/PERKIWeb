import { defineConfig, devices } from "@playwright/test";
import { assertLocalDatabase, BASE_URL, e2eEnv } from "./e2e/env";

assertLocalDatabase(e2eEnv.DATABASE_URL);

const isCI = Boolean(process.env.CI);

export default defineConfig({
  forbidOnly: isCI,
  fullyParallel: true,
  globalSetup: "./e2e/global-setup.ts",
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      dependencies: ["setup"],
      name: "chromium",
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  retries: isCI ? 1 : 0,
  testDir: "./e2e",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.E2E_SKIP_BUILD
      ? "pnpm start"
      : "pnpm build && pnpm start",
    env: e2eEnv,
    reuseExistingServer: false,
    timeout: 300_000,
    url: BASE_URL,
  },
});
