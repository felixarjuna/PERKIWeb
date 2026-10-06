import { expect, test } from "@playwright/test";
import { MEMBER } from "./fixtures";
import {
  newCredentials,
  signIn,
  signOut,
  signUp,
  submitSignIn,
  toast,
} from "./helpers";

test("signs up a new account, signs in with it and signs out", async ({
  page,
}) => {
  const user = newCredentials("signup");

  await signUp(page, user);
  await signIn(page, user.email, user.password);

  // The navigation now offers the account page instead of signing in.
  await page.goto("/schedule");
  await page.getByRole("button", { name: "Account" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);

  await signOut(page);
  await expect(
    page.getByRole("button", { exact: true, name: "Sign in" })
  ).toBeVisible();

  // Protected pages are closed again once signed out.
  await page.goto("/account");
  await expect(page).toHaveURL("/auth/signin");
});

test("rejects a sign up with an already registered username", async ({
  page,
}) => {
  await page.goto("/auth/signup");
  await page.getByLabel("Name", { exact: true }).fill("Duplicate");
  await page.getByLabel("Username", { exact: true }).fill(MEMBER.email);
  await page.getByLabel("Password", { exact: true }).fill("long-enough-pw");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(toast(page, "Username or email already exists")).toBeVisible();
  await expect(page).toHaveURL("/auth/signup");
});

test("rejects a sign up with a too short password", async ({ page }) => {
  await page.goto("/auth/signup");
  await page.getByLabel("Name", { exact: true }).fill("Shorty");
  await page.getByLabel("Username", { exact: true }).fill("shorty@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("Password must be at least 8 characters.")
  ).toBeVisible();
  await expect(page).toHaveURL("/auth/signup");
});

test("shows an error and stays on sign in for a wrong password", async ({
  page,
}) => {
  await page.goto("/auth/signin");
  await submitSignIn(page, MEMBER.email, "definitely-not-the-password");

  await expect(toast(page, "Username or password is wrong.")).toBeVisible();
  await expect(page).toHaveURL("/auth/signin");

  // Still signed out: protected pages keep redirecting.
  await page.goto("/prayers");
  await expect(page).toHaveURL("/auth/signin");
});

test("requires both username and password", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.getByRole("button", { exact: true, name: "Sign in" }).click();

  await expect(page.getByText("Please enter your username.")).toBeVisible();
  await expect(page.getByText("Please enter your password.")).toBeVisible();
});
