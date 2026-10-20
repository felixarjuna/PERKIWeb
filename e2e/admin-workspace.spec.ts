import { expect, test } from "@playwright/test";
import { MEMBER_STORAGE_STATE } from "./fixtures";
import { adminLogin } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

test("overview shows real registration and birthday controls", async ({
  page,
}) => {
  await adminLogin(page);
  await expect(
    page.getByRole("heading", { name: "Your community, at a glance." })
  ).toBeVisible();
  await page.getByLabel("Month", { exact: true }).fill("2026-10");
  await expect(
    page.getByRole("heading", { name: "Time to celebrate" })
  ).toBeVisible();
  await page.getByLabel("Chart range").selectOption("12");
  await expect(
    page
      .getByRole("list", { name: "Registration history" })
      .getByRole("listitem")
  ).toHaveCount(12);
  await page.getByLabel("Show", { exact: true }).selectOption("cumulative");
  await page.getByLabel("Location", { exact: true }).selectOption("aachen");
  await expect(
    page.getByText("Registered members", { exact: true })
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
      await expect(page.getByRole("table")).toBeHidden();
      await page
        .getByLabel("Search members", { exact: true })
        .fill("Dash Seed 01");
      await page
        .getByRole("button", {
          exact: true,
          name: "View details for Dash Seed 01",
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
