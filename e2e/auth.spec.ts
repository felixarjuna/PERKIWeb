import { expect, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { BASE_URL } from "./env";
import { MEMBER } from "./fixtures";
import { createSignedInUser, signOut } from "./helpers";

const GOOGLE_BUTTON = "Continue with Google";

test("offers Google as the only authentication provider", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/auth/providers");
  expect(Object.keys(await response.json())).toEqual(["google"]);
  await page.goto("/auth/signin");
  await expect(page.getByRole("button", { name: GOOGLE_BUTTON })).toBeVisible();
  await expect(page.getByLabel("Username", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Your account is created automatically", { exact: false })
  ).toBeVisible();
});

test("legacy signup links preserve the member destination", async ({
  page,
}) => {
  await page.goto(
    "/auth/signup?callbackUrl=%2Fmember%2Fjoin%3Fsource%3Dfooter"
  );
  await expect(page).toHaveURL(
    "/auth/signin?callbackUrl=%2Fmember%2Fjoin%3Fsource%3Dfooter"
  );
  await expect(page.getByRole("button", { name: GOOGLE_BUTTON })).toBeVisible();
});

test("Google sign-in sets the requested destination before leaving for Google", async ({
  page,
  context,
}) => {
  // Intercept only Google's browser page. AuthJS still performs its actual
  // provider discovery and builds the real Google authorization request.
  await page.route("https://accounts.google.com/**", (route) =>
    route.fulfill({
      body: "<h1>Google authorization</h1>",
      contentType: "text/html",
    })
  );
  await page.goto(
    "/auth/signin?callbackUrl=%2Fmember%2Fjoin%3Fsource%3Dfooter"
  );
  await page.getByRole("button", { name: GOOGLE_BUTTON }).click();
  await expect(page).toHaveURL((url) => url.hostname === "accounts.google.com");
  const googleUrl = new URL(page.url());
  expect(googleUrl.searchParams.get("client_id")).toBe("e2e-google-client-id");
  expect(googleUrl.searchParams.get("code_challenge")).toBeTruthy();
  const callbackCookie = (await context.cookies(BASE_URL)).find(
    (cookie) => cookie.name === "authjs.callback-url"
  );
  expect(
    new URL(decodeURIComponent(callbackCookie?.value ?? "")).pathname
  ).toBe("/member/join");
  expect(new URL(decodeURIComponent(callbackCookie?.value ?? "")).search).toBe(
    "?source=footer"
  );
  await page.goto(
    `${BASE_URL}/api/auth/callback/google?error=access_denied&iss=https%3A%2F%2Faccounts.google.com`
  );
  await expect(page).toHaveURL(
    (url) => url.pathname === "/auth/signin" && url.searchParams.has("error")
  );
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Google sign-in could not be completed" })
  ).toContainText("Google sign-in could not be completed");
  await setTestSession(page, MEMBER);
  await page.reload();
  await expect(page).toHaveURL("/member/join?source=footer");
});

test("signs out a Google account and protects member pages again", async ({
  page,
}) => {
  await createSignedInUser(page, "logout");
  await signOut(page);
  await page.goto("/member/join");
  await expect(page).toHaveURL("/auth/signin?callbackUrl=%2Fmember%2Fjoin");
});

test("navigation preserves the last page including query and fragment", async ({
  page,
}) => {
  await page.goto("/schedule?month=10#services");
  await page.getByRole("button", { exact: true, name: "Sign in" }).click();
  await expect(page).toHaveURL(
    "/auth/signin?callbackUrl=%2Fschedule%3Fmonth%3D10%23services"
  );
  await setTestSession(page, MEMBER);
  await page.reload();
  await expect(page).toHaveURL("/schedule?month=10#services");
});

test("authenticated Google users follow safe destinations without another login", async ({
  page,
}) => {
  await setTestSession(page, MEMBER);
  await page.goto("/auth/signin?callbackUrl=%2Faccount");
  await expect(page).toHaveURL("/account");
  await page.goto("/auth/signup?callbackUrl=%2Fmember%2Fjoin");
  await expect(page).toHaveURL("/member/join");
});

test("unsafe callback destinations stay on the application", async ({
  page,
}) => {
  await setTestSession(page, MEMBER);
  await page.goto("/auth/signin?callbackUrl=javascript%3Aalert(1)");
  await expect(page).toHaveURL("/");
});

test("OAuth error retries preserve the saved member destination", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "authjs.callback-url",
      url: BASE_URL,
      value: `${BASE_URL}/member/join`,
    },
  ]);
  await page.goto("/auth/signin?error=OAuthCallbackError");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Google sign-in could not be completed" })
  ).toContainText("Google sign-in could not be completed");
  await expect(page.getByRole("button", { name: GOOGLE_BUTTON })).toBeEnabled();
  await setTestSession(page, MEMBER);
  await page.reload();
  await expect(page).toHaveURL("/member/join");
});

test("removed password mutations are not available over HTTP", async ({
  request,
}) => {
  const responses = await Promise.all(
    ["createUser", "updatePassword"].map((name) =>
      request.post(`/api/trpc/users.${name}`, {
        data: {
          json: {
            name: "Stranger",
            password: "password123",
            username: "stranger",
          },
        },
      })
    )
  );
  expect(responses.map((response) => response.status())).toEqual([404, 404]);
});
