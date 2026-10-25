import { expect, test } from "@playwright/test";
import { insertAssignment, insertProfiledUser, insertSchedule } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, selectOption, toast } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

const NOT_FOUND = 404;
const DAY_MS = 86_400_000;
const ROLE_PARAM = /role=liturgist/;
const PAUSED_PARAM = /status=paused/;
const FIFTEENTH = /15th/;

test("members who are not staff get a 404 at the serving teams", async ({
  page,
}) => {
  const response = await page.goto("/admin/serving");
  expect(response?.status()).toBe(NOT_FOUND);
});

test("mita add a leader, filter by role and pause them", async ({ page }) => {
  const name = `Pool Person ${uniqueSuffix()}`;
  const person = await insertProfiledUser(name, "member");
  const served = await insertSchedule(
    `Pool service ${uniqueSuffix()}`,
    new Date(Date.now() - 2 * DAY_MS),
    { type: "church_service" }
  );
  await insertAssignment(served, "liturgist", person);

  await adminLogin(page);
  await page.goto("/admin/serving");
  await page.getByRole("button", { name: "Add member" }).click();
  const add = page.getByRole("dialog");
  await add.getByPlaceholder("Search members…").fill(name);
  await add.getByRole("option", { name }).click();
  await add.getByRole("button", { name: "Add to team" }).click();
  await expect(toast(page, "Added to the serving teams.")).toBeVisible();

  await page.getByLabel("Search the serving teams").fill(name);
  const table = page.getByRole("table", { name: "Serving teams" });
  await expect(table.getByRole("row")).toHaveCount(3);

  await selectOption(page, "Role", "Leader · Service");
  await expect(page).toHaveURL(ROLE_PARAM);
  const row = table.getByRole("row").filter({ hasText: name });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Leader · Service");
  await expect(row).toContainText("Service");
  await expect(row.getByRole("cell").nth(2)).toHaveText("1");

  await row
    .getByRole("button", { name: `Actions for ${name}, Leader · Service` })
    .click();
  await page.getByRole("menuitem", { name: "Pause" }).click();
  const pause = page.getByRole("dialog");
  await pause.getByRole("button", { name: "Go to the Next Month" }).click();
  await pause.getByRole("button", { name: FIFTEENTH }).click();
  await pause.getByLabel("Reason").fill("Exams until the end of term");
  await expect(pause.getByLabel("Also pause Leader · PA Besar")).toBeChecked();
  await pause.getByRole("button", { exact: true, name: "Pause" }).click();
  await expect(toast(page, "Paused.")).toBeVisible();
  await expect(row).toContainText("Paused");
  await expect(row).toContainText("Exams until the end of term");

  await selectOption(page, "Role", "All roles");
  await page.getByRole("radio", { name: "Paused" }).click();
  await expect(page).toHaveURL(PAUSED_PARAM);
  await expect(table.getByRole("row").filter({ hasText: name })).toHaveCount(2);
});

test("mita add a leader for the service only", async ({ page }) => {
  const name = `Pool Liturgist ${uniqueSuffix()}`;
  await insertProfiledUser(name, "member");

  await adminLogin(page);
  await page.goto("/admin/serving");
  await page.getByRole("button", { name: "Add member" }).click();
  const add = page.getByRole("dialog");
  await add.getByPlaceholder("Search members…").fill(name);
  await add.getByRole("option", { name }).click();
  await add.getByRole("radio", { name: "Service" }).click();
  await add.getByRole("button", { name: "Add to team" }).click();
  await expect(toast(page, "Added to the serving teams.")).toBeVisible();

  await page.getByLabel("Search the serving teams").fill(name);
  const rows = page
    .getByRole("table", { name: "Serving teams" })
    .getByRole("row")
    .filter({ hasText: name });
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("Leader · Service");
});
