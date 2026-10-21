import { expect, type Page, test } from "@playwright/test";
import { insertSchedule, insertTakeaway } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, selectOption } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
/** Page sizes of /schedule's sections, /takeaway and the admin lists. */
const SCHEDULE_PAGE = 3;
const RESULTS_PAGE = 5;
const TAKEAWAY_PAGE = 5;
const ADMIN_PAGE = 20;

/** `count` schedules titled "<prefix> <n>", one minute apart from `start`. */
const seedSchedules = (prefix: string, count: number, start: number) =>
  Promise.all(
    Array.from({ length: count }, (_, n) =>
      insertSchedule(`${prefix} ${n}`, new Date(start + n * MINUTE_MS))
    )
  );

/** Clicks "Load more <noun>" and waits for the end of the list. */
const loadRest = async (page: Page, noun: string) => {
  await page.getByRole("button", { name: `Load more ${noun}` }).click();
  // The end note takes focus, so keyboard users keep their place.
  await expect(page.getByText("That’s everything:")).toBeFocused();
  await expect(
    page.getByRole("button", { name: `Load more ${noun}` })
  ).toHaveCount(0);
};

test("past gatherings load a page at a time", async ({ page }) => {
  const prefix = `Past ${uniqueSuffix()}`;
  // Before this week, so they're listed under "Previous"; no other spec
  // seeds past gatherings, so these are the newest past ones.
  await seedSchedules(prefix, SCHEDULE_PAGE + 1, Date.now() - 30 * DAY_MS);
  const headings = page.getByRole("heading", { name: prefix });

  await page.goto("/schedule");
  await expect(headings).toHaveCount(SCHEDULE_PAGE);
  await page.getByRole("button", { name: "Load more past gatherings" }).click();
  await expect(headings).toHaveCount(SCHEDULE_PAGE + 1);
});

test("schedule search shows one results list, filtered by month", async ({
  page,
}) => {
  const prefix = `Findable ${uniqueSuffix()}`;
  const start = Date.now() + 60 * DAY_MS;
  await seedSchedules(prefix, RESULTS_PAGE + 1, start);
  // One more, months later, that the month filter leaves out.
  await insertSchedule(`${prefix} later`, new Date(start + 120 * DAY_MS));
  const headings = page.getByRole("heading", { name: prefix });
  const month = new Intl.DateTimeFormat("en", {
    month: "long",
    timeZone: "Europe/Berlin",
    year: "numeric",
  }).format(start);

  await page.goto("/schedule");
  await page.getByLabel("Search schedules").fill(prefix.toLowerCase());
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Upcoming" })).toHaveCount(0);
  await expect(headings).toHaveCount(RESULTS_PAGE);
  await page.getByRole("button", { name: "Load more results" }).click();
  await expect(headings).toHaveCount(RESULTS_PAGE + 2);

  await selectOption(page, "Month", month);
  await expect(headings).toHaveCount(RESULTS_PAGE);
  await loadRest(page, "results");
  await expect(headings).toHaveCount(RESULTS_PAGE + 1);
  await expect(
    page.getByRole("heading", { name: `${prefix} later` })
  ).toHaveCount(0);

  // The filters live in the URL, so a reload keeps them.
  await page.reload();
  await expect(page.getByLabel("Search schedules")).toHaveValue(
    prefix.toLowerCase()
  );
  await expect(page.getByRole("combobox", { name: "Month" })).toHaveText(month);

  await page.getByLabel("Search schedules").fill(`${prefix} nothing`);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL("/schedule");
  await expect(page.getByRole("heading", { name: "Upcoming" })).toBeVisible();
});

test("takeaway search runs across every page", async ({ page }) => {
  const suffix = uniqueSuffix();
  const ids = await seedSchedules(
    `Paged takeaway ${suffix}`,
    TAKEAWAY_PAGE + 1,
    Date.now()
  );
  await Promise.all(
    ids.map((id) => insertTakeaway(id, `Paged notes ${suffix}`))
  );
  const cards = page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: `Paged notes ${suffix}` });

  await page.goto("/takeaway");
  await page.getByLabel("Search takeaways").fill(`paged ${suffix}`);
  await expect(cards).toHaveCount(TAKEAWAY_PAGE);
  await loadRest(page, "takeaways");
  await expect(cards).toHaveCount(TAKEAWAY_PAGE + 1);
});

test.describe("admin lists", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("schedules filter on the server and load more", async ({ page }) => {
    const prefix = `Admin paged ${uniqueSuffix()}`;
    await seedSchedules(prefix, ADMIN_PAGE + 1, Date.now() + 40 * DAY_MS);
    const rows = page.getByRole("heading", { name: prefix });

    await page.goto("/admin/schedules");
    await page.getByLabel("Search schedules").fill(prefix);
    await expect(rows).toHaveCount(ADMIN_PAGE);
    await expect(
      page.getByText(`${ADMIN_PAGE} schedules so far`)
    ).toBeVisible();
    await loadRest(page, "schedules");
    await expect(rows).toHaveCount(ADMIN_PAGE + 1);

    // "Past" excludes them all, on every page.
    await selectOption(page, "Time period", "Past");
    await expect(page.getByText("No schedules match.")).toBeVisible();
  });

  test("takeaways filter on the server and load more", async ({ page }) => {
    const suffix = uniqueSuffix();
    const ids = await seedSchedules(
      `Admin takeaway ${suffix}`,
      ADMIN_PAGE + 1,
      Date.now()
    );
    await Promise.all(
      ids.map((id) => insertTakeaway(id, `Admin notes ${suffix}`))
    );
    const rows = page
      .getByRole("listitem")
      .filter({ hasText: `Admin notes ${suffix}` });

    await page.goto("/admin/takeaways");
    await page.getByLabel("Search takeaways").fill(`admin notes ${suffix}`);
    await expect(rows).toHaveCount(ADMIN_PAGE);
    await loadRest(page, "takeaways");
    await expect(rows).toHaveCount(ADMIN_PAGE + 1);
  });
});
