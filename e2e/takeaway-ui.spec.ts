import { expect, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { insertProfiledUser } from "./db";
import { ADMIN, WRITER } from "./fixtures";

for (const account of [WRITER, ADMIN]) {
  test(`${account.name} can see and use every takeaway view at 320px`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 320 });
    await setTestSession(page, account);
    await page.goto("/admin/takeaways");
    const picker = page.getByRole("radiogroup", { exact: true, name: "View" });
    const mine = picker.getByRole("radio", { name: "My takeaways" });
    const all = picker.getByRole("radio", { name: "All takeaways" });
    await expect(picker.getByRole("radio")).toHaveCount(
      account === ADMIN ? 3 : 2
    );
    await expect(account === ADMIN ? all : mine).toBeChecked();
    await mine.focus();
    await page.keyboard.press("ArrowRight");
    const next =
      account === ADMIN
        ? picker.getByRole("radio", { name: "All assignments" })
        : all;
    await expect(next).toBeFocused();
    await page.keyboard.press("Space");
    await expect(next).toBeChecked();
    await expect(next).toHaveCSS("text-decoration-line", "underline");
    await expect(mine).not.toBeChecked();
    const boxes = await Promise.all(
      (await picker.getByRole("radio").all()).map((option) =>
        option.boundingBox()
      )
    );
    for (const box of boxes) {
      expect(box).not.toBeNull();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
    }
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await page.setViewportSize({ height: 900, width: 640 });
    await expect(picker).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
}

test("deadline form explains unchanged and unsaved state", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 320 });
  await setTestSession(page, ADMIN);
  await page.goto("/admin/settings/takeaways");
  await expect(
    page.getByRole("status").filter({ hasText: "No unsaved changes" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save deadline" })
  ).toBeDisabled();
  await page.getByRole("combobox", { name: "Deadline weekday" }).click();
  await page.getByRole("option", { exact: true, name: "Tuesday" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Unsaved changes" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save deadline" })
  ).toBeEnabled();
  const form = page.getByRole("form", { name: "Takeaway deadlines" });
  await expect(form).toContainText("Aachen time");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await page.setViewportSize({ height: 900, width: 640 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});

test("deadline loading and query failure recover without losing the form", async ({
  page,
}) => {
  await setTestSession(page, ADMIN);
  const pattern = "**/api/trpc/*settings.takeawayDeadline*";
  const gate = Promise.withResolvers<void>();
  const retriesFinished = Promise.withResolvers<void>();
  let requests = 0;
  await page.route(pattern, async (route) => {
    await gate.promise;
    await route.abort();
    requests += 1;
    if (requests === 4) {
      retriesFinished.resolve();
    }
  });
  await page.goto("/admin/settings/takeaways");
  await expect(page.getByText("Loading deadline…")).toBeVisible();
  gate.resolve();
  await retriesFinished.promise;
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.unroute(pattern);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("combobox", { name: "Deadline weekday" })
  ).toBeVisible();
});

test("deadline keeps the chosen value after a failed save and offers retry", async ({
  page,
}) => {
  await setTestSession(page, ADMIN);
  await page.goto("/admin/settings/takeaways");
  await page.getByRole("combobox", { name: "Deadline weekday" }).click();
  await page.getByRole("option", { exact: true, name: "Tuesday" }).click();
  const pattern = "**/api/trpc/*settings.setTakeawayDeadline*";
  const gate = Promise.withResolvers<void>();
  await page.route(pattern, async (route) => {
    await gate.promise;
    await route.abort();
  });
  await page.getByRole("button", { name: "Save deadline" }).click();
  await expect(
    page.getByRole("button", { name: "Saving deadline…" })
  ).toBeDisabled();
  gate.resolve();
  await expect(
    page.getByRole("alert").filter({ hasText: "Deadline not saved" })
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Deadline weekday" })
  ).toContainText("Tuesday");
  await expect(
    page.getByRole("button", { name: "Save deadline" })
  ).toBeEnabled();
});

test("assignment loading and failure can recover to an empty view", async ({
  page,
}) => {
  const writer = await insertProfiledUser("Empty assignment writer", "writer");
  await setTestSession(page, writer);
  const pattern = "**/api/trpc/*writerAssignments.mine*";
  const gate = Promise.withResolvers<void>();
  const retriesFinished = Promise.withResolvers<void>();
  let requests = 0;
  await page.route(pattern, async (route) => {
    await gate.promise;
    await route.abort();
    requests += 1;
    if (requests === 4) {
      retriesFinished.resolve();
    }
  });
  await page.goto("/admin/takeaways");
  await expect(page.getByText("Loading assignments…")).toBeVisible();
  gate.resolve();
  await retriesFinished.promise;
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.unroute(pattern);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByText("You have no assigned gatherings or takeaways yet.")
  ).toBeVisible();
});
