import { expect, type Page } from "@playwright/test";

const NOTES_FEEDBACK = /^Notes feedback/;

export const reviewFeedback = (page: Page) =>
  page
    .getByRole("complementary", { name: "Review feedback" })
    .or(page.getByRole("dialog", { name: "Review feedback" }));

export const openReviewFeedback = async (page: Page) => {
  await page.getByRole("button", { name: NOTES_FEEDBACK }).click();
  await expect(reviewFeedback(page)).toBeVisible();
};

export const closeReviewFeedback = async (page: Page) => {
  const panel = reviewFeedback(page);
  if (await panel.isVisible()) {
    await panel.getByRole("button", { name: "Close feedback" }).click();
    await expect(panel).toHaveCount(0);
  }
};
