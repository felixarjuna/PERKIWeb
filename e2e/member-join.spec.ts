import { expect, type Page, test } from "@playwright/test";
import {
  adminLogin,
  createSignedInUser,
  setDashboardPageSize,
  toast,
  waitForSession,
} from "./helpers";

const BIRTHDAY_ERROR = "Invalid input: expected date, received string";

const fillProfile = async (page: Page) => {
  await waitForSession(page);
  await page.getByLabel("Date of birth", { exact: true }).fill("2000-03-15");
  await page.getByLabel("Address", { exact: true }).fill("Roermonderstr. 110");
  await page
    .getByLabel("Whatsapp Number", { exact: true })
    .pressSequentially("15112345678");
  await page.getByLabel("Location", { exact: true }).fill("Aachen");
  await page.getByLabel("Major", { exact: true }).fill("Maschinenbau");
  await page.getByLabel("Bio", { exact: true }).fill("Loves e2e tests");
  await page.getByRole("button", { exact: true, name: "Submit" }).click();
};

test("submits a member profile once and shows existing membership", async ({
  page,
}) => {
  const user = await createSignedInUser(page, "joiner");

  await page.goto("/member/join");
  await fillProfile(page);
  await expect(page.getByText(BIRTHDAY_ERROR)).toBeHidden();
  await expect(toast(page, "Form submitted successfully!")).toBeVisible();
  await expect(page).toHaveURL("/");

  await page.goto("/member/join");
  await expect(
    page.getByText("You are already registered as a member.")
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Submit" })
  ).toHaveCount(0);

  // The new member shows up on the admin dashboard.
  await adminLogin(page);
  // Seeded members fill page 1, so show every row before looking.
  await setDashboardPageSize(page, 50);
  const row = page.getByRole("row").filter({ hasText: user.name });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Maschinenbau");
  await expect(row).toContainText("Aachen");
});

test("join form validates required fields", async ({ page }) => {
  await createSignedInUser(page, "joinvalidate");

  await page.goto("/member/join");
  await waitForSession(page);
  await page.getByRole("button", { exact: true, name: "Submit" }).click();

  await expect(page).toHaveURL("/member/join");
  await Promise.all(
    [
      "Please enter your address.",
      "Please enter your location.",
      "Please enter your major.",
      "Please enter your WhatsApp number.",
      "Please enter your date of birth.",
    ].map((message) =>
      expect(page.getByText(message, { exact: true })).toBeVisible()
    )
  );
});

test("session expiry preserves the membership destination", async ({
  page,
  context,
}) => {
  await createSignedInUser(page, "join-expiry");
  await page.goto("/member/join?source=footer#profile");
  await waitForSession(page);
  // An in-flight session request would re-set the cookie after it's cleared.
  await page.waitForLoadState("networkidle");
  await context.clearCookies();
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange"))
  );
  await expect(page).toHaveURL(
    "/auth/signin?callbackUrl=%2Fmember%2Fjoin%3Fsource%3Dfooter%23profile"
  );
});
