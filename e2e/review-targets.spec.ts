import { expect, type Page, test } from "@playwright/test";
import postgres from "postgres";
import { setTestSession } from "./auth-fixtures";
import { insertSchedule, insertTakeaway } from "./db";
import { assertLocalDatabase, e2eEnv } from "./env";
import { MEMBER, uniqueSuffix, WRITER, WRITER_2 } from "./fixtures";
import {
  closeReviewFeedback,
  openReviewFeedback,
  reviewFeedback,
} from "./review-feedback";

const PASSAGE = "Faith grows through patience.";
const REPLACEMENT = "Faith grows as we wait.";

const seed = async () => {
  const id = await insertTakeaway(
    await insertSchedule(`Review targets ${uniqueSuffix()}`),
    PASSAGE,
    WRITER.id,
    "draft"
  );
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const sql = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    await sql`update takeaways set tldr = ${PASSAGE} where id = ${id}`;
  } finally {
    await sql.end();
  }
  return id;
};

/** Real pointer selection, using text geometry only to locate its endpoints. */
const select = async (page: Page, target: string) => {
  const paragraph = page
    .locator(`[data-review-target="${target}"] .tiptap p`)
    .first();
  await paragraph.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  const rect = await paragraph.evaluate((element) => {
    const node = element.firstChild;
    if (!node) {
      throw new Error("Missing passage");
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    const boxes = [...range.getClientRects()];
    const first = boxes.at(0);
    const last = boxes.at(-1);
    if (!(first && last)) {
      throw new Error("Missing passage bounds");
    }
    return {
      endX: last.right,
      endY: last.top + last.height / 2,
      x: first.left,
      y: first.top + first.height / 2,
    };
  });
  await page.mouse.move(rect.x, rect.y);
  await page.mouse.down();
  await page.mouse.move(rect.endX, rect.endY, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe(PASSAGE);
};

for (const width of [1440, 390, 320]) {
  test(`review targets preserve quotes and accept only the TL;DR at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width });
    const id = await seed();
    await setTestSession(page, WRITER_2);
    await page.goto(`/admin/takeaways/${id}`);
    await expect(
      page.getByRole("heading", { name: "Review comments" })
    ).toHaveCount(0);
    await openReviewFeedback(page);
    await closeReviewFeedback(page);
    await select(page, "tldr");
    await page.getByRole("button", { name: "Comment on selection" }).click();
    const feedback =
      width >= 1280
        ? page.getByRole("complementary", { name: "Review feedback" })
        : page.getByRole("dialog", { name: "Review feedback" });
    await expect(feedback).toBeVisible();
    await expect(feedback.getByRole("blockquote")).toHaveText(PASSAGE);
    await feedback
      .getByLabel("Comment", { exact: true })
      .fill("Explain patience in the summary.");
    await page.keyboard.press("Escape");
    await expect(feedback).not.toBeVisible();
    await expect(
      page.getByRole("button", {
        exact: true,
        name: "TL;DR feedback, unsent draft",
      })
    ).toBeFocused();
    await page
      .getByRole("button", { exact: true, name: "Notes feedback" })
      .click();
    await feedback
      .getByRole("button", { exact: true, name: "Add comment" })
      .click();
    await feedback
      .getByLabel("Comment", { exact: true })
      .fill("General notes feedback.");
    await feedback.getByRole("button", { exact: true, name: "TL;DR" }).click();
    await feedback
      .getByRole("button", { exact: true, name: "Unsent comment" })
      .click();
    await expect(feedback.getByRole("blockquote")).toHaveText(PASSAGE);
    await expect(feedback.getByLabel("Comment", { exact: true })).toHaveValue(
      "Explain patience in the summary."
    );
    await feedback
      .getByRole("button", { exact: true, name: "Add comment" })
      .click();
    await expect(feedback.getByText("1 open · 0 resolved")).toBeVisible();
    await feedback.getByRole("button", { name: "Close feedback" }).click();
    await expect(feedback).toHaveCount(0);
    await select(page, "tldr");
    await page
      .getByRole("button", { name: "Suggest edit for selection" })
      .click();
    await feedback.getByLabel("Suggested text").fill(REPLACEMENT);
    await feedback
      .getByRole("button", { exact: true, name: "Suggest edit" })
      .click();
    await expect(feedback.getByText("1 open · 0 decided")).toBeVisible();
    await expect(
      feedback.getByRole("button", { exact: true, name: "Accept" })
    ).toHaveCount(0);
    await feedback.getByRole("button", { exact: true, name: "Notes" }).click();
    await feedback
      .getByRole("button", { exact: true, name: "Unsent comment" })
      .click();
    await expect(feedback.getByLabel("Comment", { exact: true })).toHaveValue(
      "General notes feedback."
    );
    await feedback
      .getByRole("button", { exact: true, name: "Add comment" })
      .click();
    await expect(feedback.getByText("1 open · 0 resolved")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true);

    await setTestSession(page, WRITER);
    await page.goto(`/admin/takeaways/${id}`);
    const trigger = page.getByRole("button", {
      exact: true,
      name: "TL;DR feedback",
    });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await feedback.getByRole("button", { exact: true, name: "Accept" }).click();
    await expect(feedback.getByText("0 open · 1 decided")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(
      page.locator('[data-review-target="tldr"] .tiptap')
    ).toHaveText(REPLACEMENT);
    await expect(
      page.locator('[data-review-target="notes"] .tiptap')
    ).toHaveText(PASSAGE);
    await page.reload();
    await expect(
      page.locator('[data-review-target="tldr"] .tiptap')
    ).toHaveText(REPLACEMENT);
    await setTestSession(page, MEMBER);
    await page.goto(`/admin/takeaways/${id}`);
    await expect(
      page.getByRole("button", { name: "TL;DR feedback" })
    ).toHaveCount(0);
  });
}

test("a pending comment survives a responsive remount without a duplicate submission", async ({
  page,
}) => {
  const id = await seed();
  await page.setViewportSize({ height: 900, width: 1440 });
  await setTestSession(page, WRITER_2);
  await page.goto(`/admin/takeaways/${id}`);
  await openReviewFeedback(page);
  await reviewFeedback(page)
    .getByRole("button", { exact: true, name: "Add comment" })
    .click();
  await reviewFeedback(page)
    .getByLabel("Comment", { exact: true })
    .fill("One submission across layouts.");
  const gate = Promise.withResolvers<void>();
  let requests = 0;
  await page.route("**/api/trpc/*takeawayComments.add*", async (route) => {
    requests += 1;
    await gate.promise;
    await route.continue();
  });
  await reviewFeedback(page)
    .getByRole("button", { exact: true, name: "Add comment" })
    .click();
  await expect.poll(() => requests).toBe(1);
  await page.setViewportSize({ height: 844, width: 390 });
  await expect(
    reviewFeedback(page).getByLabel("Comment", { exact: true })
  ).toBeDisabled();
  await expect(
    reviewFeedback(page).getByRole("button", { exact: true, name: "Adding…" })
  ).toBeDisabled();
  gate.resolve();
  await expect(
    reviewFeedback(page).getByText("1 open · 0 resolved")
  ).toBeVisible();
  expect(requests).toBe(1);
});

test("feedback loading and errors recover, and failed comments retain their draft", async ({
  page,
}) => {
  const id = await seed();
  await setTestSession(page, WRITER_2);
  const query = "**/api/trpc/*takeawayComments.list*";
  const gate = Promise.withResolvers<void>();
  await page.route(query, async (route) => {
    await gate.promise;
    await route.abort();
  });
  await page.goto(`/admin/takeaways/${id}`);
  await openReviewFeedback(page);
  await expect(
    reviewFeedback(page).getByText("Loading comments…")
  ).toBeVisible();
  gate.resolve();
  const thread = reviewFeedback(page).getByRole("region", {
    name: "Review comments",
  });
  await expect(thread.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.unroute(query);
  await thread.getByRole("button", { name: "Try again" }).click();
  await expect(thread.getByText("0 open · 0 resolved")).toBeVisible();
  await reviewFeedback(page)
    .getByRole("button", { exact: true, name: "Add comment" })
    .click();
  await reviewFeedback(page)
    .getByLabel("Comment", { exact: true })
    .fill("Retain this draft on failure.");
  const mutation = "**/api/trpc/*takeawayComments.add*";
  const failure = Promise.withResolvers<void>();
  await page.route(mutation, async (route) => {
    await failure.promise;
    await route.abort();
  });
  await reviewFeedback(page)
    .getByRole("button", { exact: true, name: "Add comment" })
    .click();
  await page.setViewportSize({ height: 844, width: 390 });
  failure.resolve();
  await expect(reviewFeedback(page).getByRole("alert").first()).toBeVisible();
  await closeReviewFeedback(page);
  await openReviewFeedback(page);
  await reviewFeedback(page)
    .getByRole("button", { name: "Unsent comment" })
    .click();
  await expect(
    reviewFeedback(page).getByLabel("Comment", { exact: true })
  ).toHaveValue("Retain this draft on failure.");
  await page.unroute(mutation);
  await reviewFeedback(page)
    .getByRole("button", { exact: true, name: "Add comment" })
    .click();
  await expect(thread.getByText("1 open · 0 resolved")).toBeVisible();
});

for (const field of ["Notes", "TL;DR"]) {
  test(`accepting preserves ${field} edits made while the request is in flight`, async ({
    page,
  }) => {
    const id = await seed();
    const sql = postgres(e2eEnv.DATABASE_URL, { max: 1 });
    try {
      await sql`insert into takeaway_suggestions ("takeawayId", "authorId", original, replacement, target) values (${id}, ${WRITER_2.id}, ${PASSAGE}, ${REPLACEMENT}, 'tldr')`;
    } finally {
      await sql.end();
    }
    await setTestSession(page, WRITER);
    await page.goto(`/admin/takeaways/${id}/edit`);
    const input = page.getByRole("textbox", { exact: true, name: field });
    await expect(input).toHaveText(PASSAGE);
    const gate = Promise.withResolvers<void>();
    await page.route(
      "**/api/trpc/*takeawaySuggestions.accept*",
      async (route) => {
        const response = await route.fetch();
        await gate.promise;
        await route.fulfill({ response });
      }
    );
    await page.getByRole("button", { exact: true, name: "Accept" }).click();
    await input.fill("Unsaved work during acceptance.");
    gate.resolve();
    await expect(page.getByText("0 open · 1 decided")).toBeVisible();
    await expect(input).toHaveText("Unsaved work during acceptance.");
    await page
      .getByRole("button", { exact: true, name: "Save changes" })
      .click();
    await page.waitForURL("**/admin/takeaways");
    await page.goto(`/admin/takeaways/${id}/edit`);
    await expect(input).toHaveText("Unsaved work during acceptance.");
  });
}

test("empty TL;DR remains general feedback and the workspace reflows at 200 percent zoom", async ({
  page,
}) => {
  const id = await insertTakeaway(
    await insertSchedule(`Empty summary ${uniqueSuffix()}`),
    PASSAGE,
    WRITER.id,
    "draft"
  );
  await setTestSession(page, WRITER_2);
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto(`/admin/takeaways/${id}`);
  await expect(page.locator('[data-review-target="tldr"] .tiptap')).toHaveCount(
    0
  );
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await page
    .getByRole("button", { exact: true, name: "TL;DR feedback" })
    .click();
  await reviewFeedback(page)
    .getByRole("button", { exact: true, name: "Add comment" })
    .click();
  await expect(
    reviewFeedback(page).getByLabel("Comment", { exact: true })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});
