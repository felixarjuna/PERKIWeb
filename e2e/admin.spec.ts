import { expect, test } from "@playwright/test";
import { ADMIN_PASSCODE, MEMBER_STORAGE_STATE } from "./fixtures";
import { adminLogin, selectOption, toast } from "./helpers";

const SECOND_PAGE = /page=2/;
const MEMBER_PARAM = /member=/;
const NAME_DESC = /sort=name\.desc/;
test.use({ storageState: MEMBER_STORAGE_STATE });

test("rejects an incorrect admin passcode", async ({ page }) => {
  await page.goto("/admin");
  await page
    .getByLabel("Username", { exact: true })
    .fill(ADMIN_PASSCODE.username);
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(toast(page, "Invalid username or password.")).toBeVisible();
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
  await page.route("**/api/trpc/*profiles.getUserProfiles*", (route) =>
    route.abort()
  );
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
  await page.unroute("**/api/trpc/*profiles.getUserProfiles*");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});
