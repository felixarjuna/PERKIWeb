import { expect, test as setup } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { MEMBER, MEMBER_STORAGE_STATE } from "./fixtures";

setup("prepare the seeded Google member session", async ({ page }) => {
  await setTestSession(page, MEMBER);
  await page.goto("/account");
  // The locked Name row shows the Google name once the session has loaded.
  await expect(page.getByRole("main")).toContainText(MEMBER.name);
  await page.context().storageState({ path: MEMBER_STORAGE_STATE });
});
