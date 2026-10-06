import { expect, type Page, test } from "@playwright/test";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { toast, waitForSession } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

/** Usernames are derived from the display name ("E2E Member"). */
const MEMBER_USERNAME = "e2emember";

const prayerItem = (page: Page, content: string) =>
  page.getByRole("listitem").filter({ hasText: content });

test("adds, prays for, edits and deletes a prayer", async ({ page }) => {
  // Short: the API caps prayer content at 50 characters.
  const content = `Pray ${uniqueSuffix()}`;
  const editedContent = `Bless ${uniqueSuffix()}`;

  // Add
  await page.goto("/prayers");
  await waitForSession(page);
  await page.getByPlaceholder("Insert prayer ...").fill(content);
  await page.getByRole("button", { exact: true, name: "Add" }).click();
  await expect(toast(page, "Your prayer is submitted!")).toBeVisible();

  const item = prayerItem(page, content);
  await expect(item).toHaveCount(1);
  await expect(item).toContainText(MEMBER_USERNAME);
  await expect(item.getByText("0", { exact: true })).toBeVisible();

  // Pray: count goes up and the toggle stays pressed for this user.
  // The pray toggle has no accessible name; it is the item's first button.
  const prayToggle = item.getByRole("button").first();
  await expect(prayToggle).toHaveAttribute("aria-pressed", "false");
  await prayToggle.click();
  await expect(item.getByText("1", { exact: true })).toBeVisible();
  await expect(prayToggle).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(item.getByText("1", { exact: true })).toBeVisible();
  await expect(prayToggle).toHaveAttribute("aria-pressed", "true");

  // Praying again takes it back.
  await prayToggle.click();
  await expect(item.getByText("0", { exact: true })).toBeVisible();
  await expect(prayToggle).toHaveAttribute("aria-pressed", "false");

  // Edit
  await item.getByRole("button", { name: "Edit" }).first().click();
  const dialog = page.getByRole("dialog");
  const input = dialog.getByPlaceholder("Insert your prayer here...");
  await expect(input).toHaveValue(content);
  await input.fill(editedContent);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    toast(page, "Your prayer is updated successfully!")
  ).toBeVisible();

  const edited = prayerItem(page, editedContent);
  await expect(edited).toHaveCount(1);
  await expect(prayerItem(page, content)).toHaveCount(0);

  // Delete
  await edited.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog", { name: "Are you absolutely sure?" })
    .getByRole("button", { name: "Continue" })
    .click();
  await expect(toast(page, "Prayer successfully deleted!")).toBeVisible();
  await expect(edited).toHaveCount(0);
});

test("adds an anonymous prayer", async ({ page }) => {
  const content = `Anon ${uniqueSuffix()}`;

  await page.goto("/prayers");
  await waitForSession(page);
  await page.getByPlaceholder("Insert prayer ...").fill(content);
  await page.getByRole("switch", { name: "Anonymous" }).click();
  await page.getByRole("button", { exact: true, name: "Add" }).click();

  const item = prayerItem(page, content);
  await expect(item).toHaveCount(1);
  await expect(item).toContainText("unknown");
  await expect(item).not.toContainText(MEMBER_USERNAME);
});

test("a prayer added while the session is still loading keeps its author", async ({
  page,
}) => {
  // BUG: AddPrayerForm reads the author from `useSession()` at submit time and
  // falls back to "" while the session is loading, so an early submit stores
  // the prayer without a name; its author then can't edit or delete it.
  test.fail();

  const content = `Early ${uniqueSuffix()}`;
  const SESSION_DELAY_MS = 4000;
  await page.route("**/api/auth/session", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SESSION_DELAY_MS));
    await route.continue();
  });

  await page.goto("/prayers");
  await page.getByPlaceholder("Insert prayer ...").fill(content);
  await page.getByRole("button", { exact: true, name: "Add" }).click();

  const item = prayerItem(page, content);
  await expect(item).toHaveCount(1);
  await expect(item).toContainText(MEMBER_USERNAME);
  await expect(item.getByRole("button", { name: "Delete" })).toBeVisible();
});
