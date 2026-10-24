import { expect, type Page, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { insertSchedule, insertTakeaway } from "./db";
import { ADMIN, uniqueSuffix, WRITER, WRITER_2 } from "./fixtures";
import { loadUntilVisible, toast } from "./helpers";
import {
  closeReviewFeedback,
  openReviewFeedback,
  reviewFeedback,
} from "./review-feedback";

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

/** Starts a status move from the All list's card. */
const startMove = async (page: Page, title: string, action: string) => {
  await page.goto("/admin/takeaways");
  await page.getByRole("radio", { exact: true, name: "All" }).click();
  await page.getByLabel("Search takeaways").fill(title);
  const card = page.getByRole("listitem").filter({ hasText: title });
  await expect(card.getByRole("button").first()).toBeVisible();
  const button = card.getByRole("button", {
    exact: true,
    name: `${action}: ${title}`,
  });
  if (await button.isVisible()) {
    await button.click();
    return;
  }
  await card.getByRole("button", { name: `More actions for ${title}` }).click();
  await page
    .getByRole("menuitem", { exact: true, name: `${action}: ${title}` })
    .click();
};

/** Runs a status move from the All list and waits for its toast. */
const changeStatus = async (
  page: Page,
  title: string,
  action: string,
  done: string
) => {
  await startMove(page, title, action);
  await expect(toast(page, done)).toBeVisible();
};

/** Submits through the dialog that checks for open comments first. */
const submit = async (page: Page, title: string) => {
  await startMove(page, title, "Submit to mita");
  const dialog = page.getByRole("alertdialog", {
    name: `Submit “${title}” to mita?`,
  });
  await dialog
    .getByRole("button", { exact: true, name: "Submit to mita" })
    .click();
  await expect(toast(page, "Takeaway submitted to mita.")).toBeVisible();
};

test("a shared draft goes through review, submission, a change request and publication", async ({
  page,
}) => {
  const title = `Inbox flow ${uniqueSuffix()}`;
  await insertTakeaway(
    await insertSchedule(title),
    "Abraham believed God, and it was counted to him as righteousness.",
    WRITER.id,
    "draft"
  );

  // Other writers find the shared draft to review straight away.
  await openInbox(page, WRITER_2);
  const toReview = inboxCard(page, "Needs review", title);
  await expect(toReview).toContainText(`By ${WRITER.name} · No open feedback`);
  await toReview.getByRole("link", { name: `Review ${title}` }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // Another writer comments and suggests an edit.
  await openReviewFeedback(page);
  await reviewFeedback(page)
    .getByRole("button", { exact: true, name: "Add comment" })
    .click();
  const thread = page.getByRole("region", { name: "Review comments" });
  await reviewFeedback(page)
    .getByLabel("Comment", { exact: true })
    .fill("Which verse?");
  await reviewFeedback(page)
    .getByRole("button", { name: "Add comment" })
    .click();
  await expect(thread.getByText("Which verse?")).toBeVisible();
  await closeReviewFeedback(page);
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
  const composer = reviewFeedback(page);
  await composer.getByLabel("Suggested text").fill("trusted God");
  await composer.getByRole("button", { name: "Suggest edit" }).click();
  await expect(composer.getByLabel("Suggested text")).toHaveCount(0);

  // Mita sees the draft still has open feedback; nothing is submitted yet.
  await openInbox(page, ADMIN);
  await expect(inboxCard(page, "Needs review", title)).toContainText(
    "1 open comment · 1 open suggestion"
  );
  await expect(inboxCard(page, "Ready to publish", title)).toHaveCount(0);

  // The open comment blocks submitting, and the dialog says which.
  await setTestSession(page, WRITER);
  await startMove(page, title, "Submit to mita");
  const dialog = page.getByRole("alertdialog", {
    name: `Submit “${title}” to mita?`,
  });
  await expect(dialog.getByRole("alert")).toContainText(
    "1 open comment blocks submitting."
  );
  await expect(dialog.getByRole("alert")).toContainText(
    `${WRITER_2.name}: Which verse?`
  );
  await expect(
    dialog.getByRole("button", { exact: true, name: "Submit to mita" })
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "Keep editing" }).click();

  // The writer handles the feedback from their inbox, then submits.
  await openInbox(page, WRITER);
  const feedback = inboxCard(page, "Open feedback", title);
  await expect(feedback).toContainText("1 open comment · 1 open suggestion");
  await feedback.getByRole("link", { name: `Review ${title}` }).click();
  await openReviewFeedback(page);
  const suggestions = page.getByRole("region", { name: "Suggested edits" });
  await suggestions.getByRole("button", { name: "Accept" }).click();
  await expect(suggestions.getByText("0 open · 1 decided")).toBeVisible();
  await thread.getByRole("button", { exact: true, name: "Resolve" }).click();
  await expect(thread.getByRole("button", { name: "Reopen" })).toBeVisible();
  await submit(page, title);
  await openInbox(page, WRITER);
  await expect(inboxCard(page, "Submitted", title)).toBeVisible();
  await expect(inboxCard(page, "Open feedback", title)).toHaveCount(0);

  // Mita requests changes; the note is required and reaches the writer.
  await openInbox(page, ADMIN);
  await expect(inboxCard(page, "Ready to publish", title)).toContainText(
    `By ${WRITER.name} · No open feedback`
  );
  await startMove(page, title, "Request changes");
  const request = page.getByRole("alertdialog", {
    name: `Request changes to “${title}”?`,
  });
  await request.getByRole("button", { name: "Request changes" }).click();
  await expect(
    request.getByText("Add a note so the writer knows what to fix.")
  ).toBeVisible();
  await request
    .getByLabel("What should change?")
    .fill("Name the verse in the first point.");
  await request.getByRole("button", { name: "Request changes" }).click();
  await expect(toast(page, "Changes requested.")).toBeVisible();

  await openInbox(page, WRITER);
  await inboxCard(page, "Open feedback", title)
    .getByRole("link", { name: `Review ${title}` })
    .click();
  const note = page.getByRole("region", { name: "Changes requested" });
  await expect(note).toContainText("Name the verse in the first point.");
  await page.getByRole("link", { name: `Edit ${title}` }).click();
  await expect(
    page.getByRole("region", { name: "Changes requested" })
  ).toContainText("Name the verse in the first point.");
  await page
    .getByRole("region", { name: "Changes requested" })
    .getByRole("button", { name: "Mark as resolved" })
    .click();
  await expect(
    page.getByRole("region", { name: "Changes requested" })
  ).toHaveCount(0);
  await submit(page, title);

  // Mita publishes it from Ready to publish.
  await openInbox(page, ADMIN);
  const ready = inboxCard(page, "Ready to publish", title);
  await ready.getByRole("link", { name: `Review ${title}` }).click();
  const notes = page.getByRole("document", { exact: true, name: "Notes text" });
  await expect(notes).toBeVisible();
  await expect(notes).toHaveText(
    "Abraham trusted God, and it was counted to him as righteousness."
  );
  // The hidden server-rendered source also contains this text after hydration.
  await expect(
    page.getByText("Abraham trusted God").filter({ visible: true })
  ).toHaveCount(1);
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
