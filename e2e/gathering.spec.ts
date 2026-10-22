import { expect, test } from "@playwright/test";
import { insertSchedule, insertTakeaway } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";

test.use({ storageState: MEMBER_STORAGE_STATE });

const DAY_MS = 86_400_000;

test("schedule, gathering and takeaway link to each other", async ({
  page,
}) => {
  const title = `Linked gathering ${uniqueSuffix()}`;
  // Past, so the gathering page says no takeaway was shared yet; over a year
  // back, so it stays behind the gatherings pagination.spec pages through.
  const scheduleId = await insertSchedule(
    title,
    new Date(Date.now() - 400 * DAY_MS)
  );

  // From the schedule's search results to the gathering's own page.
  await page.goto("/schedule");
  await page.getByLabel("Search schedules").fill(title);
  await page.getByRole("link", { exact: true, name: title }).click();
  await expect(page).toHaveURL(`/schedule/${scheduleId}`);
  await expect(
    page.getByRole("heading", { level: 1, name: title })
  ).toBeVisible();
  await expect(
    page.getByText("No takeaway has been shared for this gathering yet.")
  ).toBeVisible();

  // Once a takeaway exists, the card and the gathering page lead to it ...
  const takeawayId = await insertTakeaway(scheduleId, `Linked notes ${title}`);
  await page.goto(`/schedule?q=${encodeURIComponent(title)}`);
  await page.getByRole("link", { name: "Read takeaway" }).click();
  await expect(page).toHaveURL(`/takeaway/${takeawayId}`);

  // ... and the takeaway leads back to its gathering.
  await page.getByRole("link", { name: "See the gathering" }).click();
  await expect(page).toHaveURL(`/schedule/${scheduleId}`);
  await page
    .getByRole("region", { name: "Takeaways" })
    .getByRole("link", { name: "Read takeaway" })
    .click();
  await expect(page).toHaveURL(`/takeaway/${takeawayId}`);
});

test("an unknown gathering is a 404", async ({ page }) => {
  const response = await page.goto("/schedule/999999999");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Gathering not found" })
  ).toBeVisible();
  await page.getByRole("link", { name: "See the schedule" }).click();
  await expect(page).toHaveURL("/schedule");
});
