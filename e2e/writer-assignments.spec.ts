import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { setTestSession } from "./auth-fixtures";
import { insertProfiledUser, insertSchedule } from "./db";
import { assertLocalDatabase, e2eEnv } from "./env";
import { ADMIN, uniqueSuffix } from "./fixtures";
import { selectOption } from "./helpers";

// The first test changes the shared deadline setting, then restores Friday.
test.describe.configure({ mode: "default" });

test("staff can save a new deadline weekday without a deploy", async ({
  page,
}) => {
  await setTestSession(page, ADMIN);
  await page.goto("/admin/settings");
  await page
    .getByRole("navigation", { name: "Settings sections" })
    .getByRole("link", { name: "Takeaways" })
    .click();
  await selectOption(page, "Deadline weekday", "Monday");
  await page.getByRole("button", { name: "Save deadline" }).click();
  await expect(page.getByText("Takeaway deadline saved.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Deadline weekday" })
  ).toContainText("Monday");
  await selectOption(page, "Deadline weekday", "Friday");
  await page.getByRole("button", { name: "Save deadline" }).click();
  await expect(page.getByText("Takeaway deadline saved.")).toBeVisible();
});

test("an assigned gathering moves into the writer's drafts after saving", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const writer = await insertProfiledUser(
    `Assigned writer ${suffix}`,
    "writer"
  );
  const title = `Assigned gathering ${suffix}`;
  const scheduleId = await insertSchedule(
    title,
    new Date("2026-01-03T14:30:00Z")
  );
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const sql = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    await sql`insert into schedule_assignments ("scheduleId", role, name, "userId") values (${scheduleId}, 'note_writer', ${writer.name}, ${writer.id})`;
  } finally {
    await sql.end();
  }
  await setTestSession(page, writer);
  await page.goto("/admin/takeaways");
  await expect(
    page.getByRole("radio", { exact: true, name: "Mine" })
  ).toBeChecked();
  const pending = page
    .getByRole("region", { name: "To write" })
    .getByRole("listitem")
    .filter({ hasText: title });
  await expect(pending).toContainText("Overdue");
  await expect(pending).toContainText("Due 9 Jan 2026");
  await pending.getByRole("link", { name: "Write takeaway" }).click();
  await selectOption(page, "Schedule", title);
  await page
    .getByLabel("Key points", { exact: true })
    .fill("A reflection on serving our community.");
  await page.getByRole("button", { exact: true, name: "Save draft" }).click();
  await expect(page).toHaveURL("/admin/takeaways");
  const draft = page
    .getByRole("region", { name: "Drafts" })
    .getByRole("listitem")
    .filter({ hasText: title });
  await expect(draft).toContainText("Draft");
  await expect(
    draft.getByRole("link", { name: "Continue draft" })
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "To write" })).toHaveCount(0);
});
