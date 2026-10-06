import { expect, type Page, test } from "@playwright/test";
import {
  ADMIN_PASSCODE,
  DASHBOARD_MEMBERS,
  DASHBOARD_NAME_PREFIX,
  MEMBER_STORAGE_STATE,
} from "./fixtures";
import { adminLogin, setDashboardPageSize, toast } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

const DEFAULT_PAGE_SIZE = 10;
const PAGE_LABEL = /^Page (\d+) of (\d+)$/;
const FIRST_PAGE_LABEL = /^Page 1 of \d+$/;

/** Names in the first column of every visible body row, top to bottom. */
const visibleNames = async (page: Page) => {
  const rows = page.getByRole("rowgroup").nth(1).getByRole("row");
  return await rows.evaluateAll((elements) =>
    elements.map((row) => row.querySelector("td")?.textContent?.trim() ?? "")
  );
};

const seededNames = (names: string[]) =>
  names.filter((name) => name.startsWith(DASHBOARD_NAME_PREFIX));

const pageLabel = (page: Page) => page.getByText(PAGE_LABEL);

const namesByBirthday = () =>
  [...DASHBOARD_MEMBERS]
    .sort((a, b) => a.birthday.getTime() - b.birthday.getTime())
    .map((member) => member.name);

test("rejects a wrong admin passcode", async ({ page }) => {
  await page.goto("/admin");
  await page
    .getByLabel("Username", { exact: true })
    .fill(ADMIN_PASSCODE.username);
  await page.getByLabel("Password", { exact: true }).fill("wrong-passcode");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(toast(page, "Invalid username or password.")).toBeVisible();
  await expect(page).toHaveURL("/admin");
});

test("dashboard without the passcode sends visitors back to /admin", async ({
  page,
}) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL("/admin");
});

test("dashboard lists members sorted by name by default", async ({ page }) => {
  await adminLogin(page);

  await expect(page.getByRole("table")).toBeVisible();
  await expect(pageLabel(page)).toBeVisible();

  const names = await visibleNames(page);
  expect(names).toHaveLength(DEFAULT_PAGE_SIZE);
  // Seeded "Dash Seed NN" members sort before every other test user.
  expect(names).toEqual(
    DASHBOARD_MEMBERS.slice(0, DEFAULT_PAGE_SIZE).map((member) => member.name)
  );

  const first = page.getByRole("row").filter({ hasText: "Dash Seed 01" });
  await expect(first).toContainText("Informatik");
  await expect(first).toContainText("Dash Seed 01 Street 1");
});

/**
 * Activates a column's sort button with the keyboard. At desktop widths the
 * sidebar covers the "Name" header so it can't be clicked (see the BUG test).
 */
const toggleSort = async (page: Page, column: "Name" | "Birthday") => {
  await page.getByRole("button", { exact: true, name: column }).focus();
  await page.keyboard.press("Enter");
};

test("dashboard sorts by name and by birthday", async ({ page }) => {
  await adminLogin(page);
  await setDashboardPageSize(page, 50);
  await expect(pageLabel(page)).toHaveText("Page 1 of 1");

  const allSeeded = DASHBOARD_MEMBERS.map((member) => member.name);
  expect(seededNames(await visibleNames(page))).toEqual(allSeeded);

  // Name: ascending -> descending
  await toggleSort(page, "Name");
  await expect
    .poll(async () => seededNames(await visibleNames(page)))
    .toEqual([...allSeeded].reverse());

  // Name: descending -> ascending again
  await toggleSort(page, "Name");
  await expect
    .poll(async () => seededNames(await visibleNames(page)))
    .toEqual(allSeeded);

  // Birthday: ascending by month and day, regardless of the year.
  await toggleSort(page, "Birthday");
  await expect
    .poll(async () => seededNames(await visibleNames(page)))
    .toEqual(namesByBirthday());

  // Birthday: descending
  await toggleSort(page, "Birthday");
  await expect
    .poll(async () => seededNames(await visibleNames(page)))
    .toEqual(namesByBirthday().reverse());

  // The mouse works on the uncovered "Birthday" header too.
  await page.getByRole("button", { exact: true, name: "Birthday" }).click();
  await expect
    .poll(async () => seededNames(await visibleNames(page)))
    .toEqual(namesByBirthday());
});

test("dashboard Name header is not covered by the sidebar", async ({
  page,
}) => {
  await adminLogin(page);
  await expect(page.getByRole("table")).toBeVisible();
  const ASSERTION_TIMEOUT_MS = 3000;
  await page
    .getByRole("button", { exact: true, name: "Name" })
    .click({ timeout: ASSERTION_TIMEOUT_MS });
  await expect
    .poll(async () => seededNames(await visibleNames(page)))
    .toEqual(
      DASHBOARD_MEMBERS.map((member) => member.name)
        .reverse()
        .slice(0, DEFAULT_PAGE_SIZE)
    );
});

test("dashboard pagination controls work", async ({ page }) => {
  await adminLogin(page);

  const label = pageLabel(page);
  await expect(label).toHaveText(FIRST_PAGE_LABEL);
  const lastPage = Number((await label.textContent())?.match(PAGE_LABEL)?.[2]);
  expect(lastPage).toBeGreaterThanOrEqual(2);

  const first = page.getByRole("button", { name: "Go to first page" });
  const previous = page.getByRole("button", { name: "Go to previous page" });
  const next = page.getByRole("button", { name: "Go to next page" });
  const last = page.getByRole("button", { name: "Go to last page" });

  await expect(first).toBeDisabled();
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  const firstPageNames = await visibleNames(page);

  await next.click();
  await expect(label).toHaveText(`Page 2 of ${lastPage}`);
  await expect(previous).toBeEnabled();
  const secondPageNames = await visibleNames(page);
  expect(secondPageNames.length).toBeGreaterThan(0);
  expect(secondPageNames).not.toContain(firstPageNames[0]);
  expect(secondPageNames[0]).toBe("Dash Seed 11");

  await previous.click();
  await expect(label).toHaveText(`Page 1 of ${lastPage}`);
  expect(await visibleNames(page)).toEqual(firstPageNames);

  await last.click();
  await expect(label).toHaveText(`Page ${lastPage} of ${lastPage}`);
  await expect(next).toBeDisabled();
  await expect(last).toBeDisabled();

  await first.click();
  await expect(label).toHaveText(`Page 1 of ${lastPage}`);

  // A bigger page size fits every member on one page.
  await setDashboardPageSize(page, 50);
  await expect(label).toHaveText("Page 1 of 1");
  expect((await visibleNames(page)).length).toBeGreaterThan(DEFAULT_PAGE_SIZE);
});
