import { expect, type Page, test } from "@playwright/test";
import { insertSchedule } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { selectOption, toast, waitForSession } from "./helpers";

/** Usernames are derived from the display name ("E2E Member"). */
const MEMBER_USERNAME = "e2emember";
const EDIT_TAKEAWAY_URL = /\/edit-takeaway\/\d+$/;

test.use({ storageState: MEMBER_STORAGE_STATE });

const takeawayArticle = (page: Page, text: string) =>
  page.getByRole("article").filter({ hasText: text });

/** Fills and submits /create-takeaway; ends back on /takeaway. */
const createTakeaway = async (
  page: Page,
  scheduleTitle: string,
  keypoints: string
) => {
  await selectOption(page, "Schedule", scheduleTitle);
  await page.getByLabel("Key points", { exact: true }).fill(keypoints);
  await page.getByRole("button", { name: "Add takeaway" }).click();

  await expect(toast(page, "Your takeaway has been submitted!")).toBeVisible();
  await expect(page).toHaveURL("/takeaway");
};

/** Opens /create-takeaway through the list page's "Add takeaway" link. */
const openCreateFromList = async (page: Page) => {
  await page.goto("/takeaway");
  await waitForSession(page);
  await page.getByRole("link", { name: "Add takeaway" }).click();
  await expect(page).toHaveURL("/create-takeaway");
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
  await expect(article).toContainText("bible study");
  await expect(article).toContainText("John 3:16");
  await expect(article).toContainText(MEMBER_USERNAME);

  // Edit
  await article.getByRole("button", { name: "Edit" }).click();
  await expect(page).toHaveURL(EDIT_TAKEAWAY_URL);
  const keypointsInput = page.getByLabel("Key points", { exact: true });
  await expect(keypointsInput).toHaveValue(keypoints);
  await keypointsInput.fill(editedKeypoints);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(
    toast(page, "Your changes has been saved successfully!")
  ).toBeVisible();
  await expect(page).toHaveURL("/takeaway");
  await page.reload();
  const edited = takeawayArticle(page, editedKeypoints);
  await expect(edited).toHaveCount(1);
  await expect(takeawayArticle(page, keypoints)).toHaveCount(0);

  // Delete
  await edited.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog", { name: "Are you absolutely sure?" })
    .getByRole("button", { name: "Continue" })
    .click();
  await expect(toast(page, "Takeaway successfully deleted!")).toBeVisible();
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

test("a takeaway created from a direct link credits its author", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Direct takeaway schedule ${suffix}`;
  const keypoints = `Direct insight ${suffix}`;
  await insertSchedule(scheduleTitle);

  await page.goto("/create-takeaway");
  await waitForSession(page);
  await createTakeaway(page, scheduleTitle, keypoints);
  await page.reload();

  const article = takeawayArticle(page, keypoints);
  await expect(article).toHaveCount(1);
  await expect(article).toContainText(MEMBER_USERNAME);
});
