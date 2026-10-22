import { expect, type Page, test } from "@playwright/test";
import { insertSchedule, insertTakeaway } from "./db";
import {
  ADMIN,
  MEMBER,
  MEMBER_STORAGE_STATE,
  uniqueSuffix,
  WRITER,
  WRITER_2,
} from "./fixtures";
import {
  adminLogin,
  loadUntilVisible,
  loginAs,
  selectOption,
  toast,
} from "./helpers";

/** Usernames are derived from the display name ("E2E Member"). */
/** Takeaways are written in the admin area, so they credit the seeded admin. */
const ADMIN_USERNAME = "e2eadmin";
const EDIT_TAKEAWAY_URL = /\/admin\/takeaways\/\d+\/edit$/;
/** "Share" with a native share sheet, "Copy link" without one. */
const SHARE_BUTTON = /Share|Copy link/;
const SEARCH_URL = /[?&]q=PELAYANAN/;
const SEND_REVIEW = /^Send to review:/;
const PUBLISH_ACTION = /^Publish:/;
const MORE_ACTIONS = /^More actions/;

test.use({ storageState: MEMBER_STORAGE_STATE });
test.beforeEach(async ({ page }) => {
  await adminLogin(page);
});

const takeawayArticle = (page: Page, text: string) =>
  page.getByRole("listitem").filter({ hasText: text });

/** Fills /admin/takeaways/new and saves a draft; ends back on /admin/takeaways. */
const createTakeaway = async (
  page: Page,
  scheduleTitle: string,
  keypoints: string
) => {
  await selectOption(page, "Schedule", scheduleTitle);
  await page.getByLabel("Key points", { exact: true }).fill(keypoints);
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(toast(page, "Your draft has been saved.")).toBeVisible();
  await expect(page).toHaveURL("/admin/takeaways");
};

/** Narrows /admin/takeaways to one takeaway by its schedule title. */
const findInList = async (page: Page, scheduleTitle: string) => {
  await page.goto("/admin/takeaways");
  await page.getByLabel("Search takeaways").fill(scheduleTitle);
  const article = takeawayArticle(page, scheduleTitle);
  await expect(article).toHaveCount(1);
  return article;
};

/** Changes a takeaway's status from the list and waits for the toast. */
const changeStatus = async (
  page: Page,
  scheduleTitle: string,
  action: string,
  confirmation: string
) => {
  const article = await findInList(page, scheduleTitle);
  await article
    .getByRole("button", { exact: true, name: `${action}: ${scheduleTitle}` })
    .click();
  await expect(toast(page, confirmation)).toBeVisible();
  return article;
};

/** Opens /admin/takeaways/new through the list page's "Add takeaway" link. */
const openCreateFromList = async (page: Page) => {
  await page.goto("/admin/takeaways");
  await page.getByRole("link", { name: "Add takeaway" }).click();
  await expect(page).toHaveURL("/admin/takeaways/new");
};

test("creates, edits and deletes a takeaway for a schedule", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Takeaway schedule ${suffix}`;
  const keypoints = `Original insight ${suffix}`;
  const editedKeypoints = `Revised insight ${suffix}`;
  await insertSchedule(scheduleTitle);

  // Create
  await openCreateFromList(page);
  await createTakeaway(page, scheduleTitle, keypoints);
  // Reload: the list is served from a stale cache (see the test below).
  await page.reload();

  const article = takeawayArticle(page, keypoints);
  await loadUntilVisible(page, article);
  await expect(article).toHaveCount(1);
  await expect(
    article.getByRole("heading", { name: scheduleTitle })
  ).toBeVisible();
  await expect(article).toContainText("Bible study");
  await expect(article).toContainText("Draft");
  await expect(article).toContainText(ADMIN_USERNAME);

  // Edit from the card's actions menu.
  await article
    .getByRole("button", { name: `More actions for ${scheduleTitle}` })
    .click();
  await page
    .getByRole("menuitem", { exact: true, name: `Edit ${scheduleTitle}` })
    .click();
  await expect(page).toHaveURL(EDIT_TAKEAWAY_URL);
  const keypointsInput = page.getByLabel("Key points", { exact: true });
  await expect(keypointsInput).toHaveText(keypoints);
  await keypointsInput.fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(EDIT_TAKEAWAY_URL);
  await expect(keypointsInput).toHaveAttribute("aria-invalid", "true");
  await expect(keypointsInput).toBeFocused();
  await keypointsInput.fill(editedKeypoints);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(
    toast(page, "Your changes has been saved successfully!")
  ).toBeVisible();
  await expect(page).toHaveURL("/admin/takeaways");
  await page.reload();
  const edited = takeawayArticle(page, editedKeypoints);
  await loadUntilVisible(page, edited);
  await expect(edited).toHaveCount(1);
  await expect(takeawayArticle(page, keypoints)).toHaveCount(0);

  // Delete
  await edited
    .getByRole("button", { name: `More actions for ${scheduleTitle}` })
    .click();
  await page
    .getByRole("menuitem", { exact: true, name: `Delete ${scheduleTitle}` })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete takeaway" })
    .click();
  await expect(toast(page, "Takeaway deleted.")).toBeVisible();
  await expect(edited).toHaveCount(0);
});

test("takeaway list shows a new takeaway right after adding it", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Fresh takeaway schedule ${suffix}`;
  const keypoints = `Fresh insight ${suffix}`;
  await insertSchedule(scheduleTitle);

  await openCreateFromList(page);
  await createTakeaway(page, scheduleTitle, keypoints);

  await loadUntilVisible(page, takeawayArticle(page, keypoints));
  await expect(takeawayArticle(page, keypoints)).toHaveCount(1);
});

test("a takeaway card opens the full takeaway on its own page", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Public takeaway schedule ${suffix}`;
  const first = `First paragraph ${suffix}`;
  const second = `Second paragraph ${suffix}`;
  const takeawayId = await insertTakeaway(
    await insertSchedule(scheduleTitle),
    `${first}\n\n${second}`
  );

  await page.goto("/takeaway");
  const card = page.getByRole("link", { exact: true, name: scheduleTitle });
  await loadUntilVisible(page, card);
  await card.click();

  await expect(page).toHaveURL(`/takeaway/${takeawayId}`);
  await expect(page).toHaveTitle(`${scheduleTitle} · PERKI Aachen`);
  await expect(
    page.getByRole("heading", { level: 1, name: scheduleTitle })
  ).toBeVisible();
  await expect(page.getByText(first, { exact: true })).toBeVisible();
  await expect(page.getByText(second, { exact: true })).toBeVisible();
  await expect(page.getByText("Test Author")).toBeVisible();
  await expect(page.getByText("1 min read")).toBeVisible();

  // Actions come after the notes.
  const footer = page.locator("main footer");
  await expect(
    footer.getByRole("button", { name: SHARE_BUTTON })
  ).toBeVisible();
  await footer.getByRole("link", { name: "All takeaways" }).click();
  await expect(page).toHaveURL("/takeaway");
});

test("a writer formats a takeaway in the editor and readers see it formatted", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Formatted takeaway ${suffix}`;
  await insertSchedule(scheduleTitle);

  await page.goto("/admin/takeaways/new");
  await selectOption(page, "Schedule", scheduleTitle);
  const editor = page.getByRole("textbox", { name: "Key points" });
  // Type only once the editor has focus again, or keys are lost on slow CI.
  const tool = async (name: string) => {
    await page
      .getByRole("toolbar", { name: "Formatting" })
      .getByRole("button", { exact: true, name })
      .click();
    await expect(editor).toBeFocused();
  };
  await editor.click();
  await tool("Heading");
  await page.keyboard.type(`Integritas Nuh ${suffix}`);
  await page.keyboard.press("Enter");
  await page.keyboard.type("Nuh ");
  await tool("Bold");
  await page.keyboard.type("taat");
  await tool("Bold");
  await page.keyboard.type(" kepada Allah.");
  await page.keyboard.press("Enter");
  await tool("Bulleted list");
  await page.keyboard.type("Mezbah");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Korban bakaran");
  // What the writer sees is already formatted.
  await expect(editor.getByRole("heading", { level: 2 })).toHaveText(
    `Integritas Nuh ${suffix}`
  );
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(toast(page, "Your draft has been saved.")).toBeVisible();
  // Even staff must send a draft to review before publishing.
  await changeStatus(
    page,
    scheduleTitle,
    "Send to review",
    "Takeaway sent to review."
  );
  await changeStatus(page, scheduleTitle, "Publish", "Takeaway published.");

  await page.goto("/takeaway");
  const card = page.getByRole("link", { exact: true, name: scheduleTitle });
  await loadUntilVisible(page, card);
  // The preview is plain text: no "##" or "**".
  await expect(page.getByRole("listitem").filter({ has: card })).toContainText(
    `Integritas Nuh ${suffix}\nNuh taat kepada Allah.`
  );
  await card.click();

  const notes = page.getByRole("article");
  await expect(
    notes.getByRole("heading", { level: 2, name: `Integritas Nuh ${suffix}` })
  ).toBeVisible();
  await expect(notes.locator("strong")).toHaveText("taat");
  await expect(notes.getByRole("listitem")).toHaveText([
    "Mezbah",
    "Korban bakaran",
  ]);
});

test("searching takeaways narrows the list and keeps the query in the URL", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Searchable takeaway ${suffix}`;
  await insertTakeaway(
    await insertSchedule(scheduleTitle),
    `Notes about pelayanan ${suffix}`
  );

  await page.goto("/takeaway");
  const search = page.getByLabel("Search takeaways");
  // Matches the notes, not only the title, ignoring case.
  await search.fill(`PELAYANAN ${suffix}`);
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(1);
  await expect(
    page.getByRole("link", { exact: true, name: scheduleTitle })
  ).toBeVisible();
  await expect(page).toHaveURL(SEARCH_URL);

  await page.reload();
  await expect(search).toHaveValue(`PELAYANAN ${suffix}`);
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(1);

  await search.fill(`nothing-matches-${suffix}`);
  await expect(page.getByRole("status")).toContainText(
    `No takeaways match “nothing-matches-${suffix}”.`
  );
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(search).toHaveValue("");
  await expect(page).toHaveURL("/takeaway");
});

test("an unknown takeaway is a 404", async ({ page }) => {
  const response = await page.goto("/takeaway/999999999");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Takeaway not found" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Browse all takeaways" }).click();
  await expect(page).toHaveURL("/takeaway");
});

test("a takeaway created from a direct link credits its author", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Direct takeaway schedule ${suffix}`;
  const keypoints = `Direct insight ${suffix}`;
  await insertSchedule(scheduleTitle);

  await page.goto("/admin/takeaways/new");
  await createTakeaway(page, scheduleTitle, keypoints);
  await page.reload();

  const article = takeawayArticle(page, keypoints);
  await loadUntilVisible(page, article);
  await expect(article).toHaveCount(1);
  await expect(article).toContainText(ADMIN_USERNAME);
});

test("a writer drafts a takeaway, sends it to review and mita publishes it", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const scheduleTitle = `Reviewed takeaway ${suffix}`;
  const keypoints = `Reviewed insight ${suffix}`;
  await insertSchedule(scheduleTitle);
  const publicCard = () =>
    page.getByRole("link", { exact: true, name: scheduleTitle });
  const expectHiddenFromPublic = async () => {
    await page.goto(`/takeaway?q=${encodeURIComponent(scheduleTitle)}`);
    await expect(page.getByRole("status")).toContainText("No takeaways match");
    await expect(publicCard()).toHaveCount(0);
  };

  // The writer saves a draft: only they see it, and it is not public.
  await loginAs(page, WRITER);
  await page.goto("/admin/takeaways/new");
  await createTakeaway(page, scheduleTitle, keypoints);
  await expectHiddenFromPublic();
  await loginAs(page, WRITER_2);
  await page.goto("/admin/takeaways");
  await page.getByLabel("Search takeaways").fill(scheduleTitle);
  await expect(page.getByRole("status")).toContainText("No takeaways match");

  // The writer sends it to review: other writers can read it, not edit it.
  await loginAs(page, WRITER);
  const inReview = await changeStatus(
    page,
    scheduleTitle,
    "Send to review",
    "Takeaway sent to review."
  );
  await expect(inReview).toContainText("In review");
  await expect(
    inReview.getByRole("button", { name: `Publish: ${scheduleTitle}` })
  ).toHaveCount(0);
  await expectHiddenFromPublic();
  await loginAs(page, WRITER);
  const ownReview = await findInList(page, scheduleTitle);
  await ownReview
    .getByRole("button", { name: `More actions for ${scheduleTitle}` })
    .click();
  await page
    .getByRole("menuitem", { exact: true, name: "Back to draft" })
    .click();
  await expect(ownReview.getByText("Draft", { exact: true })).toBeVisible();
  await changeStatus(
    page,
    scheduleTitle,
    "Send to review",
    "Takeaway sent to review."
  );
  await loginAs(page, WRITER_2);
  const peerView = await findInList(page, scheduleTitle);
  await expect(peerView).toContainText("In review");
  await expect(
    peerView.getByRole("link", { name: `Edit ${scheduleTitle}` })
  ).toHaveCount(0);
  await expect(peerView.getByRole("button")).toHaveCount(0);
  await peerView.getByRole("link", { name: `Read ${scheduleTitle}` }).click();
  await expect(page.getByText(keypoints, { exact: true })).toBeVisible();

  // Mita publishes it, and it appears on /takeaway.
  await loginAs(page, ADMIN);
  const published = await changeStatus(
    page,
    scheduleTitle,
    "Publish",
    "Takeaway published."
  );
  await expect(published).toContainText("Published");
  await page.goto(`/takeaway?q=${encodeURIComponent(scheduleTitle)}`);
  await expect(publicCard()).toBeVisible();
  await publicCard().click();
  await expect(page.getByText(keypoints, { exact: true })).toBeVisible();

  // Once published, the writer can no longer edit it.
  await loginAs(page, WRITER);
  const locked = await findInList(page, scheduleTitle);
  await expect(locked).toContainText("Published");
  await expect(
    locked.getByRole("link", { name: `Edit ${scheduleTitle}` })
  ).toHaveCount(0);
  await expect(locked.getByRole("button")).toHaveCount(0);
  // Staff can send it back, but must put it through review again to republish.
  await loginAs(page, ADMIN);
  const sentBack = await findInList(page, scheduleTitle);
  await sentBack
    .getByRole("button", { name: `More actions for ${scheduleTitle}` })
    .click();
  await page.getByRole("menuitem", { exact: true, name: "Send back" }).click();
  await expect(sentBack.getByText("Draft", { exact: true })).toBeVisible();
  await expect(
    sentBack.getByRole("button", { name: `Publish: ${scheduleTitle}` })
  ).toHaveCount(0);
  await expectHiddenFromPublic();
});

test("a draft takeaway is a 404 for members", async ({ page }) => {
  await loginAs(page, MEMBER);
  const suffix = uniqueSuffix();
  const scheduleId = await insertSchedule(`Hidden draft ${suffix}`);
  const id = await insertTakeaway(
    scheduleId,
    `Hidden notes ${suffix}`,
    WRITER.id,
    "draft"
  );

  const response = await page.goto(`/takeaway/${id}`);
  expect(response?.status()).toBe(404);
});

for (const action of ["Save draft", "Send to review"] as const) {
  test(`${action} blocks an empty note and focuses its inline error`, async ({
    page,
  }) => {
    const scheduleTitle = `Empty note ${action} ${uniqueSuffix()}`;
    await insertSchedule(scheduleTitle);
    await page.goto("/admin/takeaways/new");
    await selectOption(page, "Schedule", scheduleTitle);
    const editor = page.getByRole("textbox", { name: "Key points" });
    const submit = page.getByRole("button", { exact: true, name: action });
    await expect(submit.locator("svg")).toHaveCount(1);
    await submit.click();
    await expect(page).toHaveURL("/admin/takeaways/new");
    await expect(
      page.getByText(
        "Write some key points before saving or sending to review.",
        { exact: true }
      )
    ).toBeVisible();
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await expect(editor).toBeFocused();
    await editor.fill("   ");
    await submit.click();
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await editor.fill(`Meaningful notes for ${scheduleTitle}`);
    await submit.click();
    await expect(page).toHaveURL("/admin/takeaways");
    const card = await findInList(page, scheduleTitle);
    await expect(
      card.getByText(action === "Save draft" ? "Draft" : "In review", {
        exact: true,
      })
    ).toBeVisible();
  });
}

test("cards keep one next step, compact badges and keyboard-accessible menus at 320px", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  for (const status of ["draft", "in_review", "published"] as const) {
    // biome-ignore lint/performance/noAwaitInLoops: isolated status fixtures in order.
    const scheduleId = await insertSchedule(`Card ${status} ${suffix}`);
    await insertTakeaway(
      scheduleId,
      `Full note ${status} ${suffix}`,
      ADMIN.id,
      status
    );
  }
  await page.setViewportSize({ height: 844, width: 320 });
  await page.goto("/admin/takeaways");
  await page.getByLabel("Search takeaways").fill(suffix);
  const cards = page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: suffix });
  await expect(cards).toHaveCount(3);
  await expect(page.locator('[data-slot="takeaway-status"]')).toHaveCount(3);
  const sizes = await page
    .locator('[data-slot="takeaway-status"]')
    .evaluateAll((pills) =>
      pills.map((pill) => ({
        height: pill.getBoundingClientRect().height,
        width: pill.getBoundingClientRect().width,
      }))
    );
  expect(sizes).toHaveLength(3);
  expect(new Set(sizes.map((size) => size.height)).size).toBe(1);
  const draft = cards.filter({ hasText: `Card draft ${suffix}` });
  const review = cards.filter({ hasText: `Card in_review ${suffix}` });
  const send = draft.getByRole("button", { name: SEND_REVIEW });
  const publish = review.getByRole("button", { name: PUBLISH_ACTION });
  await expect(draft.getByRole("button")).toHaveCount(2);
  await expect(draft.getByRole("button", { name: PUBLISH_ACTION })).toHaveCount(
    0
  );
  expect((await send.boundingBox())?.height).toBe(
    (await publish.boundingBox())?.height
  );
  await expect(send.locator("svg")).toHaveCount(1);
  await expect(publish.locator("svg")).toHaveCount(1);
  const more = draft.getByRole("button", { name: MORE_ACTIONS });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("menuitem", { name: `Edit Card draft ${suffix}` })
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await more.click();
  await page
    .getByRole("menuitem", { name: `Delete Card draft ${suffix}` })
    .click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep takeaway" }).click();
  await expect(page.getByRole("alertdialog")).toBeHidden();
  await expect(more).toBeFocused();
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  // At 200% zoom, a 640px viewport has the same 320px layout width.
  await page.setViewportSize({ height: 844, width: 640 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  const zoomed = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(zoomed.content).toBeLessThanOrEqual(zoomed.viewport);
  await expect(send).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
  });
  await page.keyboard.press("Tab");
  const read = draft.getByRole("link", { name: `Read Card draft ${suffix}` });
  await read.focus();
  expect(
    await read.evaluate(
      (element) => getComputedStyle(element, "::after").boxShadow
    )
  ).not.toBe("none");
  // A click on the card body follows its stretched native title link.
  await draft.click();
  await expect(
    page.getByRole("heading", { level: 1, name: `Card draft ${suffix}` })
  ).toBeVisible();
});

test("sending to review replaces a stale search response already in flight", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const title = `Refresh review ${suffix}`;
  await insertTakeaway(
    await insertSchedule(title),
    "A complete reflection",
    ADMIN.id,
    "draft"
  );
  await page.goto("/admin/takeaways");
  const card = takeawayArticle(page, title);
  await loadUntilVisible(page, card);
  const captured = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  let delayFirst = true;
  const pattern = "**/api/trpc/takeaways.getManageable?**";
  await page.route(pattern, async (route) => {
    if (!(delayFirst && route.request().url().includes(suffix))) {
      await route.continue();
      return;
    }
    delayFirst = false;
    const response = await route.fetch();
    captured.resolve();
    await release.promise;
    await route.fulfill({ response });
  });
  try {
    await page.getByLabel("Search takeaways").fill(suffix);
    await captured.promise;
    const refetch = page.waitForRequest(
      (request) =>
        request.method() === "GET" &&
        request.url().includes("takeaways.getManageable") &&
        request.url().includes(suffix)
    );
    await card
      .getByRole("button", { name: `Send to review: ${title}` })
      .click();
    await refetch;
    release.resolve();
    await expect(card.getByText("In review", { exact: true })).toBeVisible();
  } finally {
    release.resolve();
    await page.unroute(pattern);
  }
});
