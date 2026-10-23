import { expect, test } from "@playwright/test";
import { insertAssignment, insertGroupWith, insertSchedule } from "./db";
import { uniqueSuffix } from "./fixtures";
import { createSignedInUser } from "./helpers";

const DAY_MS = 86_400_000;
const SIGN_IN = /\/auth\/signin/;
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

test("visitors are sent to sign in", async ({ page }) => {
  await page.goto("/duties");
  await expect(page).toHaveURL(SIGN_IN);
});
