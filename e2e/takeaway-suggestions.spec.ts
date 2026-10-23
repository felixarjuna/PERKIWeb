import { expect, type Page, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { insertSchedule, insertTakeaway, updateTakeawayNotes } from "./db";
import { uniqueSuffix, WRITER, WRITER_2 } from "./fixtures";

const STALE = /Apply it by hand/;

/** Selects `text` inside the takeaway's paragraph number `index`. */
const selectPassage = async (page: Page, index: number, text: string) => {
  await page
    .locator(".tiptap p")
    .nth(index)
    .evaluate((element, passage) => {
      const node = element.firstChild;
      const start = node?.textContent?.indexOf(passage) ?? -1;
      if (!node || start === -1) {
        throw new Error(`Passage missing: ${passage}`);
      }
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + passage.length);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }, text);
};

const suggest = async (page: Page, replacement: string) => {
  await page
    .getByRole("button", { name: "Suggest edit for selection" })
    .click();
  const composer = page.getByRole("dialog", { name: "Suggest an edit" });
  const field = composer.getByLabel("Suggested text");
  await expect(field).toBeFocused();
  await field.fill(replacement);
  await composer.getByRole("button", { name: "Suggest edit" }).click();
  await expect(composer).not.toBeVisible();
};

test("a writer accepts another writer's suggestion and applies a stale one by hand", async ({
  page,
}) => {
  const title = `Suggested edits ${uniqueSuffix()}`;
  const id = await insertTakeaway(
    await insertSchedule(title),
    "Abraham believed God, and it was counted to him as righteousness.\n\nFaith comes by hearing.",
    WRITER.id,
    "in_review"
  );

  await setTestSession(page, WRITER_2);
  await page.goto(`/admin/takeaways/${id}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const suggestions = page.getByRole("region", { name: "Suggested edits" });
  await expect(suggestions.getByText("0 open · 0 decided")).toBeVisible();
  await selectPassage(page, 0, "believed God");
  await suggest(page, "trusted God");
  await selectPassage(page, 1, "Faith comes by hearing.");
  await suggest(page, "Faith comes from hearing.");
  await expect(suggestions.getByText("2 open · 0 decided")).toBeVisible();
  // Reviewers never edit the text or decide on suggestions.
  await expect(suggestions.getByRole("button", { name: "Accept" })).toHaveCount(
    0
  );
  await expect(page.locator(".tiptap p").first()).toContainText(
    "Abraham believed God"
  );

  // The writer rewrites the second passage before reading the suggestions.
  await updateTakeawayNotes(
    id,
    "Abraham believed God, and it was counted to him as righteousness.\n\nFaith grows by hearing."
  );

  await setTestSession(page, WRITER);
  await page.goto(`/admin/takeaways/${id}/edit`);
  const notes = page.getByRole("textbox", { name: "Key points" });
  await expect(notes).toContainText("Abraham believed God");
  const [fresh, stale] = [
    suggestions.getByRole("listitem").filter({ hasText: "trusted God" }),
    suggestions.getByRole("listitem").filter({ hasText: "from hearing" }),
  ];
  await fresh.getByRole("button", { name: "Accept" }).click();
  await expect(fresh.getByText("Accepted")).toBeVisible();
  await expect(fresh.getByText(`by ${WRITER.name}`)).toBeVisible();
  await expect(notes).toContainText("Abraham trusted God");

  await expect(stale.getByText(STALE)).toBeVisible();
  await expect(stale.getByRole("button", { name: "Accept" })).toHaveCount(0);
  await stale.getByRole("button", { name: "Mark as applied" }).click();
  await expect(suggestions.getByText("0 open · 2 decided")).toBeVisible();

  await page.reload();
  await expect(notes).toContainText("Abraham trusted God");
  await expect(notes).toContainText("Faith grows by hearing.");
});
