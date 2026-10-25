import { expect, type Page, test } from "@playwright/test";
import {
  insertAssignment,
  insertGroupWith,
  insertPoolEntry,
  insertSchedule,
} from "./db";
import { uniqueSuffix } from "./fixtures";
import { createSignedInUser } from "./helpers";

const DAY_MS = 86_400_000;
const SIGN_IN = /\/auth\/signin/;
const NEXT_MONTH = /next month/i;
const REMOVE = /^Remove /;
const inDays = (days: number) => new Date(Date.now() + days * DAY_MS);

test("a member sees their own serving slots and group days", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const user = await createSignedInUser(page, "Duties");
  // As short as a real group name ("Group 3"): /schedule shows it on a
  // button that doesn't wrap, and interface.spec checks that page at 320px.
  const group = `G ${suffix.slice(-4)}`;
  const serving = `Serving ${suffix}`;
  const cleaning = `Cleaning ${suffix}`;
  const notMine = `Not mine ${suffix}`;
  const servingId = await insertSchedule(serving, inDays(9));
  await insertAssignment(servingId, "musician", user);
  await insertSchedule(cleaning, inDays(16), { cleaningGroup: group });
  await insertSchedule(notMine, inDays(12));
  await insertGroupWith(group, user, inDays(16).toISOString().slice(0, 10));

  // The landing page hides the navigation behind its hero.
  await page.goto("/schedule");
  await page.getByRole("link", { name: "Duties" }).click();
  await expect(page).toHaveURL("/duties");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your duties" })
  ).toBeVisible();

  // The same gathering cards as /schedule, each with the member's part.
  const gatherings = page.getByRole("main").getByRole("article");
  await expect(gatherings).toHaveCount(2);
  await expect(gatherings.nth(0)).toContainText(serving);
  await expect(
    gatherings.nth(0).getByRole("list", { name: "Your part" })
  ).toHaveText("Musician");
  await expect(gatherings.nth(1)).toContainText(cleaning);
  await expect(
    gatherings.nth(1).getByRole("list", { name: "Your part" })
  ).toHaveText("Your group cleans");
  await expect(gatherings.nth(1)).toContainText(`Cleaning · ${group}`);
  await expect(page.getByText(notMine)).toHaveCount(0);

  await page.getByRole("link", { name: serving }).click();
  await expect(page).toHaveURL(`/schedule/${servingId}`);

  await page.goto("/account");
  await expect(page.getByText("Next: Musician on")).toBeVisible();
  await page.getByRole("link", { name: "See your duties" }).click();
  await expect(page).toHaveURL("/duties");
});

test("a member without linked duties is told why and pointed to the schedule", async ({
  page,
}) => {
  await createSignedInUser(page, "No duties");
  await page.goto("/duties");
  await expect(
    page.getByRole("heading", { name: "There are no duties linked to you yet" })
  ).toBeVisible();
  await page.getByRole("link", { name: "See the schedule" }).click();
  await expect(page).toHaveURL("/schedule");
});

test("an active musician takes an open slot, and is told why another is refused", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const user = await createSignedInUser(page, "Open slot");
  const group = `C ${suffix.slice(-4)}`;
  const open = `Open ${suffix}`;
  const cooking = `Cooking ${suffix}`;
  const openId = await insertSchedule(open, inDays(5), { musician: "-" });
  await insertSchedule(cooking, inDays(6), {
    cookingGroup: group,
    musician: "-",
    preacher: "Guest",
    type: "church_service",
  });
  await insertGroupWith(group, user, inDays(6).toISOString().slice(0, 10));
  await insertPoolEntry(user.id, "musician");

  await page.goto("/duties");
  const slots = page.getByRole("region", { name: "Open slots" });
  await expect(
    slots
      .getByRole("listitem", { name: cooking })
      .getByText(
        "Your group cooks that day, so you can't serve as musician too."
      )
  ).toBeVisible();
  await slots
    .getByRole("listitem", { name: open })
    .getByRole("button", { name: "Take Musician" })
    .click();
  await expect(
    page.getByText("You're on the schedule as Musician.")
  ).toBeVisible();
  await expect(slots.getByRole("listitem", { name: open })).toHaveCount(0);
  await expect(
    page
      .getByRole("main")
      .getByRole("article")
      .filter({ hasText: open })
      .getByRole("list", { name: "Your part" })
  ).toHaveText("Musician");

  await page.goto(`/schedule/${openId}`);
  await expect(page.getByRole("main")).toContainText(user.name);
});

test("visitors are sent to sign in", async ({ page }) => {
  await page.goto("/duties");
  await expect(page).toHaveURL(SIGN_IN);
});

/** Picks one day in the open calendar, moving to its month first. */
const pickDay = async (page: Page, date: Date) => {
  const day = date.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
  const cell = page.locator(`td[data-day="${day}"]:not([data-outside]) button`);
  if ((await cell.count()) === 0) {
    await page.getByRole("button", { name: NEXT_MONTH }).click();
  }
  await cell.click();
};

test("a member marks a day they can't serve, and its open slot is no longer offered", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const user = await createSignedInUser(page, "Away");
  const away = `Away ${suffix}`;
  const free = `Free ${suffix}`;
  await insertSchedule(away, inDays(5), { musician: "-" });
  await insertSchedule(free, inDays(12), { musician: "-" });
  await insertPoolEntry(user.id, "musician");

  await page.goto("/duties");
  const slots = page.getByRole("region", { name: "Open slots" });
  await expect(slots.getByRole("listitem", { name: away })).toBeVisible();

  await page.getByRole("button", { name: "Mark days" }).click();
  const dialog = page.getByRole("dialog", { name: "Days you can't serve" });
  await pickDay(page, inDays(5));
  await dialog.getByLabel("Note for mita (optional)").fill("Visiting family");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByText("Marked. Mita won't plan you on those days.")
  ).toBeVisible();

  const marked = page.getByRole("list", { name: "Days you can't serve" });
  await expect(marked).toContainText("Visiting family");
  await expect(slots.getByRole("listitem", { name: away })).toHaveCount(0);
  await expect(slots.getByRole("listitem", { name: free })).toBeVisible();

  await marked.getByRole("button", { name: REMOVE }).click();
  await expect(slots.getByRole("listitem", { name: away })).toBeVisible();
});
