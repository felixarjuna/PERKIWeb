import { type Page, test } from "@playwright/test";

/** Where `pnpm screenshots` writes and `pnpm screenshots:publish` reads. */
export const SCREENSHOT_DIR = "screenshots";

/**
 * Saves a full-page screenshot as `<name>-<phone|desktop>.png` once the page
 * has settled. `name` is kebab-case and becomes the row label in the PR.
 */
export const shoot = async (page: Page, name: string) => {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${SCREENSHOT_DIR}/${name}-${test.info().project.name}.png`,
  });
};
