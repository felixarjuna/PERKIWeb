import { expect, type Page, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { insertSchedule, insertTakeaway, updateTakeawayNotes } from "./db";
import { uniqueSuffix, WRITER, WRITER_2 } from "./fixtures";
import {
  closeReviewFeedback,
  openReviewFeedback,
  reviewFeedback,
} from "./review-feedback";

const STALE = /Apply it by hand/;

/** Selects `text` inside the takeaway's paragraph number `index`. */
const selectPassage = async (page: Page, index: number, text: string) => {
  await closeReviewFeedback(page);
  const paragraph = page.locator(".tiptap p").nth(index);
  await paragraph.scrollIntoViewIfNeeded();
  const bounds = await paragraph.evaluate((element, passage) => {
    const node = element.firstChild;
    const start = node?.textContent?.indexOf(passage) ?? -1;
    if (!node || start === -1) {
      throw new Error(`Passage missing: ${passage}`);
    }
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, start + passage.length);
    const first = [...range.getClientRects()].at(0);
    const last = [...range.getClientRects()].at(-1);
    if (!(first && last)) {
      throw new Error("Missing selection bounds");
    }
    return {
      endX: last.right,
      endY: last.top + last.height / 2,
      x: first.left,
      y: first.top + first.height / 2,
    };
  }, text);
  await page.mouse.move(bounds.x, bounds.y);
  await page.mouse.down();
  await page.mouse.move(bounds.endX, bounds.endY, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe(text);
};

const suggest = async (page: Page, replacement: string) => {
  await page
    .getByRole("button", { name: "Suggest edit for selection" })
    .click();
  const composer = reviewFeedback(page);
  const field = composer.getByLabel("Suggested text");
  await expect(field).toBeFocused();
  await field.fill(replacement);
  await composer.getByRole("button", { name: "Suggest edit" }).click();
  await expect(composer.getByLabel("Suggested text")).toHaveCount(0);
};

test("a writer accepts another writer's suggestion and applies a stale one by hand", async ({
  page,
}) => {
  const title = `Suggested edits ${uniqueSuffix()}`;
  const id = await insertTakeaway(
    await insertSchedule(title),
    "Abraham believed God, and it was counted to him as righteousness.\n\nFaith comes by hearing.",
    WRITER.id,
    "draft"
  );

  await setTestSession(page, WRITER_2);
  await page.goto(`/admin/takeaways/${id}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await openReviewFeedback(page);
  const suggestions = page.getByRole("region", { name: "Suggested edits" });
  await expect(suggestions.getByText("0 open · 0 decided")).toBeVisible();
  // Both actions stay side by side, and each keeps its own draft.
  await selectPassage(page, 1, "Faith");
  await page.getByRole("button", { name: "Comment on selection" }).click();
  await reviewFeedback(page)
    .getByLabel("Comment", { exact: true })
    .fill("Which verse is this?");
  await selectPassage(page, 1, "Faith");
  await page
    .getByRole("button", { name: "Suggest edit for selection" })
    .click();
  const composer = reviewFeedback(page);
  await expect(composer.getByLabel("Suggested text")).toHaveValue("Faith");
  await expect(
    composer.getByRole("button", { name: "Unsent comment" })
  ).toBeVisible();
  await expect(
    composer.getByRole("button", { name: "Unsent suggestion" })
  ).toHaveCount(0);

  await selectPassage(page, 0, "believed God");
  await suggest(page, "trusted God");
  await expect(
    page.getByRole("button", { name: "Unsent comment" })
  ).toBeVisible();
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
  const notes = page.getByRole("textbox", { exact: true, name: "Notes" });
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
