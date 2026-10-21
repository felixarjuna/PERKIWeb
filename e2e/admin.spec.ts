import { expect, test } from "@playwright/test";
import { MEMBER_STORAGE_STATE } from "./fixtures";
import { adminLogin, selectOption } from "./helpers";

const SECOND_PAGE = /page=2/;
const MEMBER_PARAM = /member=/;
const NAME_DESC = /sort=name\.desc/;
const BIRTHDAY_PARAM = /birthday=/;
test.use({ storageState: MEMBER_STORAGE_STATE });

const NOT_FOUND = 404;

for (const path of [
  "/admin/dashboard",
  "/admin/members",
  "/admin/prayers",
  "/admin/schedules",
  "/admin/takeaways/new",
]) {
  test(`members who are not admins get a 404 at ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(NOT_FOUND);
    await expect(page.getByRole("table")).toHaveCount(0);
  });
}

test("signed-out visitors are sent to sign-in", async ({ browser }) => {
  // A fresh context still inherits the file's member storage state.
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL("/auth/signin?callbackUrl=%2Fadmin%2Fdashboard");
  await context.close();
});

test("directory supports search, sort, pagination, URL state and details", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/members");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText("Page 1 of", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Go to next page" }).click();
  await expect(page).toHaveURL(SECOND_PAGE);
  await page.getByLabel("Search members", { exact: true }).fill("Dash Seed");
  await expect(page).not.toHaveURL(SECOND_PAGE);
  await selectOption(page, "Rows per page", "25");
  await page
    .getByRole("button", { exact: true, name: "Member column options" })
    .click();
  await page.getByRole("menuitem", { name: "Z–A" }).click();
  await expect(page).toHaveURL(NAME_DESC);
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows.nth(1)).toContainText("Dash Seed 12");
  await page.reload();
  await expect(page.getByLabel("Search members", { exact: true })).toHaveValue(
    "Dash Seed"
  );
  await expect(rows.nth(1)).toContainText("Dash Seed 12");
  await page.getByRole("button", { exact: true, name: "Dash Seed 12" }).click();
  await expect(page.getByRole("dialog")).toContainText("Dash Seed 12");
  await expect(page).toHaveURL(MEMBER_PARAM);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", {
      exact: true,
      name: "Dash Seed 12",
    })
  ).toBeFocused();
  await page
    .getByLabel("Search members", { exact: true })
    .fill("No matching member");
  await expect(
    page.getByText("No members match these filters.", { exact: false })
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Search members", { exact: true })).toHaveValue(
    ""
  );
  await expect(rows.filter({ hasText: "Dash Seed 12" })).toHaveCount(1);
});

test("malformed query state and unknown members remain recoverable", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto(
    "/admin/members?page=9999&pageSize=900&sort=bad&member=missing"
  );
  await expect(page.getByRole("dialog")).toContainText("Member not found");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByLabel("Rows per page")).toHaveText("10");
});

test("directory handles a failed query and retry", async ({ page }) => {
  await adminLogin(page);
  await page.route("**/api/trpc/*profiles.members*", (route) => route.abort());
  await page.goto("/admin/members");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByLabel("Search members", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Location" })
  ).toBeVisible();
  await page.unroute("**/api/trpc/*profiles.members*");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("birthday month filter comes from the URL and can be cleared", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/members?birthday=10&sort=birthday.asc");
  const birthday = page.getByRole("button", { name: "Birthday October" });
  await expect(birthday).toBeVisible();
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows.filter({ hasText: "Dash Seed 06" })).toHaveCount(1);
  await expect(rows.filter({ hasText: "Dash Seed 01" })).toHaveCount(0);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page).not.toHaveURL(BIRTHDAY_PARAM);
  await expect(rows.filter({ hasText: "Dash Seed 01" })).toHaveCount(1);
});
