import { expect, test } from "@playwright/test";
import { MEMBER_STORAGE_STATE } from "./fixtures";
import { waitForSession } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

const viewports = [
  { height: 720, width: 1280 },
  { height: 844, width: 390 },
] as const;

for (const viewport of viewports) {
  test(`member reminder leaves account actions usable at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/account");

    const reminder = page.getByRole("complementary", {
      name: "Member registration",
    });
    await expect(reminder).toBeVisible();
    await expect(
      reminder.getByRole("link", { name: "Register as a member" })
    ).toHaveAttribute("href", "/member/join");

    // Check actual pointer accessibility without signing out or dismissing
    // the reminder first. A floating reminder used to cover this button.
    await page.getByRole("button", { name: "Sign out" }).click({ trial: true });

    await page.goto("/member/join");
    await expect(page.getByLabel("Address", { exact: true })).toBeVisible();
    await waitForSession(page);
    await page.waitForLoadState("networkidle");
    await expect(reminder).toBeHidden();
    await page.goto("/account");
    await expect(reminder).toBeVisible();

    await reminder.getByRole("button", { name: "Dismiss" }).click();
    await expect(reminder).toBeHidden();
    await page.reload();
    // Wait for hydration and the profile query so initial loading cannot
    // make a broken persistence check pass while the reminder is still null.
    await waitForSession(page);
    await page.waitForLoadState("networkidle");
    await expect(reminder).toBeHidden();
  });
}
