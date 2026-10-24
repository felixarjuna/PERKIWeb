import { expect, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { insertSchedule, insertTakeaway } from "./db";
import { uniqueSuffix, WRITER, WRITER_2 } from "./fixtures";
import { openReviewFeedback, reviewFeedback } from "./review-feedback";

test("reviewer quotes a passage and the writer resolves and reopens feedback", async ({
  page,
}) => {
  const title = `Comment review ${uniqueSuffix()}`;
  const quote = "Abraham believed God";
  const id = await insertTakeaway(
    await insertSchedule(title),
    `${quote}, and it was counted to him as righteousness.`,
    WRITER.id,
    "draft"
  );
  await setTestSession(page, WRITER_2);
  await page.goto(`/admin/takeaways/${id}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Quote selection" })
  ).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".tiptap p").scrollIntoViewIfNeeded();
  const selectionBox = await page
    .locator(".tiptap p")
    .evaluate((element, text) => {
      const node = element.firstChild;
      if (!node) {
        throw new Error("Passage text missing");
      }
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, text.length);
      const rect = range.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        y: rect.top + rect.height / 2,
      };
    }, quote);
  await page.mouse.move(selectionBox.left, selectionBox.y);
  await page.mouse.down();
  await page.mouse.move(selectionBox.right, selectionBox.y, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe(quote);
  await page.getByRole("button", { name: "Comment on selection" }).click();
  const composer = reviewFeedback(page);
  await expect(composer.getByRole("blockquote")).toHaveText(quote);
  await expect(composer.getByLabel("Comment", { exact: true })).toBeFocused();
  await composer
    .getByLabel("Comment", { exact: true })
    .fill("Could you add the verse reference?");

  await page.keyboard.press("Escape");
  await expect(composer).not.toBeVisible();
  // A different selection must not silently replace the saved draft's quote.
  await page.locator(".tiptap p").evaluate((element) => {
    const node = element.firstChild;
    if (!node) {
      throw new Error("Passage text missing");
    }
    const range = document.createRange();
    range.setStart(
      node,
      "Abraham believed God, and it was counted to him as ".length
    );
    range.setEnd(node, node.textContent?.length ?? 0);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  });
  await page.getByRole("button", { name: "Comment on selection" }).click();
  await expect(composer.getByRole("blockquote")).toHaveText(quote);
  await expect(composer.getByLabel("Comment", { exact: true })).toHaveValue(
    "Could you add the verse reference?"
  );
  await page.keyboard.press("Escape");
  await openReviewFeedback(page);
  await composer.getByRole("button", { name: "Unsent comment" }).click();
  await expect(composer.getByLabel("Comment", { exact: true })).toHaveValue(
    "Could you add the verse reference?"
  );
  await composer.getByRole("button", { name: "Add comment" }).click();
  await expect(composer.getByLabel("Comment", { exact: true })).toHaveCount(0);
  const thread = page.getByRole("region", { name: "Review comments" });
  await expect(thread.getByText("1 open · 0 resolved")).toBeVisible();
  await expect(thread.getByRole("blockquote")).toHaveText(quote);
  await page.reload();
  await openReviewFeedback(page);
  await expect(
    thread.getByText("Could you add the verse reference?")
  ).toBeVisible();
  await setTestSession(page, WRITER);
  await page.goto(`/admin/takeaways/${id}/edit`);
  await thread.getByRole("button", { exact: true, name: "Resolve" }).click();
  await expect(thread.getByText("0 open · 1 resolved")).toBeVisible();
  await expect(
    thread.getByText(`by ${WRITER.name}`, { exact: true })
  ).toBeVisible();
  await expect(
    thread.getByRole("button", { exact: true, name: "Delete" })
  ).toHaveCount(0);
  await thread.getByRole("button", { name: "Reopen" }).click();
  await expect(thread.getByText("1 open · 0 resolved")).toBeVisible();
  await setTestSession(page, WRITER_2);
  await page.goto(`/admin/takeaways/${id}`);
  await openReviewFeedback(page);
  await thread.getByRole("button", { exact: true, name: "Delete" }).click();
  const confirmation = page.getByRole("alertdialog", {
    name: "Delete your comment?",
  });
  await confirmation.getByRole("button", { name: "Keep comment" }).click();
  await expect(
    thread.getByText("Could you add the verse reference?")
  ).toBeVisible();
  await thread.getByRole("button", { exact: true, name: "Delete" }).click();
  await confirmation.getByRole("button", { name: "Delete comment" }).click();
  await expect(thread.getByText("0 open · 0 resolved")).toBeVisible();
  await page.reload();
  await openReviewFeedback(page);
  await expect(
    thread.getByText("Could you add the verse reference?")
  ).toHaveCount(0);
});

test("selection menu rejects long passages and closes outside the takeaway", async ({
  page,
}) => {
  const title = `Selection limits ${uniqueSuffix()}`;
  const id = await insertTakeaway(
    await insertSchedule(title),
    "x".repeat(1001),
    WRITER.id,
    "draft"
  );
  await setTestSession(page, WRITER_2);
  await page.goto(`/admin/takeaways/${id}`);
  await page.locator(".tiptap p").evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  });
  const action = page.getByRole("button", { name: "Comment on selection" });
  await expect(action).toBeVisible();
  await expect(action).toBeDisabled();
  await expect(page.getByText("Select up to 1000 characters.")).toBeVisible();
  await page.getByRole("heading", { name: title }).evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  });
  await expect(action).not.toBeVisible();
});
