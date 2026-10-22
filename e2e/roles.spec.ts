import { expect, type Page, test } from "@playwright/test";
import { insertProfiledUser, insertSchedule, insertTakeaway } from "./db";
import {
  MEMBER_STORAGE_STATE,
  OWNER,
  uniqueSuffix,
  WRITER,
  WRITER_2,
} from "./fixtures";
import {
  adminLogin,
  loadUntilVisible,
  loginAs,
  selectOption,
  toast,
} from "./helpers";

const NOT_FOUND = 404;
const EDIT_TAKEAWAY_URL = /\/admin\/takeaways\/\d+\/edit$/;
const ROLE_MITA = /role=mita/;
const DRIVE_TIP = "Only mita can open the Google Drive.";

test.use({ storageState: MEMBER_STORAGE_STATE });

const openMemberSheet = async (page: Page, name: string) => {
  await page.goto("/admin/members");
  await page.getByLabel("Search members", { exact: true }).fill(name);
  await page.getByRole("button", { exact: true, name }).click();
  return page.getByRole("dialog");
};

test("a mita makes a member a writer from the member sheet, and the history shows it", async ({
  page,
}) => {
  const name = `Role Target ${uniqueSuffix()}`;
  await insertProfiledUser(name, "member");
  await adminLogin(page);

  const sheet = await openMemberSheet(page, name);
  await selectOption(page, "Role", "Writer");
  await expect(toast(page, `${name} is now a Writer.`)).toBeVisible();
  await expect(sheet.getByText("Role history")).toBeVisible();
  await expect(sheet).toContainText("Writer · changed by E2E Admin · just now");
});

test("the owner's role is read-only for a mita", async ({ page }) => {
  await adminLogin(page);
  const sheet = await openMemberSheet(page, OWNER.name);
  await expect(sheet).toContainText("The dev role can't be changed.");
  await expect(sheet.getByLabel("Role", { exact: true })).toHaveCount(0);
});

test("the Role filter narrows the table and lives in the URL", async ({
  page,
}) => {
  const name = `Role Filter ${uniqueSuffix()}`;
  await insertProfiledUser(name, "mita");
  await adminLogin(page);
  await page.goto("/admin/members?pageSize=100");
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows.filter({ hasText: OWNER.name })).toHaveCount(1);

  await page.getByRole("button", { exact: true, name: "Role" }).click();
  await page.getByRole("option", { name: "Mita" }).click();
  await expect(page).toHaveURL(ROLE_MITA);
  await expect(rows.filter({ hasText: name })).toHaveCount(1);
  await expect(rows.filter({ hasText: OWNER.name })).toHaveCount(0);

  await page.goto("/admin/members?pageSize=100&role=mita");
  await expect(rows.filter({ hasText: name })).toHaveCount(1);
  await expect(rows.filter({ hasText: OWNER.name })).toHaveCount(0);
});

test("a writer sees only Takeaways in the sidebar, a disabled Drive link with the tooltip, and gets 404 on /admin/dashboard and /admin/members", async ({
  page,
}) => {
  await loginAs(page, WRITER);
  await expect(page).toHaveURL("/admin/takeaways");
  const sidebar = page.locator("[data-sidebar='sidebar']");
  await expect(sidebar.getByRole("link", { name: "Takeaways" })).toBeVisible();
  for (const hidden of ["Dashboard", "Members", "Schedules", "Prayers"]) {
    // biome-ignore lint/performance/noAwaitInLoops: cheap sequential checks.
    await expect(
      sidebar.getByRole("link", { exact: true, name: hidden })
    ).toHaveCount(0);
  }
  // Writers have no Community pages, so that group has no label either.
  await expect(sidebar.getByText("Community", { exact: true })).toHaveCount(0);
  await expect(sidebar.getByText("Content", { exact: true })).toBeVisible();
  const drive = sidebar.getByRole("button", { name: "Google Drive" });
  await expect(drive).toHaveAttribute("aria-disabled", "true");
  await drive.hover();
  await expect(page.getByRole("tooltip", { name: DRIVE_TIP })).toBeVisible();

  for (const path of ["/admin/dashboard", "/admin/members"]) {
    // biome-ignore lint/performance/noAwaitInLoops: sequential navigation.
    const response = await page.goto(path);
    expect(response?.status()).toBe(NOT_FOUND);
  }
});

test("a writer edits their own takeaway, has no Edit for another writer's, and gets 404 on its edit URL", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Writer schedule ${suffix}`;
  const otherTitle = `Other writer schedule ${suffix}`;
  const keypoints = `Own insight ${suffix}`;
  const edited = `Own revised insight ${suffix}`;
  await insertSchedule(scheduleTitle);
  const otherScheduleId = await insertSchedule(otherTitle);
  const otherId = await insertTakeaway(
    otherScheduleId,
    `Other insight ${suffix}`,
    WRITER_2.id
  );

  await loginAs(page, WRITER);
  await page.goto("/admin/takeaways/new");
  await selectOption(page, "Schedule", scheduleTitle);
  await page.getByLabel("Key points", { exact: true }).fill(keypoints);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(toast(page, "Your draft has been saved.")).toBeVisible();
  await expect(page).toHaveURL("/admin/takeaways");
  await page.reload();

  const own = page.getByRole("listitem").filter({ hasText: keypoints });
  await loadUntilVisible(page, own);
  await own
    .getByRole("link", { exact: true, name: `Edit ${scheduleTitle}` })
    .click();
  await expect(page).toHaveURL(EDIT_TAKEAWAY_URL);
  // Wait for the takeaway to load into the editor before replacing it.
  const editor = page.getByLabel("Key points", { exact: true });
  await expect(editor).toHaveText(keypoints);
  await editor.fill(edited);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    toast(page, "Your changes has been saved successfully!")
  ).toBeVisible();
  await expect(page).toHaveURL("/admin/takeaways");
  await page.reload();
  const revised = page.getByRole("listitem").filter({ hasText: edited });
  await loadUntilVisible(page, revised);
  await expect(revised).toHaveCount(1);

  const other = page.getByRole("listitem").filter({ hasText: otherTitle });
  await loadUntilVisible(page, other);
  await expect(other).toHaveCount(1);
  await expect(
    other.getByRole("link", { name: `Edit ${otherTitle}` })
  ).toHaveCount(0);
  await expect(
    other.getByRole("button", { name: `Delete ${otherTitle}` })
  ).toHaveCount(0);

  const response = await page.goto(`/admin/takeaways/${otherId}/edit`);
  expect(response?.status()).toBe(NOT_FOUND);
});
