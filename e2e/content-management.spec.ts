import { expect, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { insertSchedule, insertTakeaway } from "./db";
import { ADMIN, MEMBER, uniqueSuffix } from "./fixtures";
import { adminLogin } from "./helpers";

for (const signedIn of [false, true]) {
  test(`public content stays read-only when signed in = ${signedIn}`, async ({
    page,
  }) => {
    if (signedIn) {
      await setTestSession(page, MEMBER);
    }
    const title = `Published ${uniqueSuffix()}`;
    const summary = `Published summary ${uniqueSuffix()}`;
    const scheduleId = await insertSchedule(title);
    await insertTakeaway(scheduleId, summary);
    await page.goto("/schedule");
    await expect(
      page.getByRole("heading", { exact: true, name: title })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Add schedule" })).toHaveCount(
      0
    );
    await expect(
      page.getByRole("button", { exact: true, name: "Edit" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { exact: true, name: "Delete" })
    ).toHaveCount(0);
    await page.goto("/takeaway");
    await expect(
      page.getByRole("article").filter({ hasText: summary })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Add takeaway" })).toHaveCount(
      0
    );
    await expect(
      page.getByRole("button", { exact: true, name: "Edit" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { exact: true, name: "Delete" })
    ).toHaveCount(0);
  });
}

test("management deep links open directly for admins", async ({ page }) => {
  await setTestSession(page, ADMIN);
  await page.goto("/admin/schedules/new");
  await expect(page).toHaveURL("/admin/schedules/new");
  await expect(
    page.getByRole("heading", { exact: true, name: "Add schedule" })
  ).toBeVisible();
});

test("the old /admin entry forwards admins to the requested page", async ({
  page,
}) => {
  await setTestSession(page, ADMIN);
  await page.goto("/admin?callbackUrl=%2Fadmin%2Ftakeaways");
  await expect(page).toHaveURL("/admin/takeaways");
});

test("old editor links preserve the new destination through Google sign-in", async ({
  page,
}) => {
  await page.goto("/create-schedule?source=bookmark");
  await expect(page).toHaveURL(
    "/auth/signin?callbackUrl=%2Fadmin%2Fschedules%2Fnew%3Fsource%3Dbookmark"
  );
});

// The schedule editor leaves with a "Cancel" link, the takeaway editor with "Back".
for (const [section, role, name] of [
  ["schedules", "link", "Cancel"],
  ["takeaways", "button", "Back"],
] as const) {
  test(`${name} from a direct ${section} editor returns to management`, async ({
    page,
  }) => {
    await setTestSession(page, MEMBER);
    await adminLogin(page);
    await page.goto("/schedule");
    await page.goto(`/admin/${section}/new`);
    await page.getByRole(role, { exact: true, name }).click();
    await expect(page).toHaveURL(`/admin/${section}`);
  });
}

for (const path of [
  "/admin/schedules",
  "/admin/takeaways",
  "/admin/schedules/new",
  "/admin/takeaways/new",
]) {
  test(`${path} fits a phone viewport`, async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await setTestSession(page, MEMBER);
    await adminLogin(page);
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  });
}
