import { defineConfig, devices } from "@playwright/test";
import { assertLocalDatabase, BASE_URL, e2eEnv } from "./e2e/env";

assertLocalDatabase(e2eEnv.DATABASE_URL);

/**
 * PR screenshots (`pnpm screenshots`): runs `e2e/screenshots/current.shots.ts`
 * against the same throwaway database and build as `pnpm test:e2e`, once per
 * screen size. Tests tagged `@seed` run once first, so data is created once
 * for both sizes. Images land in `screenshots/`.
 */
export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  outputDir: "./test-results/screenshots",
  projects: [
    { grep: /@seed/, name: "seed" },
    {
      dependencies: ["seed"],
      grepInvert: /@seed/,
      name: "phone",
      use: {
        ...devices["Desktop Chrome"],
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
        viewport: { height: 844, width: 390 },
      },
    },
    {
      dependencies: ["seed"],
      grepInvert: /@seed/,
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 800, width: 1280 },
      },
    },
  ],
  reporter: "list",
  testDir: "./e2e/screenshots",
  testMatch: /\.shots\.ts$/,
  use: {
    baseURL: BASE_URL,
    locale: "en-GB",
    timezoneId: "Europe/Berlin",
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
