import { expect, type Page, test } from "@playwright/test";
import { format } from "date-fns";

import { insertSchedule } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, loadUntilVisible, selectOption, toast } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });
test.beforeEach(async ({ page }) => {
  await adminLogin(page);
});

/** Two months ahead always lands in "Upcoming". */
const MONTHS_AHEAD = 2;
const DAY_OF_MONTH = 15;
const REQUIRED_LABELS = ["Title", "Bible Verse", "Liturgist", "Musician"];
const EDIT_SCHEDULE_URL = /\/admin\/schedules\/\d+\/edit$/;

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
  page.getByRole("heading", { exact: true, name: title }).locator("../..");

/** Fills and submits /admin/schedules/new; ends back on /admin/schedules. */
const createSchedule = async (page: Page, title: string, date: Date) => {
  await selectOption(page, "Fellowship Type", "Church service");
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

  await selectOption(page, "Preacher", "Pdt. John Kusuma");
  await page.getByLabel("Bible Verse", { exact: true }).fill("Psalm 23:1");
  await page
    .getByLabel("Description", { exact: true })
    .fill("An e2e service about the good shepherd.");
  await selectOption(page, "Liturgist", "Toni Setiawan");
  await selectOption(page, "Musician", "Felix Arjuna");
  await selectOption(page, "Note writer", "Kezia Singgih");
  await selectOption(page, "Cleaning Group");
  await page.getByRole("button", { name: "Add schedule" }).click();

  await expect(toast(page, "New schedule added!")).toBeVisible();
  await expect(page).toHaveURL("/admin/schedules");
};

test("creates, edits and deletes a schedule", async ({ page }) => {
  const title = `Schedule ${uniqueSuffix()}`;
  const editedTitle = `${title} edited`;
  const date = scheduleDate();

  // Create. Opening the form directly means /schedule has no cached list yet.
  await page.goto("/admin/schedules/new");
  await createSchedule(page, title, date);

  const header = scheduleHeader(page, title);
  await loadUntilVisible(page, header);
  const card = header;
  await expect(card).toContainText("Pdt. John Kusuma");
  await expect(card).toContainText("Psalm 23:1");

  // Edit
  await header
    .getByRole("link", { exact: true, name: `Edit ${title}` })
    .click();
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
  await expect(page).toHaveURL("/admin/schedules");
  // Reload: the list is served from a stale cache (see the test below).
  await page.reload();
  const editedHeader = scheduleHeader(page, editedTitle);
  await loadUntilVisible(page, editedHeader);
  await expect(editedHeader.locator("../..")).toContainText("Psalm 23:2");
  await expect(
    page.getByRole("heading", { exact: true, name: title })
  ).toHaveCount(0);

  // Delete: cancelling keeps it, confirming removes it.
  await editedHeader
    .getByRole("button", { exact: true, name: `Delete ${editedTitle}` })
    .click();
  const dialog = page.getByRole("alertdialog", {
    name: `Delete “${editedTitle}”?`,
  });
  await expect(dialog).toContainText("every takeaway written for it");
  await dialog.getByRole("button", { name: "Keep entry" }).click();
  await expect(dialog).toBeHidden();
  await expect(editedHeader).toBeVisible();

  await editedHeader
    .getByRole("button", { exact: true, name: `Delete ${editedTitle}` })
    .click();
  await dialog.getByRole("button", { name: "Delete entry" }).click();
  await expect(toast(page, "Schedule deleted.")).toBeVisible();
  await expect(
    page.getByRole("heading", { exact: true, name: editedTitle })
  ).toHaveCount(0);
});

test("schedule list shows a new schedule right after adding it", async ({
  page,
}) => {
  const title = `Fresh ${uniqueSuffix()}`;
  await page.goto("/admin/schedules");
  await expect(page.getByLabel("Time period")).toBeVisible();
  await page.getByRole("link", { name: "Add schedule" }).click();
  await expect(page).toHaveURL("/admin/schedules/new");
  await createSchedule(page, title, scheduleDate());

  await loadUntilVisible(page, scheduleHeader(page, title));
});

test("validates required schedule fields", async ({ page }) => {
  await page.goto("/admin/schedules/new");
  await selectOption(page, "Fellowship Type", "Church service");
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
  await expect(page).toHaveURL("/admin/schedules/new");
});

test("calendar shows a month's gatherings and their open slots", async ({
  page,
}) => {
  const title = `Calendar ${uniqueSuffix()}`;
  const date = scheduleDate();
  await page.goto("/admin/schedules/new");
  await createSchedule(page, title, date);

  await page.getByRole("radio", { name: "Calendar" }).click();
  await expect(page).toHaveURL("/admin/schedules?view=calendar");
  const next = page.getByRole("button", { name: "Next month" });
  await next.click();
  await next.click();
  await expect(
    page.getByRole("heading", { name: format(date, "MMMM yyyy") })
  ).toBeVisible();

  // The form left multimedia, accommodation and the cooking group empty.
  const event = page.getByRole("link", { name: new RegExp(title) });
  await expect(event).toContainText("3 open");
  await expect(event).toContainText(
    "Open: Multimedia, Accommodation, Cooking group"
  );

  // The month survives a reload, and the gathering opens its edit form.
  await page.reload();
  await event.click();
  await expect(page).toHaveURL(EDIT_SCHEDULE_URL);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
});

test("edit form keeps a stored name that isn't in the picker list", async ({
  page,
}) => {
  const title = `Unlisted ${uniqueSuffix()}`;
  const leader = `Guest Leader ${uniqueSuffix()}`;
  const id = await insertSchedule(title, scheduleDate(), { leader });
  const leaderField = page.getByRole("combobox", { name: "Leader" });

  await page.goto(`/admin/schedules/${id}/edit`);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
  await expect(leaderField).toHaveText(leader);

  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(toast(page, "Schedule updated successfully!")).toBeVisible();

  await page.goto(`/admin/schedules/${id}/edit`);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
  await expect(leaderField).toHaveText(leader);
});
