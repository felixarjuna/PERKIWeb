import { expect, test } from "@playwright/test";
import { uniqueSuffix } from "./fixtures";
import { createSignedInUser, toast } from "./helpers";

const ACCOUNT_LOAD_TIMEOUT_MS = 15_000;

test("updates the display name while Google email stays read-only", async ({
  page,
}) => {
  const user = await createSignedInUser(page, "rename");
  const newName = `Renamed ${uniqueSuffix()}`;
  await page.goto("/account");
  const nameInput = page.getByLabel("Name", { exact: true });
  await expect(nameInput).toHaveValue(user.name, {
    timeout: ACCOUNT_LOAD_TIMEOUT_MS,
  });
  const emailInput = page.getByLabel("Email", { exact: true });
  await expect(emailInput).toHaveValue(user.email);
  await expect(emailInput).toHaveAttribute("readonly", "");
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Change password" })).toHaveCount(
    0
  );
  await nameInput.fill(newName);
  await page.getByRole("button", { name: "Update account" }).click();
  await expect(toast(page, "Account updated!")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(newName);
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    user.email
  );
});

test("old password settings bookmarks return to the account page", async ({
  page,
}) => {
  await createSignedInUser(page, "old-password-link");
  await page.goto("/account/change-password");
  await expect(page).toHaveURL("/account");
});
