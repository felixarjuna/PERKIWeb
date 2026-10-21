import { expect, type Locator, type Page } from "@playwright/test";
import { createTestAccount, setTestSession } from "./auth-fixtures";
import { ADMIN } from "./fixtures";

const NOTIFICATIONS = /^Notifications/;

/** The sonner toast that contains `text`. */
export const toast = (page: Page, text: string | RegExp): Locator =>
  page
    .getByRole("region", { name: NOTIFICATIONS })
    .getByRole("listitem")
    .filter({ hasText: text });

/** Creates an isolated Google-linked fixture and an authenticated browser session. */
export const createSignedInUser = async (page: Page, label: string) => {
  const user = await createTestAccount(label);
  await setTestSession(page, user);
  await page.goto("/");
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
  await expect(
    page.getByRole("button", { exact: true, name: "Account" })
  ).toBeVisible();
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

/** Signs the browser in as `account` and opens /admin (it forwards by role). */
export const loginAs = async (
  page: Page,
  account: { email: string; id: string; name: string }
) => {
  // A session request still in flight from the previous page would re-set
  // that user's cookie after the switch.
  await page.waitForLoadState("networkidle");
  await setTestSession(page, account);
  await page.goto("/admin");
};

/** Signs the browser in as the seeded admin and opens the dashboard. */
export const adminLogin = async (page: Page) => {
  await loginAs(page, ADMIN);
  await expect(page).toHaveURL("/admin/dashboard");
};

/** Sets the admin dashboard's rows-per-page select. */
export const setDashboardPageSize = async (page: Page, size: number) => {
  if (!page.url().includes("/admin/members")) {
    await page.goto("/admin/members");
  }
  await selectOption(page, "Rows per page", String(size));
  await expect(page.getByRole("table")).toBeVisible();
};

const LOAD_MORE = /^Load more/;
/** Most "Load more" clicks a spec waits through before giving up. */
const MAX_PAGES = 20;

/**
 * Clicks a list's "Load more" until `target` shows up, since specs share one
 * database and parallel specs can push an item past the first page. Pages
 * with several lists name theirs, e.g. "Load more upcoming gatherings".
 */
export const loadUntilVisible = async (
  page: Page,
  target: Locator,
  button: string | RegExp = LOAD_MORE
) => {
  const more = page.getByRole("button", { name: button });
  for (let pages = 0; pages < MAX_PAGES; pages += 1) {
    // biome-ignore lint/performance/noAwaitInLoops: each page waits for the last.
    await expect(target.or(more).first()).toBeVisible();
    if (await target.first().isVisible()) {
      return;
    }
    await more.click();
  }
  await expect(target.first()).toBeVisible();
};
