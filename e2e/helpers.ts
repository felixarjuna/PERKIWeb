import { expect, type Locator, type Page } from "@playwright/test";
import { ADMIN_PASSCODE, uniqueSuffix } from "./fixtures";

export interface Credentials {
  readonly email: string;
  readonly name: string;
  readonly password: string;
}

/** A brand-new account that no other test knows about. */
export const newCredentials = (label: string): Credentials => {
  const suffix = uniqueSuffix();
  return {
    email: `${label}-${suffix}@e2e.test`,
    name: `${label} ${suffix}`,
    password: `pw-${suffix}`,
  };
};

const NOTIFICATIONS = /^Notifications/;

/** The sonner toast that contains `text`. */
export const toast = (page: Page, text: string | RegExp): Locator =>
  page
    .getByRole("region", { name: NOTIFICATIONS })
    .getByRole("listitem")
    .filter({ hasText: text });

export const signUp = async (page: Page, user: Credentials) => {
  await page.goto("/auth/signup");
  await page.getByLabel("Name", { exact: true }).fill(user.name);
  await page.getByLabel("Username", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(toast(page, "User account created successfully!")).toBeVisible();
  await expect(page).toHaveURL("/auth/signin");
};

/** Fills and submits the credentials form on the current page. */
export const submitSignIn = async (
  page: Page,
  email: string,
  password: string
) => {
  await page.getByLabel("Username", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { exact: true, name: "Sign in" }).click();
};

export const signIn = async (page: Page, email: string, password: string) => {
  await page.goto("/auth/signin");
  await submitSignIn(page, email, password);
  await expect(page).toHaveURL("/");
};

/** Registers a fresh account and leaves the page signed in as it. */
export const signUpAndSignIn = async (page: Page, label: string) => {
  const user = newCredentials(label);
  await signUp(page, user);
  await signIn(page, user.email, user.password);
  return user;
};

const SIGN_IN_PATH = /\/auth\/signin$/;

export const signOut = async (page: Page) => {
  await page.goto("/account");
  // Every /api/auth/session response re-issues the session cookie. If one is
  // still in flight when signing out it can restore the cookie the sign-out
  // just cleared, so let the page's session requests finish first.
  await waitForSession(page);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Sign out" }).click();
  // The post-sign-out redirect lands on http://localhost:<port> rather than
  // the configured base URL, so only the path is asserted here ...
  await expect(page).toHaveURL(SIGN_IN_PATH);
  // ... and the sign-in page is reopened on the base URL. It redirects
  // signed-in visitors home, so staying here proves the session is gone.
  await page.goto("/auth/signin");
  await expect(page).toHaveURL("/auth/signin");
};

/**
 * Waits until the client-side session has loaded (the navigation switches to
 * "Account"). Forms read the username from it, so submit only after this.
 */
export const waitForSession = async (page: Page) => {
  await expect(page.getByRole("button", { name: "Account" })).toBeVisible();
};

/** Picks `option` (or the first option) from the Radix select labelled `label`. */
export const selectOption = async (
  page: Page,
  label: string,
  option?: string
) => {
  await page.getByLabel(label, { exact: true }).click();
  const choice = option
    ? page.getByRole("option", { exact: true, name: option })
    : page.getByRole("option").first();
  // Long lists overflow the viewport and Radix scrolls them itself, so pick
  // the option with the keyboard the way a keyboard user would.
  await choice.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
};

/** Passes the client-side passcode gate in front of /admin/dashboard. */
export const adminLogin = async (page: Page) => {
  await page.goto("/admin");
  await page
    .getByLabel("Username", { exact: true })
    .fill(ADMIN_PASSCODE.username);
  await page
    .getByLabel("Password", { exact: true })
    .fill(ADMIN_PASSCODE.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/admin/dashboard");
};

/** Sets the admin dashboard's rows-per-page select. */
export const setDashboardPageSize = async (page: Page, size: number) => {
  await page.getByRole("combobox").click();
  await page.getByRole("option", { exact: true, name: String(size) }).click();
  // While the select is open Radix hides the rest of the page from the
  // accessibility tree; wait until the table is exposed again.
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(page.getByRole("table")).toBeVisible();
};
