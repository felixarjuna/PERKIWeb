import { expect, type Page, test } from "@playwright/test";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, toast } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

/** A request on the public wall, as opposed to "Your requests". */
const communityPrayer = (page: Page, text: string) =>
  page
    .getByRole("list", { name: "Community prayers" })
    .getByRole("listitem")
    .filter({ hasText: text });

const ownPrayer = (page: Page, text: string) =>
  page
    .getByRole("list", { name: "Your requests" })
    .getByRole("listitem")
    .filter({ hasText: text });

const reviewItem = (page: Page, text: string) =>
  page.locator("main li").filter({ hasText: text });

const submitOnWall = async (page: Page, content: string) => {
  await page.goto("/prayers");
  await page.getByLabel("Prayer request").fill(content);
  await page
    .getByRole("button", { exact: true, name: "Submit request" })
    .click();
  await expect(toast(page, "Your prayer is submitted!")).toBeVisible();
};

test("prayer submission, publication, acknowledgement, editing and unpublication", async ({
  page,
  browser,
}) => {
  const content = `Prayer ${uniqueSuffix()}`;
  const edited = `Updated ${uniqueSuffix()}`;
  await submitOnWall(page, content);
  await expect(communityPrayer(page, content)).toHaveCount(0);
  await expect(ownPrayer(page, content)).toContainText("Waiting for review");
  await adminLogin(page);
  await page.goto("/admin/prayers");
  const item = reviewItem(page, content);
  await expect(item).toContainText("Private");
  await item.getByRole("button", { exact: true, name: "Publish" }).click();
  await expect(item).toContainText("Published");
  const anonymous = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const publicPage = await anonymous.newPage();
  await publicPage.goto("/prayers");
  await expect(communityPrayer(publicPage, content)).toBeVisible();
  await expect(
    publicPage.getByRole("button", { exact: true, name: "Edit" })
  ).toHaveCount(0);
  await page.goto("/prayers");
  const request = communityPrayer(page, content);
  await request.getByRole("button", { name: "Pray with them" }).click();
  await expect(request).toContainText("1 praying");
  await page.reload();
  await expect(
    request.getByRole("button", { name: "Praying with you" })
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/admin/prayers");
  await item.getByRole("button", { exact: true, name: "Edit" }).click();
  await page.getByRole("dialog").getByLabel("Prayer request").fill(edited);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const updated = reviewItem(page, edited);
  // An admin's edit keeps the request published.
  await expect(updated).toContainText("Published");
  await updated
    .getByRole("button", { exact: true, name: "Make private" })
    .click();
  await expect(updated).toContainText("Private");
  await publicPage.reload();
  await expect(communityPrayer(publicPage, edited)).toHaveCount(0);
  await updated
    .getByRole("button", { exact: true, name: `Delete ${edited}` })
    .click();
  await page.getByRole("button", { exact: true, name: "Delete entry" }).click();
  await expect(updated).toHaveCount(0);
  await anonymous.close();
});

test("authors manage their own requests, and edits go back to review", async ({
  page,
  browser,
}) => {
  const content = `Own ${uniqueSuffix()}`;
  const edited = `Own edited ${uniqueSuffix()}`;
  await submitOnWall(page, content);
  const own = ownPrayer(page, content);
  await expect(own).toContainText("Waiting for review");

  // Publish it as the admin in a second browser.
  const adminContext = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const adminPage = await adminContext.newPage();
  await adminLogin(adminPage);
  await adminPage.goto("/admin/prayers");
  await reviewItem(adminPage, content)
    .getByRole("button", { exact: true, name: "Publish" })
    .click();
  await expect(reviewItem(adminPage, content)).toContainText("Published");

  await page.reload();
  await expect(own).toContainText("Published");
  await expect(communityPrayer(page, content)).toBeVisible();

  await own.getByRole("button", { exact: true, name: "Edit" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("go back to review");
  await dialog.getByLabel("Prayer request").fill(edited);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();
  const ownEdited = ownPrayer(page, edited);
  await expect(ownEdited).toContainText("Waiting for review");
  await expect(communityPrayer(page, edited)).toHaveCount(0);

  await ownEdited
    .getByRole("button", { exact: true, name: `Delete ${edited}` })
    .click();
  await page.getByRole("button", { exact: true, name: "Delete entry" }).click();
  await expect(ownEdited).toHaveCount(0);
  await adminContext.close();
});

test("anonymous prayers retain anonymity after publication", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/prayers");
  const content = `Anonymous ${uniqueSuffix()}`;
  await page.getByRole("button", { exact: true, name: "Add request" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Prayer request").fill(content);
  await dialog.getByRole("switch", { name: "Post anonymously" }).click();
  await dialog
    .getByRole("button", { exact: true, name: "Submit request" })
    .click();
  await expect(dialog).toBeHidden();
  const item = reviewItem(page, content);
  await item.getByRole("button", { exact: true, name: "Publish" }).click();
  await expect(item).toContainText("Published");
  await page.goto("/prayers");
  const published = communityPrayer(page, content);
  await expect(published).toContainText("Anonymous");
  await expect(published).not.toContainText("e2eadmin");
});
