import { expect, type Page, test } from "@playwright/test";
import { insertSchedule, insertTakeaway, setPublishedAt } from "./db";
import {
  ADMIN,
  MEMBER,
  MEMBER_STORAGE_STATE,
  uniqueSuffix,
  WRITER,
} from "./fixtures";
import { loginAs, toast } from "./helpers";

const PUBLISHED_AT = new Date("2026-03-02T10:00:00Z");

test.use({ storageState: MEMBER_STORAGE_STATE });

/** Narrows /admin/takeaways to one takeaway by its schedule title. */
const findInList = async (page: Page, scheduleTitle: string) => {
  await page.goto("/admin/takeaways");
  await page.getByRole("radio", { exact: true, name: "All" }).click();
  await page.getByLabel("Search takeaways").fill(scheduleTitle);
  const card = page.getByRole("listitem").filter({ hasText: scheduleTitle });
  await expect(card).toHaveCount(1);
  return card;
};

/** The public page's facts card: "Published", "Updated", … */
const fact = (page: Page, label: string) =>
  page.getByRole("term").filter({ hasText: label });

test("a published takeaway stays live while its correction is reviewed", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Corrected takeaway ${suffix}`;
  const live = `Abraham believed God ${suffix}`;
  const corrected = `Abraham trusted God through the long wait ${suffix}`;
  const id = await insertTakeaway(
    await insertSchedule(scheduleTitle),
    live,
    WRITER.id
  );
  await setPublishedAt(id, PUBLISHED_AT);

  // The writer edits the published takeaway; the editor says what happens.
  await loginAs(page, WRITER);
  await page.goto(`/admin/takeaways/${id}`);
  await page.getByRole("link", { name: `Edit ${scheduleTitle}` }).click();
  await expect(page.getByText("This takeaway is published.")).toBeVisible();
  const keypoints = page.getByRole("textbox", { exact: true, name: "Notes" });
  await expect(keypoints).toHaveText(live);
  await keypoints.fill(corrected);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(toast(page, "Changes saved.")).toBeVisible();

  const card = await findInList(page, scheduleTitle);
  await expect(card.getByText("Published", { exact: true })).toBeVisible();
  await expect(
    card.getByText("Changes in draft", { exact: true })
  ).toBeVisible();
  await card
    .getByRole("button", {
      exact: true,
      name: `Send changes to review: ${scheduleTitle}`,
    })
    .click();
  await expect(toast(page, "Changes sent to review.")).toBeVisible();
  await expect(
    card.getByText("Changes in review", { exact: true })
  ).toBeVisible();

  // Readers still get the published text.
  await loginAs(page, MEMBER);
  await page.goto(`/takeaway/${id}`);
  await expect(page.getByText(live, { exact: true })).toBeVisible();
  await expect(page.getByText(corrected)).toHaveCount(0);
  await expect(fact(page, "Published")).toBeVisible();
  await expect(fact(page, "Updated")).toHaveCount(0);

  // Mita reads the correction on the review page and publishes it.
  await loginAs(page, ADMIN);
  await page.goto(`/admin/takeaways/${id}`);
  await expect(page.getByText(corrected, { exact: true })).toBeVisible();
  await expect(
    page.getByText("You’re reading changes to the published takeaway")
  ).toBeVisible();
  const reviewed = await findInList(page, scheduleTitle);
  await reviewed
    .getByRole("button", {
      exact: true,
      name: `Publish changes: ${scheduleTitle}`,
    })
    .click();
  await expect(toast(page, "Changes published.")).toBeVisible();
  await expect(
    reviewed.getByText("Changes in review", { exact: true })
  ).toHaveCount(0);

  // The website shows the new text and when it was updated.
  await loginAs(page, MEMBER);
  await page.goto(`/takeaway/${id}`);
  await expect(page.getByText(corrected, { exact: true })).toBeVisible();
  await expect(page.getByText(live, { exact: true })).toHaveCount(0);
  await expect(fact(page, "Published")).toBeVisible();
  await expect(fact(page, "Updated")).toBeVisible();
});
