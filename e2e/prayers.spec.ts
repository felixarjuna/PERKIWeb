import { expect, test } from "@playwright/test";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, toast } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

test("prayer submission, publication, acknowledgement, editing and unpublication", async ({
  page,
  browser,
}) => {
  const content = `Prayer ${uniqueSuffix()}`;
  const edited = `Updated ${uniqueSuffix()}`;
  await page.goto("/prayers");
  await page.getByLabel("Prayer request").fill(content);
  await page.getByRole("button", { exact: true, name: "Add" }).click();
  await expect(toast(page, "Your prayer is submitted!")).toBeVisible();
  await expect(
    page.getByRole("listitem").filter({ hasText: content })
  ).toHaveCount(0);
  await adminLogin(page);
  await page.goto("/admin/prayers");
  const item = page.getByRole("listitem").filter({ hasText: content });
  await expect(item).toContainText("Private");
  await item.getByRole("button", { name: "Publish prayer" }).click();
  await expect(item).toContainText("Published");
  const anonymous = await browser.newContext();
  const publicPage = await anonymous.newPage();
  await publicPage.goto("/prayers");
  await expect(
    publicPage.getByRole("listitem").filter({ hasText: content })
  ).toBeVisible();
  await expect(
    publicPage.getByRole("button", { exact: true, name: "Edit" })
  ).toHaveCount(0);
  await page.goto("/prayers");
  const request = page.getByRole("listitem").filter({ hasText: content });
  await request.getByRole("button", { name: "Pray with them" }).click();
  await expect(request).toContainText("1 praying");
  await page.reload();
  await expect(
    request.getByRole("button", { name: "Praying with you" })
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/admin/prayers");
  await item.getByRole("button", { exact: true, name: "Edit" }).click();
  await page.getByRole("dialog").getByLabel("Prayer content").fill(edited);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const updated = page.getByRole("listitem").filter({ hasText: edited });
  await updated.getByRole("button", { name: "Return to private" }).click();
  await expect(updated).toContainText("Private");
  await publicPage.reload();
  await expect(
    publicPage.getByRole("listitem").filter({ hasText: edited })
  ).toHaveCount(0);
  await updated
    .getByRole("button", { exact: true, name: `Delete ${edited}` })
    .click();
  await page.getByRole("button", { exact: true, name: "Delete entry" }).click();
  await expect(updated).toHaveCount(0);
  await anonymous.close();
});

test("anonymous prayers retain anonymity after publication", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/prayers");
  const content = `Anonymous ${uniqueSuffix()}`;
  await page.getByLabel("Prayer request").fill(content);
  await page.getByRole("switch", { name: "Anonymous" }).click();
  await page.getByRole("button", { exact: true, name: "Add" }).click();
  const item = page.getByRole("listitem").filter({ hasText: content });
  await item.getByRole("button", { name: "Publish prayer" }).click();
  await expect(item).toContainText("Published");
  await page.goto("/prayers");
  await expect(
    page.getByRole("listitem").filter({ hasText: content })
  ).toContainText("Anonymous");
});
