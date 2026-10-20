import { expect, test } from "@playwright/test";
import { MEMBER_STORAGE_STATE } from "./fixtures";
import { adminLogin, selectOption } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

test("overview shows real registration and birthday controls", async ({
  page,
}) => {
  await adminLogin(page);
  await expect(
    page.getByRole("heading", { name: "Your community, at a glance." })
  ).toBeVisible();
  const month = page.getByRole("group", { name: "Month" }).locator("output");
  const shown = await month.textContent();
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(month).not.toHaveText(shown ?? "");
  await page.getByRole("button", { exact: true, name: "This month" }).click();
  await expect(month).toHaveText(shown ?? "");
  await expect(
    page.getByRole("heading", { name: "Time to celebrate" })
  ).toBeVisible();
  const history = page
    .getByRole("list", { name: "Registration history" })
    .getByRole("listitem");
  for (const [range, count] of [
    ["1Y", 12],
    ["2Y", 8],
    ["5Y", 5],
    ["6M", 6],
  ] as const) {
    // biome-ignore lint/performance/noAwaitInLoops: one range at a time.
    await page.getByRole("radio", { exact: true, name: range }).click();
    await expect(history).toHaveCount(count);
  }
  await page.getByRole("radio", { name: "Total" }).click();
  // A column lists who registered then; the overview month stays put.
  await history.last().getByRole("button").click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("Registered in");
  await expect(sheet.getByRole("link").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(month).toHaveText(shown ?? "");
  await selectOption(page, "Location", "Aachen");
  await expect(
    page.getByRole("term").filter({ hasText: "Members" })
  ).toBeVisible();
});

for (const width of [320, 390, 1440]) {
  test(`admin screens fit ${width}px and navigation works`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width });
    await adminLogin(page);
    for (const route of [
      "/admin/dashboard",
      "/admin/members",
      "/admin/schedules",
      "/admin/takeaways",
      "/admin/prayers",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: one browser page must navigate sequentially.
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
    }
    if (width < 768) {
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      const sidebar = page.getByRole("dialog");
      await expect(
        sidebar.getByRole("link", { exact: true, name: "Members" })
      ).toBeVisible();
      await sidebar.getByRole("link", { exact: true, name: "Members" }).click();
      await expect(sidebar).toBeHidden();
      await expect(page).toHaveURL("/admin/members");
      await expect(page.getByRole("table")).toBeVisible();
      await page
        .getByLabel("Search members", { exact: true })
        .fill("Dash Seed 01");
      await page
        .getByRole("button", {
          exact: true,
          name: "Dash Seed 01",
        })
        .click();
      await expect(page.getByRole("dialog")).toContainText("Dash Seed 01");
    }
    await page.screenshot({
      fullPage: true,
      path: `test-results/admin-${width}.png`,
    });
  });
}
