import { expect, type Page, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { insertSchedule, insertTakeaway } from "./db";
import { ADMIN, uniqueSuffix, WRITER, WRITER_2 } from "./fixtures";
import { loadUntilVisible, toast } from "./helpers";

const PASSAGE = "believed God";

type Account = Parameters<typeof setTestSession>[1];

/** Opens the viewer's Mine view, where the inbox sits above assignments. */
const openInbox = async (page: Page, account: Account) => {
  await setTestSession(page, account);
  await page.goto("/admin/takeaways");
  await page.getByRole("radio", { exact: true, name: "Mine" }).click();
};

const inboxCard = (page: Page, section: string, title: string) =>
  page
    .getByRole("region", { name: section })
    .getByRole("listitem")
    .filter({ hasText: title });

/** Runs a status move from the All list and waits for its toast. */
const changeStatus = async (
  page: Page,
  title: string,
  action: string,
  done: string
) => {
  await page.goto("/admin/takeaways");
  await page.getByRole("radio", { exact: true, name: "All" }).click();
  await page.getByLabel("Search takeaways").fill(title);
  await page
    .getByRole("listitem")
    .filter({ hasText: title })
    .getByRole("button", { exact: true, name: `${action}: ${title}` })
    .click();
  await expect(toast(page, done)).toBeVisible();
};

test("each person finds the takeaway in their inbox at their step", async ({
  page,
}) => {
  const title = `Inbox flow ${uniqueSuffix()}`;
  await insertTakeaway(
    await insertSchedule(title),
    "Abraham believed God, and it was counted to him as righteousness.",
    WRITER.id,
    "draft"
  );

  // The writer sends their draft to review; reviewers then see it.
  await setTestSession(page, WRITER);
  await changeStatus(page, title, "Send to review", "Takeaway sent to review.");

  await openInbox(page, WRITER_2);
  const toReview = inboxCard(page, "Needs review", title);
  await expect(toReview).toContainText(`By ${WRITER.name} · No open feedback`);
  await toReview.getByRole("link", { name: `Review ${title}` }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // Another writer comments and suggests an edit.
  const thread = page.getByRole("region", { name: "Review comments" });
  await thread.getByLabel("Comment", { exact: true }).fill("Which verse?");
  await thread.getByRole("button", { name: "Add comment" }).click();
  await expect(thread.getByText("Which verse?")).toBeVisible();
  await page
    .locator(".tiptap p")
    .first()
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
    }, PASSAGE);
  await page
    .getByRole("button", { name: "Suggest edit for selection" })
    .click();
  const composer = page.getByRole("dialog", { name: "Suggest an edit" });
  await composer.getByLabel("Suggested text").fill("trusted God");
  await composer.getByRole("button", { name: "Suggest edit" }).click();
  await expect(composer).not.toBeVisible();

  // Mita waits: open feedback keeps it out of Ready to publish.
  await openInbox(page, ADMIN);
  await expect(inboxCard(page, "Needs review", title)).toContainText(
    "1 open comment · 1 open suggestion"
  );
  await expect(inboxCard(page, "Ready to publish", title)).toHaveCount(0);

  // The writer handles the feedback from their inbox.
  await openInbox(page, WRITER);
  const feedback = inboxCard(page, "Open feedback", title);
  await expect(feedback).toContainText("1 open comment · 1 open suggestion");
  await feedback.getByRole("link", { name: `Review ${title}` }).click();
  const suggestions = page.getByRole("region", { name: "Suggested edits" });
  await suggestions.getByRole("button", { name: "Accept" }).click();
  await expect(suggestions.getByText("0 open · 1 decided")).toBeVisible();
  await thread.getByRole("button", { exact: true, name: "Resolve" }).click();
  await expect(thread.getByRole("button", { name: "Reopen" })).toBeVisible();
  await openInbox(page, WRITER);
  await expect(inboxCard(page, "In review", title)).toBeVisible();
  await expect(inboxCard(page, "Open feedback", title)).toHaveCount(0);

  // Mita publishes it from Ready to publish.
  await openInbox(page, ADMIN);
  const ready = inboxCard(page, "Ready to publish", title);
  await expect(ready).toContainText(`By ${WRITER.name} · No open feedback`);
  await ready.getByRole("link", { name: `Review ${title}` }).click();
  await expect(page.getByText("Abraham trusted God")).toBeVisible();
  await changeStatus(
    page,
    title,
    "Publish",
    "Takeaway published. It is now on the website."
  );
  await openInbox(page, ADMIN);
  await expect(inboxCard(page, "Ready to publish", title)).toHaveCount(0);

  await page.goto("/takeaway");
  await loadUntilVisible(
    page,
    page.getByRole("link", { exact: true, name: title })
  );
});
