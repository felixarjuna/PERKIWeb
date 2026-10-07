import { expect, type Page, test } from "@playwright/test";
import {
  adminLogin,
  setDashboardPageSize,
  signUpAndSignIn,
  toast,
  waitForSession,
} from "./helpers";

const BIRTHDAY_ERROR = "Invalid input: expected date, received string";

const fillProfile = async (page: Page) => {
  await waitForSession(page);
  // The date input's <label> points at a wrapper <div>, not the input, so it
  // cannot be found by label (a11y gap). `#dob` is its only stable handle.
  await page.locator("#dob").fill("2000-03-15");
  await page.getByLabel("Address", { exact: true }).fill("Roermonderstr. 110");
  await page
    .getByLabel("Whatsapp Number", { exact: true })
    .pressSequentially("15112345678");
  await page.getByLabel("Location", { exact: true }).fill("Aachen");
  await page.getByLabel("Major", { exact: true }).fill("Maschinenbau");
  await page.getByLabel("Bio", { exact: true }).fill("Loves e2e tests");
  await page.getByRole("button", { exact: true, name: "Submit" }).click();
};

test("submits a member profile once and rejects a second submission", async ({
  page,
}) => {
  const user = await signUpAndSignIn(page, "joiner");

  await page.goto("/member/join");
  await fillProfile(page);
  await expect(page.getByText(BIRTHDAY_ERROR)).toBeHidden();
  await expect(toast(page, "Form submitted successfully!")).toBeVisible();
  await expect(page).toHaveURL("/");

  await page.goto("/member/join");
  await fillProfile(page);
  await expect(toast(page, "Failed to submit the form")).toBeVisible();
  await expect(
    toast(page, "it seems like you already submitted your profile")
  ).toBeVisible();

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
  await signUpAndSignIn(page, "joinvalidate");

  await page.goto("/member/join");
  await waitForSession(page);
  await page.getByRole("button", { exact: true, name: "Submit" }).click();

  await expect(page).toHaveURL("/member/join");
  await expect(
    page.getByText("Invalid input: expected string, received undefined")
  ).toHaveCount(4);
});
