import { expect, type Page, test } from "@playwright/test";
import { uniqueSuffix } from "./fixtures";
import {
  signIn,
  signOut,
  signUpAndSignIn,
  submitSignIn,
  toast,
} from "./helpers";

const ACCOUNT_LOAD_TIMEOUT_MS = 15_000;

const fillPasswordForm = async (
  page: Page,
  current: string,
  next: string,
  retyped = next
) => {
  await page.getByLabel("Current password", { exact: true }).fill(current);
  await page.getByLabel("New password", { exact: true }).fill(next);
  await page.getByLabel("Re-type new password", { exact: true }).fill(retyped);
  await page.getByRole("button", { name: "Save password" }).click();
};

test("updates the display name", async ({ page }) => {
  const user = await signUpAndSignIn(page, "rename");
  const newName = `Renamed ${uniqueSuffix()}`;

  await page.goto("/account");
  const nameInput = page.getByLabel("Name", { exact: true });
  // Under full-suite load the page can stall for several seconds while the
  // account loads (seen in traces), so allow more than the default 5s here.
  await expect(nameInput).toHaveValue(user.name, {
    timeout: ACCOUNT_LOAD_TIMEOUT_MS,
  });
  await expect(page.getByLabel("Username / Email")).toHaveValue(user.email);

  await nameInput.fill(newName);
  await page.getByRole("button", { name: "Update account" }).click();
  await expect(toast(page, "Account updated!")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(newName);
});

test("changes the password", async ({ page }) => {
  const user = await signUpAndSignIn(page, "password");
  const newPassword = `new-${uniqueSuffix()}`;

  await page.goto("/account");
  await page.getByRole("link", { name: "Change password" }).click();
  await expect(page).toHaveURL("/account/change-password");

  // Wrong current password is rejected and nothing changes.
  await fillPasswordForm(page, "not-my-password", newPassword);
  await expect(
    toast(page, "You have entered an invalid old password.")
  ).toBeVisible();
  await expect(page).toHaveURL("/account/change-password");

  // Mismatched retype is rejected too.
  await fillPasswordForm(page, user.password, newPassword, "something-else");
  await expect(
    toast(page, "Your retyped password does not match the new password.")
  ).toBeVisible();
  await expect(page).toHaveURL("/account/change-password");

  await fillPasswordForm(page, user.password, newPassword);
  await expect(toast(page, "Update password successful!")).toBeVisible();
  await expect(page).toHaveURL("/account");

  await signOut(page);

  // The old password no longer works ...
  await submitSignIn(page, user.email, user.password);
  await expect(toast(page, "Username or password is wrong.")).toBeVisible();
  await expect(page).toHaveURL("/auth/signin");

  // ... but the new one does.
  await signIn(page, user.email, newPassword);
});
