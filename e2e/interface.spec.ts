import { expect, type Page, test } from "@playwright/test";
import { insertSchedule } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, selectOption } from "./helpers";

/** The admin pages are opened as the seeded admin (`adminLogin`). */
const ADMIN_MENU = /E2E Admin/;
const widths = [320, 1440] as const;
const publicRoutes = [
  "/group",
  "/schedule",
  "/takeaway",
  "/auth/signin",
  "/auth/signup",
  "/admin",
  "/legal-notice",
  "/privacy",
] as const;
const memberRoutes = ["/account", "/prayers"] as const;

test.afterEach(async ({ page }, testInfo) => {
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("page.png"),
  });
});

const expectUsablePage = async (page: Page) => {
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(overflow, "page must fit without horizontal scrolling").toBe(false);
};

for (const width of widths) {
  test.describe(`interface at ${width}px`, () => {
    test.use({ viewport: { height: 900, width } });

    for (const route of publicRoutes) {
      test(`${route} has readable structure and fits the viewport`, async ({
        page,
      }) => {
        await page.goto(route);
        await expectUsablePage(page);
      });
    }

    test.describe("signed-in pages", () => {
      test.use({ storageState: MEMBER_STORAGE_STATE });

      for (const route of memberRoutes) {
        test(`${route} has readable structure and fits the viewport`, async ({
          page,
        }) => {
          await page.goto(route);
          await expect(page).toHaveURL(route);
          await expectUsablePage(page);
        });
      }

      for (const route of [
        "/admin/names",
        "/admin/schedules",
        "/admin/settings/integrations",
        "/admin/settings/takeaways",
        "/admin/speakers",
        "/admin/takeaways",
        "/admin/schedules/new",
        "/admin/takeaways/new",
      ]) {
        test(`${route} has readable structure and fits the viewport`, async ({
          page,
        }) => {
          await adminLogin(page);
          await page.goto(route);
          await expect(page).toHaveURL(route);
          await expectUsablePage(page);
        });
      }

      test("member directory fits the viewport", async ({ page }) => {
        await adminLogin(page);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectUsablePage(page);
        await page.goto("/admin/members");
        await expect(page.getByLabel("Rows per page")).toHaveAccessibleName(
          "Rows per page"
        );
      });

      test("settings navigation fits and keeps the last link reachable by keyboard", async ({
        page,
      }) => {
        await adminLogin(page);
        await page.goto("/admin/settings/takeaways");
        const nav = page.getByRole("navigation", { name: "Settings sections" });
        await nav
          .getByRole("link", { exact: true, name: "Integrations" })
          .focus();
        await page.keyboard.press("Tab");
        await expect(
          nav.getByRole("link", { exact: true, name: "Takeaways" })
        ).toBeFocused();
        await page.keyboard.press("Tab");
        const account = nav.getByRole("link", { exact: true, name: "Account" });
        await expect(account).toBeFocused();
        const bounds = await account.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds?.x).toBeGreaterThanOrEqual(0);
        expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
          width
        );
        await expectUsablePage(page);
      });

      test("schedule edit form fits the viewport", async ({ page }) => {
        const title = `Interface schedule ${uniqueSuffix()}`;
        const scheduleId = await insertSchedule(title);
        await adminLogin(page);
        await page.goto(`/admin/schedules/${scheduleId}/edit`);
        await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
          title
        );
        await expectUsablePage(page);
      });

      test("dashboard account menu links to the account page", async ({
        page,
      }) => {
        await adminLogin(page);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        if (width === 320) {
          await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        }
        await page.getByRole("button", { name: ADMIN_MENU }).click();
        const accountLink = page.getByRole("menuitem", {
          exact: true,
          name: "Account",
        });
        await expect(accountLink).toHaveAttribute("href", "/account");
        await accountLink.click();
        await expect(page).toHaveURL("/account");
      });

      test("takeaway edit fields use the full content width", async ({
        page,
      }) => {
        const title = `Interface takeaway ${uniqueSuffix()}`;
        const keypoints = `A shared reflection ${uniqueSuffix()}`;
        await insertSchedule(title);
        await adminLogin(page);
        await page.goto("/admin/takeaways/new");
        await selectOption(page, "Schedule", title);
        await page.getByLabel("Key points", { exact: true }).fill(keypoints);
        await page.getByRole("button", { name: "Save draft" }).click();
        await expect(page).toHaveURL("/admin/takeaways");
        await page
          .getByRole("listitem")
          .filter({ hasText: keypoints })
          .getByRole("link", { exact: true, name: `Edit ${title}` })
          .click();
        const editor = page.getByLabel("Key points", { exact: true });
        await expect(editor).toHaveText(keypoints);
        const editorWidth = await editor.evaluate(
          (element) => element.getBoundingClientRect().width
        );
        const scheduleWidth = await page
          .locator("input:disabled")
          .evaluate((element) => element.getBoundingClientRect().width);
        expect(editorWidth).toBeCloseTo(scheduleWidth);
        await expectUsablePage(page);
      });

      test("takeaway filter shows its current value and supports keyboard selection", async ({
        page,
      }) => {
        await page.goto("/takeaway");
        const filter = page.getByRole("combobox", { name: "Gathering type" });
        await expect(filter).toHaveText("All gatherings");
        await filter.focus();
        await page.keyboard.press("Enter");
        await expect(
          page.getByRole("option", { name: "All gatherings" })
        ).toHaveAttribute("aria-selected", "true");
        await expect(
          page.getByRole("option", { name: "All gatherings" })
        ).toBeFocused();
        await page.keyboard.press("End");
        await expect(
          page.getByRole("option", { name: "Bible studies" })
        ).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(filter).toHaveText("Bible studies");
        await selectOption(page, "Gathering type", "All gatherings");
        await expect(filter).toHaveText("All gatherings");
      });
    });
  });
}
