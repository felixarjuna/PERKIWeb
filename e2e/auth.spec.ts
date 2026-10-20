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
  await page.getByRole("button", { exact: true, name: "Account" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);

  await signOut(page);
  await expect(
    page.getByRole("button", { exact: true, name: "Sign in" })
  ).toBeVisible();

  // Protected pages are closed again once signed out.
  await page.goto("/account");
  await expect(page).toHaveURL("/auth/signin?callbackUrl=%2Faccount");
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
  await expect(page).toHaveURL("/auth/signin?callbackUrl=%2Fprayers");
});

test("requires both username and password", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.getByRole("button", { exact: true, name: "Sign in" }).click();

  await expect(page.getByText("Please enter your username.")).toBeVisible();
  await expect(page.getByText("Please enter your password.")).toBeVisible();
});

test("keeps the requested member page through signup and login", async ({
  page,
}) => {
  const user = newCredentials("return-member");
  await page.goto("/member/join?source=footer");
  await expect(page).toHaveURL(
    "/auth/signin?callbackUrl=%2Fmember%2Fjoin%3Fsource%3Dfooter"
  );
  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByLabel("Name", { exact: true }).fill(user.name);
  await page.getByLabel("Username", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(
    "/auth/signin?callbackUrl=%2Fmember%2Fjoin%3Fsource%3Dfooter"
  );
  await submitSignIn(page, user.email, user.password);
  await expect(page).toHaveURL("/member/join?source=footer");
  await expect(page.getByLabel("Date of birth", { exact: true })).toBeVisible();
});

test("returns to the requested prayer page after login", async ({ page }) => {
  await page.goto("/prayers");
  await submitSignIn(page, MEMBER.email, MEMBER.password);
  await expect(page).toHaveURL("/prayers");
});

test("navigation sign in returns to the last page including query and fragment", async ({
  page,
}) => {
  await page.goto("/schedule?month=10#services");
  await page.getByRole("button", { exact: true, name: "Sign in" }).click();
  await expect(page).toHaveURL(
    "/auth/signin?callbackUrl=%2Fschedule%3Fmonth%3D10%23services"
  );
  await submitSignIn(page, MEMBER.email, MEMBER.password);
  await expect(page).toHaveURL("/schedule?month=10#services");
});

test("signed-in users follow a safe callback without a second login", async ({
  page,
}) => {
  await signIn(page, MEMBER.email, MEMBER.password);
  await page.goto("/auth/signin?callbackUrl=%2Faccount");
  await expect(page).toHaveURL("/account");
  await page.goto("/auth/signup?callbackUrl=%2Fmember%2Fjoin");
  await expect(page).toHaveURL("/member/join");
});

test("an unsafe callback cannot navigate away after login", async ({
  page,
}) => {
  await page.goto("/auth/signin?callbackUrl=javascript%3Aalert(1)");
  await submitSignIn(page, MEMBER.email, MEMBER.password);
  await expect(page).toHaveURL("/");
});

test("OAuth error retries retain the saved destination", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "authjs.callback-url",
      url: "http://127.0.0.1:3100",
      value: "http://127.0.0.1:3100/prayers",
    },
  ]);
  await page.goto("/auth/signin?error=OAuthAccountNotLinked");
  await expect(page.getByRole("alert")).toContainText(
    "Sign in could not be completed"
  );
  await submitSignIn(page, MEMBER.email, MEMBER.password);
  await expect(page).toHaveURL("/prayers");
});
