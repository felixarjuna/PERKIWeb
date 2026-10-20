import { expect, type Page, test } from "@playwright/test";
import { insertSchedule } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, selectOption } from "./helpers";

const RSVP_API = "https://rsvp-perkiaachen.fly.dev/**";
const MEMBER_MENU = /E2E Member/;
const widths = [320, 1440] as const;
const publicRoutes = [
  "/group",
  "/schedule",
  "/takeaway",
  "/auth/signin",
  "/auth/signup",
  "/admin",
  "/christmas",
  "/christmas/gift",
  "/christmas/thankyou",
  "/legal-notice",
  "/privacy",
] as const;
const memberRoutes = [
  "/account",
  "/account/change-password",
  "/member/join",
  "/prayers",
  "/create-schedule",
  "/create-takeaway",
] as const;

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
        await page.route(RSVP_API, (request) => request.abort());
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

      test("member dashboard keeps overflow inside the data table", async ({
        page,
      }) => {
        await adminLogin(page);
        await expect(page.getByRole("table")).toBeVisible();
        await expectUsablePage(page);
        await expect(page.getByRole("combobox")).toHaveAccessibleName(
          "Rows per page"
        );
      });

      test("schedule edit form fits the viewport", async ({ page }) => {
        const title = `Interface schedule ${uniqueSuffix()}`;
        const scheduleId = await insertSchedule(title);
        await page.goto(`/edit-schedule/${scheduleId}`);
        await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
          title
        );
        await expectUsablePage(page);
      });

      test("dashboard account menu links to the account page", async ({
        page,
      }) => {
        await adminLogin(page);
        await expect(page.getByRole("table")).toBeVisible();
        if (width === 320) {
          await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        }
        await page.getByRole("button", { name: MEMBER_MENU }).click();
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
        await page.goto("/create-takeaway");
        await selectOption(page, "Schedule", title);
        await page.getByLabel("Key points", { exact: true }).fill(keypoints);
        await page.getByRole("button", { name: "Add takeaway" }).click();
        await expect(page).toHaveURL("/takeaway");
        await page
          .getByRole("article")
          .filter({ hasText: keypoints })
          .getByRole("button", { exact: true, name: "Edit" })
          .click();
        const editor = page.getByLabel("Key points", { exact: true });
        await expect(editor).toHaveValue(keypoints);
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
        const filter = page.getByRole("combobox", { name: "Fellowship type" });
        await expect(filter).toHaveText("All fellowships");
        await filter.focus();
        await page.keyboard.press("Enter");
        await expect(
          page.getByRole("option", { name: "All fellowships" })
        ).toHaveAttribute("aria-selected", "true");
        await page.keyboard.press("End");
        await page.keyboard.press("Enter");
        await expect(filter).toHaveText("Bible study");
        await selectOption(page, "Fellowship type", "All fellowships");
        await expect(filter).toHaveText("All fellowships");
      });
    });
  });
}
