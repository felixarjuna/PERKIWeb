import { expect, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { insertSchedule, insertTakeaway } from "./db";
import { ADMIN_PASSCODE, MEMBER, uniqueSuffix } from "./fixtures";
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

test("management deep links keep the existing admin gate and resume afterward", async ({
  page,
}) => {
  await setTestSession(page, MEMBER);
  await page.goto("/admin/schedules/new");
  await expect(page).toHaveURL("/admin?callbackUrl=%2Fadmin%2Fschedules%2Fnew");
  await page
    .getByLabel("Username", { exact: true })
    .fill(ADMIN_PASSCODE.username);
  await page
    .getByLabel("Password", { exact: true })
    .fill(ADMIN_PASSCODE.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/admin/schedules/new");
  await expect(
    page.getByRole("heading", { exact: true, name: "Add schedule" })
  ).toBeVisible();
});

test("old editor links preserve the new destination through Google sign-in", async ({
  page,
}) => {
  await page.goto("/create-schedule?source=bookmark");
  await expect(page).toHaveURL(
    "/auth/signin?callbackUrl=%2Fadmin%2Fschedules%2Fnew%3Fsource%3Dbookmark"
  );
});

for (const section of ["schedules", "takeaways"]) {
  test(`Back from a direct ${section} editor returns to management`, async ({
    page,
  }) => {
    await setTestSession(page, MEMBER);
    await adminLogin(page);
    await page.goto("/schedule");
    await page.goto(`/admin/${section}/new`);
    await page.getByRole("button", { exact: true, name: "Back" }).click();
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
