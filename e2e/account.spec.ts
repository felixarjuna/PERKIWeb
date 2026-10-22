import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { setTestSession } from "./auth-fixtures";
import { assertLocalDatabase, e2eEnv } from "./env";
import { OWNER, uniqueSuffix } from "./fixtures";
import { createSignedInUser, toast, waitForSession } from "./helpers";

const ACCOUNT_LOAD_TIMEOUT_MS = 15_000;
/** A writer by request, newest first, then the day they joined. */
const HISTORY = [
  /^You became a writerYour request was approved · /,
  /^You joined PERKI/,
];

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

/** Runs `query` against the e2e database. */
const withDb = async <T>(query: (sql: postgres.Sql) => Promise<T>) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const sql = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    return await query(sql);
  } finally {
    await sql.end();
  }
};

test("members delete their account after confirming on purpose", async ({
  page,
}) => {
  const user = await createSignedInUser(page, "leaving");
  const content = `Prayer before leaving ${uniqueSuffix()}`;
  await withDb(
    (sql) =>
      sql`insert into prayers ("authorId", content, "prayerNames") values (${user.id}, ${content}, '[]')`
  );

  await page.goto("/account");
  await waitForSession(page);
  await page.getByRole("button", { name: "Delete account" }).click();
  const dialog = page.getByRole("alertdialog", {
    name: "Delete your account?",
  });
  await expect(dialog).toContainText("can't be undone");
  const confirm = dialog.getByRole("button", { name: "Delete account" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Type “delete” to confirm").fill("delete");
  await confirm.click();

  await expect(toast(page, "Your account has been deleted.")).toBeVisible();
  await expect(page).toHaveURL("/");
  // Signed out: the sign-in page no longer forwards home.
  await page.goto("/auth/signin");
  await expect(page).toHaveURL("/auth/signin");

  const left = await withDb(async (sql) => ({
    prayers: await sql`select id from prayers where content = ${content}`,
    users: await sql`select id from "user" where id = ${user.id}`,
  }));
  expect(left.users).toHaveLength(0);
  expect(left.prayers).toHaveLength(0);
});

test("the owner can't delete their account", async ({ page }) => {
  await setTestSession(page, OWNER);
  await page.goto("/account");
  await waitForSession(page);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Delete account" })
  ).toHaveCount(0);
});

test("members see their history and write a few lines about themselves", async ({
  page,
}) => {
  const user = await createSignedInUser(page, "history");
  await withDb(
    (sql) => sql`
      with promoted as (
        update "user" set role = 'writer' where id = ${user.id}
      )
      insert into role_changes ("userId", "fromRole", "toRole", source)
      values (${user.id}, 'member', 'writer', 'request')`
  );
  await page.goto("/account");

  const history = page.getByRole("list", { name: "Your history" });
  await expect(history.getByRole("listitem")).toHaveText(HISTORY, {
    timeout: ACCOUNT_LOAD_TIMEOUT_MS,
  });
  await expect(
    page.getByRole("heading", { name: "Your role: Writer" })
  ).toBeVisible();

  const bio = `Studying in Aachen ${uniqueSuffix()}`;
  await page.getByRole("button", { name: "About me Optional" }).click();
  const dialog = page.getByRole("dialog", { name: "About me" });
  await dialog.getByLabel("About me").fill(bio);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(toast(page, "About me saved")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: `About me ${bio}` })
  ).toBeVisible({ timeout: ACCOUNT_LOAD_TIMEOUT_MS });
});
