import { expect, test } from "@playwright/test";
import { insertProfiledUser } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, selectOption, toast } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

const NOT_FOUND = 404;
const SIGN_IN = /\/auth\/signin/;

test("visitors sign in for the library and members get a 404 at the shelf", async ({
  browser,
  page,
}) => {
  const response = await page.goto("/admin/library");
  expect(response?.status()).toBe(NOT_FOUND);

  const visitor = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const anonymous = await visitor.newPage();
  await anonymous.goto("/library");
  await expect(anonymous).toHaveURL(SIGN_IN);
  await visitor.close();
});

test("the librarian adds a member's book, members find it, and a withdraw hides it", async ({
  browser,
  page,
}) => {
  const suffix = uniqueSuffix();
  const title = `Mere Christianity ${suffix}`;
  const lender = `Lender ${suffix}`;
  await insertProfiledUser(lender, "member");

  await adminLogin(page);
  await page.goto("/admin/library");
  await page.getByRole("button", { name: "Add book" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Author").fill("C. S. Lewis");
  await selectOption(page, "Language", "Deutsch");
  await dialog.getByRole("radio", { name: "A member" }).click();
  await dialog.getByPlaceholder("Search members…").fill(lender);
  await dialog.getByRole("option", { name: lender }).click();
  await dialog.getByRole("button", { name: "Add book" }).click();
  await expect(toast(page, `“${title}” added`)).toBeVisible();

  // A member on the Library tab types part of the title.
  const memberContext = await browser.newContext({
    storageState: MEMBER_STORAGE_STATE,
  });
  const member = await memberContext.newPage();
  await member.goto("/schedule");
  await member.getByRole("link", { name: "Library" }).click();
  await expect(member).toHaveURL("/library");
  await member
    .getByRole("searchbox", { name: "Search books" })
    .fill(`mere ${suffix}`);
  const card = member
    .getByRole("listitem")
    .filter({ has: member.getByRole("heading", { name: title }) });
  await expect(card).toContainText("Available");
  await expect(card).toContainText("Deutsch");
  await expect(card).not.toContainText(lender);

  await page.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  const row = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: title }) });
  await expect(row).toContainText(`Lent by ${lender}`);
  await row.getByRole("button", { name: "Remove from library" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remove from library" })
    .click();
  await expect(
    toast(page, `“${title}” removed from the library`)
  ).toBeVisible();
  await expect(row).toHaveCount(0);

  await member.reload();
  await expect(member.getByText("No books match")).toBeVisible();
  await memberContext.close();

  await page.getByLabel("Show", { exact: true }).click();
  await page
    .getByRole("option", { exact: true, name: "Removed from library" })
    .click();
  await row.getByRole("button", { name: `History of ${title}` }).click();
  const history = page.getByRole("list", { name: "History" });
  await expect(history.getByRole("listitem").first()).toContainText(
    "Removed from the library"
  );
  await expect(history.getByRole("listitem").last()).toContainText(
    "Added to the library"
  );
  await expect(history.getByRole("listitem").last()).toContainText(
    `lent by ${lender}`
  );
});
