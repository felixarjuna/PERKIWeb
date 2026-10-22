import { expect, test } from "@playwright/test";
import { uniqueSuffix } from "./fixtures";
import { adminLogin, toast } from "./helpers";

test("staff save email settings and can copy an invite when email is unavailable", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/settings/integrations");
  await expect(page.getByText("Not connected", { exact: true })).toBeVisible();
  const toggle = page.getByRole("switch", { name: "Send invite emails" });
  await page.getByLabel("Sender address").fill("invites@example.com");
  await toggle.check();
  await page.getByRole("button", { name: "Save email settings" }).click();
  await expect(toast(page, "Email settings saved")).toBeVisible();
  await page.reload();
  await expect(toggle).toBeChecked();
  await expect(page.getByLabel("Sender address")).toHaveValue(
    "invites@example.com"
  );

  const email = `invite-email-${uniqueSuffix()}@example.com`;
  await page.goto("/admin/access");
  await page.getByLabel("Google email").fill(email);
  await page.getByRole("button", { exact: true, name: "Invite" }).click();
  await expect(page.getByRole("status")).toContainText(
    `Invite saved for ${email}. No email was sent`
  );
  const row = page
    .getByRole("listitem")
    .filter({ has: page.getByText(email, { exact: true }) });
  await expect(
    row.getByRole("button", { name: "Copy invite message" })
  ).toBeVisible();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await row.getByRole("button", { name: "Copy invite message" }).click();
  await expect(toast(page, "Invite message copied")).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain(email);
  expect(copied).toContain("/auth/signin");

  await page.goto("/admin/settings/integrations");
  await toggle.uncheck();
  await page.getByRole("button", { name: "Save email settings" }).click();
  await expect(toast(page, "Email settings saved")).toBeVisible();
  await page.reload();
  await expect(toggle).not.toBeChecked();
});
