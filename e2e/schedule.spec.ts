import { expect, type Page, test } from "@playwright/test";
import { format } from "date-fns";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { selectOption, toast } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

/** Two months ahead always lands in "Upcoming Schedules". */
const MONTHS_AHEAD = 2;
const DAY_OF_MONTH = 15;
const REQUIRED_LABELS = ["Fellowship Type", "Title", "Bible Verse", "Liturgos"];
const EDIT_SCHEDULE_URL = /\/edit-schedule\/\d+$/;

const scheduleDate = () => {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth() + MONTHS_AHEAD,
    DAY_OF_MONTH
  );
};

/** The row holding a schedule's title and its desktop edit/delete buttons. */
const scheduleHeader = (page: Page, title: string) =>
  page.getByRole("heading", { exact: true, name: title }).locator("..");

/** Fills and submits /create-schedule; ends back on /schedule. */
const createSchedule = async (page: Page, title: string, date: Date) => {
  await selectOption(page, "Fellowship Type", "Bible study");
  await page.getByLabel("Title", { exact: true }).fill(title);

  await page.getByRole("button", { name: "Date" }).click();
  const nextMonth = page.getByRole("button", { name: "Go to the Next Month" });
  // MONTHS_AHEAD (= 2) months forward.
  await nextMonth.click();
  await nextMonth.click();
  await page
    .getByRole("button", { exact: true, name: format(date, "PPPP") })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Date" })).toHaveText(
    format(date, "PPP")
  );

  await selectOption(page, "Preacher", "Billy Lugito");
  await page.getByLabel("Bible Verse", { exact: true }).fill("Psalm 23:1");
  await page
    .getByLabel("Description", { exact: true })
    .fill("An e2e bible study about the good shepherd.");
  await selectOption(page, "Liturgos", "Toni Setiawan");
  await selectOption(page, "Musician", "Felix Arjuna");
  await selectOption(page, "Note writer", "Kezia Singgih");
  await selectOption(page, "Cleaning Group");
  await page.getByRole("button", { name: "Add schedule" }).click();

  await expect(toast(page, "New schedule added!")).toBeVisible();
  await expect(page).toHaveURL("/schedule");
};

test("creates, edits and deletes a schedule", async ({ page }) => {
  const title = `Schedule ${uniqueSuffix()}`;
  const editedTitle = `${title} edited`;
  const date = scheduleDate();

  // Create. Opening the form directly means /schedule has no cached list yet.
  await page.goto("/create-schedule");
  await createSchedule(page, title, date);

  const header = scheduleHeader(page, title);
  await expect(header).toBeVisible();
  const card = header.locator("../..");
  await expect(card).toContainText("Billy Lugito");
  await expect(card).toContainText("Psalm 23:1");
  await expect(card).toContainText(format(date, "LLL dd, yyyy"));
  await expect(card).toContainText("Toni Setiawan");

  // Edit
  await header.getByRole("button", { name: "Edit" }).click();
  await expect(page).toHaveURL(EDIT_SCHEDULE_URL);
  const titleInput = page.getByLabel("Title", { exact: true });
  await expect(titleInput).toHaveValue(title);
  await expect(page.getByLabel("Bible Verse", { exact: true })).toHaveValue(
    "Psalm 23:1"
  );
  await titleInput.fill(editedTitle);
  await page.getByLabel("Bible Verse", { exact: true }).fill("Psalm 23:2");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(toast(page, "Schedule updated successfully!")).toBeVisible();
  await expect(page).toHaveURL("/schedule");
  // Reload: the list is served from a stale cache (see the test below).
  await page.reload();
  const editedHeader = scheduleHeader(page, editedTitle);
  await expect(editedHeader).toBeVisible();
  await expect(editedHeader.locator("../..")).toContainText("Psalm 23:2");
  await expect(
    page.getByRole("heading", { exact: true, name: title })
  ).toHaveCount(0);

  // Delete: cancelling keeps it, confirming removes it.
  await editedHeader.getByRole("button", { name: "Delete" }).click();
  const dialog = page.getByRole("alertdialog", {
    name: "Are you absolutely sure?",
  });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(editedHeader).toBeVisible();

  await editedHeader.getByRole("button", { name: "Delete" }).click();
  await dialog.getByRole("button", { name: "Continue" }).click();
  await expect(toast(page, "Schedule successfully deleted!")).toBeVisible();
  await expect(
    page.getByRole("heading", { exact: true, name: editedTitle })
  ).toHaveCount(0);
});

test("schedule list shows a new schedule right after adding it", async ({
  page,
}) => {
  // BUG: addSchedule/updateSchedule don't invalidate `schedules.getSchedules`,
  // and queries are fresh for 30s (src/trpc/query-client.ts). After
  // /schedule -> "Add schedule" -> submit, the redirect shows the cached list
  // without the new schedule until a reload. Same for edits.
  test.fail();

  const title = `Fresh ${uniqueSuffix()}`;
  await page.goto("/schedule");
  await expect(
    page.getByRole("heading", { name: "Upcoming Schedules" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Add schedule" }).click();
  await expect(page).toHaveURL("/create-schedule");
  await createSchedule(page, title, scheduleDate());

  await expect(scheduleHeader(page, title)).toBeVisible();
});

test("validates required schedule fields", async ({ page }) => {
  await page.goto("/create-schedule");
  await page.getByRole("button", { name: "Add schedule" }).click();

  await expect(page.getByText("A date of service is required.")).toBeVisible();
  await Promise.all(
    REQUIRED_LABELS.map((label) =>
      expect(page.getByLabel(label, { exact: true })).toHaveAttribute(
        "aria-invalid",
        "true"
      )
    )
  );
  // Optional fields stay valid.
  await expect(page.getByLabel("Preacher", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "false"
  );
  await expect(page).toHaveURL("/create-schedule");
});
