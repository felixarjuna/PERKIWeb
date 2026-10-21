import { expect, test } from "@playwright/test";
import { MEMBER_STORAGE_STATE } from "./fixtures";
import { waitForSession } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

const viewports = [
  { height: 720, width: 1280 },
  { height: 844, width: 390 },
] as const;

for (const viewport of viewports) {
  test(`profile reminder leaves page actions usable and snoozes at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/prayers");

    const reminder = page.getByRole("complementary", {
      name: "Complete your profile",
    });
    await expect(reminder).toBeVisible();
    await expect(
      reminder.getByRole("link", { name: "Finish my profile" })
    ).toHaveAttribute("href", "/account");

    // Hidden on the profile page itself, which keeps its actions usable.
    await page.goto("/account");
    await waitForSession(page);
    await page.waitForLoadState("networkidle");
    await expect(reminder).toBeHidden();
    await page.getByRole("button", { name: "Sign out" }).click({ trial: true });

    await page.goto("/prayers");
    await reminder.getByRole("button", { name: "Remind me later" }).click();
    await expect(reminder).toBeHidden();
    await page.reload();
    // Wait for hydration and the profile query so initial loading cannot
    // make a broken persistence check pass while the reminder is still null.
    await waitForSession(page);
    await page.waitForLoadState("networkidle");
    await expect(reminder).toBeHidden();
    // The Account tab keeps its dot while the reminder is snoozed.
    await expect(
      page.getByRole("button", { name: "Account, profile incomplete" })
    ).toBeVisible();
  });
}
