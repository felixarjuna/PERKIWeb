import { expect, test } from "@playwright/test";
import { adminLogin, createSignedInUser, toast } from "./helpers";

const WHATSAPP = "https://chat.whatsapp.com/E2eGroupLink";

test("the welcome step comes once on the next app page, then returns there", async ({
  page,
}) => {
  await createSignedInUser(page, "welcome", { welcome: true });

  // The landing page never redirects (its navigation hides behind the hero,
  // so wait for the session and profile requests instead).
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/");

  await page.goto("/schedule");
  await expect(page).toHaveURL("/welcome?callbackUrl=%2Fschedule");
  await expect(
    page.getByRole("heading", { level: 1, name: "Welcome, welcome" })
  ).toBeVisible();
  await page.getByLabel("Where you live", { exact: true }).fill("Aachen");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL("/schedule");

  const reminder = page.getByRole("complementary", {
    name: "Complete your profile",
  });
  await expect(reminder).toContainText("Your profile is 1 of 5 done");
  await expect(
    page.getByRole("button", { name: "Account, profile incomplete" })
  ).toBeVisible();

  // Seen once: the next page doesn't send them back.
  await page.goto("/prayers");
  await expect(page).toHaveURL("/prayers");
});

test("skipping the welcome step is remembered", async ({ page }) => {
  await createSignedInUser(page, "skipper", { welcome: true });
  await page.goto("/prayers");
  await expect(page).toHaveURL("/welcome?callbackUrl=%2Fprayers");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page).toHaveURL("/prayers");
  await page.goto("/takeaway");
  await expect(page).toHaveURL("/takeaway");
});

test("members complete their profile on /account and unlock WhatsApp", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/settings/integrations");
  await page
    .getByRole("button", { name: "Change the WhatsApp group link" })
    .click();
  const settingsDialog = page.getByRole("dialog");
  await settingsDialog.getByRole("textbox").fill(WHATSAPP);
  await settingsDialog.getByRole("button", { name: "Save" }).click();
  await expect(toast(page, "WhatsApp group link saved")).toBeVisible();

  const user = await createSignedInUser(page, "completer");
  await page.goto("/member/join");
  await expect(page).toHaveURL("/account");
  await expect(
    page.getByText("Unlocks once your profile is complete")
  ).toBeVisible();

  const fields = [
    ["Birthday", "2000-03-15"],
    ["Where you live", "Aachen"],
    ["Address", "Roermonder Str. 110"],
    ["Studies", "Maschinenbau"],
  ] as const;
  for (const [label, value] of fields) {
    // biome-ignore lint/performance/noAwaitInLoops: one dialog at a time.
    await page.getByRole("button", { name: `${label} Add` }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(label, { exact: true }).fill(value);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toBeHidden();
  }
  await page.getByRole("button", { name: "Phone Add" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Phone", { exact: true })
    .pressSequentially("15112345678");
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await expect(page.getByText("5 of 5")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Join the WhatsApp group" })
  ).toHaveAttribute("href", WHATSAPP);
  await expect(
    page.getByRole("button", { exact: true, name: "Account" })
  ).toBeVisible();

  // Staff see the account as complete.
  await adminLogin(page);
  await page.goto(
    `/admin/members?q=${encodeURIComponent(user.name)}&profile=complete`
  );
  await expect(
    page.getByRole("row").filter({ hasText: user.name })
  ).toContainText("Complete");
});

test("staff see accounts that haven't started a profile", async ({ page }) => {
  const user = await createSignedInUser(page, "notstarted");
  await adminLogin(page);
  await page.goto(
    `/admin/members?q=${encodeURIComponent(user.name)}&profile=not-started`
  );
  const row = page.getByRole("row").filter({ hasText: user.name });
  await expect(row).toContainText("Not started");
  await row.getByRole("button", { exact: true, name: user.name }).click();
  await expect(page.getByRole("dialog")).toContainText("Profile not started");
});
