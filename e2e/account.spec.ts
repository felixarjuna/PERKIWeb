import { expect, test } from "@playwright/test";
import { uniqueSuffix } from "./fixtures";
import { createSignedInUser, toast } from "./helpers";

const ACCOUNT_LOAD_TIMEOUT_MS = 15_000;

test("Google name and email are locked; members choose a nickname", async ({
  page,
}) => {
  const user = await createSignedInUser(page, "nickname");
  const nickname = `Nick ${uniqueSuffix()}`;
  await page.goto("/account");
  for (const [label, value] of [
    ["Name", user.name],
    ["Email", user.email],
  ] as const) {
    const row = page.getByRole("listitem").filter({ hasText: label }).first();
    // biome-ignore lint/performance/noAwaitInLoops: one row at a time.
    await expect(row).toContainText(value, {
      timeout: ACCOUNT_LOAD_TIMEOUT_MS,
    });
    await expect(
      row.getByRole("button", { name: `${label} comes from Google` })
    ).toBeVisible();
  }
  // A tap on the lock explains it, on phones too.
  await page.getByRole("button", { name: "Email comes from Google" }).click();
  await expect(page.getByRole("tooltip")).toContainText(
    "From your Google account"
  );
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Nickname Optional" }).click();
  const dialog = page.getByRole("dialog", { name: "Nickname" });
  await dialog.getByLabel("Nickname", { exact: true }).fill(nickname);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(toast(page, "Nickname saved")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: `Nickname ${nickname}` })
  ).toBeVisible({ timeout: ACCOUNT_LOAD_TIMEOUT_MS });
  // The Google name is untouched.
  await expect(
    page.getByRole("listitem").filter({ hasText: "Name" }).first()
  ).toContainText(user.name);
});

test("old password settings bookmarks return to the account page", async ({
  page,
}) => {
  await createSignedInUser(page, "old-password-link");
  await page.goto("/account/change-password");
  await expect(page).toHaveURL("/account");
});
