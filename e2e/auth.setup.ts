import { expect, test as setup } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { MEMBER, MEMBER_STORAGE_STATE } from "./fixtures";

setup("prepare the seeded Google member session", async ({ page }) => {
  await setTestSession(page, MEMBER);
  await page.goto("/account");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    MEMBER.name
  );
  await page.context().storageState({ path: MEMBER_STORAGE_STATE });
});
