import { expect, type Page, test } from "@playwright/test";
import { insertSchedule, insertTakeaway } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, selectOption, toast } from "./helpers";

/** Usernames are derived from the display name ("E2E Member"). */
/** Takeaways are written in the admin area, so they credit the seeded admin. */
const ADMIN_USERNAME = "e2eadmin";
const EDIT_TAKEAWAY_URL = /\/admin\/takeaways\/\d+\/edit$/;
/** "Share" with a native share sheet, "Copy link" without one. */
const SHARE_BUTTON = /Share|Copy link/;
const SEARCH_URL = /[?&]q=PELAYANAN/;

test.use({ storageState: MEMBER_STORAGE_STATE });
test.beforeEach(async ({ page }) => {
  await adminLogin(page);
});

const takeawayArticle = (page: Page, text: string) =>
  page.getByRole("listitem").filter({ hasText: text });

/** Fills and submits /admin/takeaways/new; ends back on /admin/takeaways. */
const createTakeaway = async (
  page: Page,
  scheduleTitle: string,
  keypoints: string
) => {
  await selectOption(page, "Schedule", scheduleTitle);
  await page.getByLabel("Key points", { exact: true }).fill(keypoints);
  await page.getByRole("button", { name: "Add takeaway" }).click();

  await expect(toast(page, "Your takeaway has been submitted!")).toBeVisible();
  await expect(page).toHaveURL("/admin/takeaways");
};

/** Opens /admin/takeaways/new through the list page's "Add takeaway" link. */
const openCreateFromList = async (page: Page) => {
  await page.goto("/admin/takeaways");
  await page.getByRole("link", { name: "Add takeaway" }).click();
  await expect(page).toHaveURL("/admin/takeaways/new");
};

test("creates, edits and deletes a takeaway for a schedule", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Takeaway schedule ${suffix}`;
  const keypoints = `Original insight ${suffix}`;
  const editedKeypoints = `Revised insight ${suffix}`;
  await insertSchedule(scheduleTitle);

  // Create
  await openCreateFromList(page);
  await createTakeaway(page, scheduleTitle, keypoints);
  // Reload: the list is served from a stale cache (see the test below).
  await page.reload();

  const article = takeawayArticle(page, keypoints);
  await expect(article).toHaveCount(1);
  await expect(
    article.getByRole("heading", { name: scheduleTitle })
  ).toBeVisible();
  await expect(article).toContainText("Bible study");
  await expect(article).toContainText(ADMIN_USERNAME);

  // Edit
  await article
    .getByRole("link", { exact: true, name: `Edit ${scheduleTitle}` })
    .click();
  await expect(page).toHaveURL(EDIT_TAKEAWAY_URL);
  const keypointsInput = page.getByLabel("Key points", { exact: true });
  await expect(keypointsInput).toHaveValue(keypoints);
  await keypointsInput.fill(editedKeypoints);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(
    toast(page, "Your changes has been saved successfully!")
  ).toBeVisible();
  await expect(page).toHaveURL("/admin/takeaways");
  await page.reload();
  const edited = takeawayArticle(page, editedKeypoints);
  await expect(edited).toHaveCount(1);
  await expect(takeawayArticle(page, keypoints)).toHaveCount(0);

  // Delete
  await edited
    .getByRole("button", { exact: true, name: `Delete ${scheduleTitle}` })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete entry" })
    .click();
  await expect(toast(page, "Takeaway deleted.")).toBeVisible();
  await expect(edited).toHaveCount(0);
});

test("takeaway list shows a new takeaway right after adding it", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Fresh takeaway schedule ${suffix}`;
  const keypoints = `Fresh insight ${suffix}`;
  await insertSchedule(scheduleTitle);

  await openCreateFromList(page);
  await createTakeaway(page, scheduleTitle, keypoints);

  await expect(takeawayArticle(page, keypoints)).toHaveCount(1);
});

test("a takeaway card opens the full takeaway on its own page", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Public takeaway schedule ${suffix}`;
  const first = `First paragraph ${suffix}`;
  const second = `Second paragraph ${suffix}`;
  const takeawayId = await insertTakeaway(
    await insertSchedule(scheduleTitle),
    `${first}\n\n${second}`
  );

  await page.goto("/takeaway");
  await page.getByRole("link", { exact: true, name: scheduleTitle }).click();

  await expect(page).toHaveURL(`/takeaway/${takeawayId}`);
  await expect(page).toHaveTitle(`${scheduleTitle} · PERKI Aachen`);
  await expect(
    page.getByRole("heading", { level: 1, name: scheduleTitle })
  ).toBeVisible();
  await expect(page.getByText(first, { exact: true })).toBeVisible();
  await expect(page.getByText(second, { exact: true })).toBeVisible();
  await expect(page.getByText("Test Author")).toBeVisible();
  await expect(page.getByText("1 min read")).toBeVisible();

  // Actions come after the notes.
  const footer = page.locator("main footer");
  await expect(
    footer.getByRole("button", { name: SHARE_BUTTON })
  ).toBeVisible();
  await footer.getByRole("link", { name: "All takeaways" }).click();
  await expect(page).toHaveURL("/takeaway");
});

test("searching takeaways narrows the list and keeps the query in the URL", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Searchable takeaway ${suffix}`;
  await insertTakeaway(
    await insertSchedule(scheduleTitle),
    `Notes about pelayanan ${suffix}`
  );

  await page.goto("/takeaway");
  const search = page.getByLabel("Search takeaways");
  // Matches the notes, not only the title, ignoring case.
  await search.fill(`PELAYANAN ${suffix}`);
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(1);
  await expect(
    page.getByRole("link", { exact: true, name: scheduleTitle })
  ).toBeVisible();
  await expect(page).toHaveURL(SEARCH_URL);

  await page.reload();
  await expect(search).toHaveValue(`PELAYANAN ${suffix}`);
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(1);

  await search.fill(`nothing-matches-${suffix}`);
  await expect(page.getByRole("status")).toContainText(
    `No takeaways match “nothing-matches-${suffix}”.`
  );
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(search).toHaveValue("");
  await expect(page).toHaveURL("/takeaway");
});

test("an unknown takeaway is a 404", async ({ page }) => {
  const response = await page.goto("/takeaway/999999999");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Takeaway not found" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Browse all takeaways" }).click();
  await expect(page).toHaveURL("/takeaway");
});

test("a takeaway created from a direct link credits its author", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Direct takeaway schedule ${suffix}`;
  const keypoints = `Direct insight ${suffix}`;
  await insertSchedule(scheduleTitle);

  await page.goto("/admin/takeaways/new");
  await createTakeaway(page, scheduleTitle, keypoints);
  await page.reload();

  const article = takeawayArticle(page, keypoints);
  await expect(article).toHaveCount(1);
  await expect(article).toContainText(ADMIN_USERNAME);
});
