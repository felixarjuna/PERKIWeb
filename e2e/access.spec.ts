import { expect, test } from "@playwright/test";
import { createTestAccount, setTestSession } from "./auth-fixtures";
import { adminLogin, toast } from "./helpers";

const ROLE_ROW_URL = /\/account#your-role$/;

test("a member asks to become a writer from /takeaway and a mita approves", async ({
  page,
}) => {
  const member = await createTestAccount("Asker");
  await setTestSession(page, member);

  await page.goto("/takeaway");
  await page.getByRole("link", { name: "Ask to become a writer" }).click();
  await expect(page).toHaveURL(ROLE_ROW_URL);
  const row = page.locator("#your-role");
  await expect(row).toContainText("Member");
  await row.getByRole("button", { name: "Ask to become a writer" }).click();
  await expect(row).toContainText("Request sent, waiting for a mita");

  await adminLogin(page);
  await page.goto("/admin/access");
  await page.getByRole("button", { name: `Approve ${member.name}` }).click();
  await expect(toast(page, `${member.name} is now a Writer.`)).toBeVisible();

  await setTestSession(page, member);
  await page.goto("/account");
  await expect(row).toContainText("Writer");
  await expect(row).toContainText(
    "Your request to become a writer was approved"
  );
  await page.goto("/takeaway");
  await expect(
    page.getByRole("link", { name: "Ask to become a writer" })
  ).toHaveCount(0);
});

test("a mita invites an email and can revoke it", async ({ page }) => {
  const email = `invitee-${Date.now()}@example.com`;
  await adminLogin(page);
  await page.goto("/admin/access");
  await page.getByLabel("Google email").fill(email);
  await page.getByRole("button", { exact: true, name: "Invite" }).click();
  await expect(toast(page, `Invited ${email}`)).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();

  await page
    .getByRole("button", { name: `Revoke the invite for ${email}` })
    .click();
  await expect(toast(page, `Revoked the invite for ${email}`)).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toHaveCount(0);
});
