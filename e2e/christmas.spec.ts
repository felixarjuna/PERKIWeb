import { expect, type Page, test } from "@playwright/test";

/** The RSVP backend the Christmas pages call; never reachable from tests. */
const RSVP_API = "https://rsvp-perkiaachen.fly.dev/**";

const collectPageErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
};

test.beforeEach(async ({ page }) => {
  await page.route(RSVP_API, (route) => route.abort());
});

test("christmas page renders the event info without the RSVP API", async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await page.goto("/christmas");

  await expect(
    page.getByRole("heading", { level: 1, name: "Christmas Event" })
  ).toBeVisible();
  await expect(page.getByText("Shalom Saudara/i,")).toBeVisible();
  await expect(
    page.getByText("Roermonderstraße 110a, 52072 Aachen")
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Victor Jordan" })
  ).toHaveAttribute("href", "https://wa.me/491788710951");
  // The 2025 event is over, so registration is closed.
  await expect(
    page.getByRole("button", { name: "Registration closed!" })
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("gift exchange page renders without the RSVP API", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/christmas/gift");

  await expect(
    page.getByRole("heading", { name: "TUKER KADO PERKI AACHEN 2025" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "RANDOMIZE!" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "SEND MESSAGE!" })
  ).toBeVisible();
  await expect(
    page.getByText("The exchange has not begin yet.", { exact: false })
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("thank-you page renders a confirmation", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/christmas/thankyou");

  await expect(page.getByText("Congratulations!")).toBeVisible();
  await expect(
    page.getByText("You are successfully registered", { exact: false })
  ).toBeVisible();
  expect(errors).toEqual([]);
});
