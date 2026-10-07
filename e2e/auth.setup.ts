import { expect, test as setup } from "@playwright/test";
import { MEMBER, MEMBER_STORAGE_STATE } from "./fixtures";

setup("sign in as the seeded member", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.getByLabel("Username").fill(MEMBER.email);
  await page.getByLabel("Password").fill(MEMBER.password);
  await page.getByRole("button", { exact: true, name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await page.context().storageState({ path: MEMBER_STORAGE_STATE });
});
