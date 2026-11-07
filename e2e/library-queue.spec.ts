import { type Browser, expect, type Page, test } from "@playwright/test";
import { dayLabel, dueOnFrom, holdEndsOn } from "~/lib/library";
import { localDay } from "~/lib/schedule-team";
import { insertLibraryBook } from "./db";
import { uniqueSuffix } from "./fixtures";
import { adminLogin, createSignedInUser, toast } from "./helpers";

test.use({ viewport: { height: 844, width: 390 } });

const search = async (page: Page, text: string) => {
  await page.goto("/library");
  await page.getByRole("searchbox", { name: "Search books" }).fill(text);
};

const cardOf = (page: Page, title: string) =>
  page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { exact: true, name: title }) })
    .last();

const borrow = async (page: Page, title: string) => {
  await page.getByRole("button", { name: `Borrow ${title}` }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Borrow" })
    .click();
  await expect(toast(page, "Borrowed.")).toBeVisible();
};

const newMember = async (browser: Browser, label: string) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const user = await createSignedInUser(page, label);
  return { context, page, user };
};

test("a member queues for a borrowed book and borrows it once the librarian has it back", async ({
  browser,
  page,
}) => {
  const suffix = uniqueSuffix();
  const title = `Life Together ${suffix}`;
  await insertLibraryBook(title, "Dietrich Bonhoeffer");
  const today = localDay(new Date());

  // A borrows the book.
  await createSignedInUser(page, "Holder");
  await search(page, suffix);
  await borrow(page, title);

  // B joins the queue and sees their place.
  const waiting = await newMember(browser, "Waiting");
  await search(waiting.page, suffix);
  const card = cardOf(waiting.page, title);
  await card
    .getByRole("button", { name: `Join the queue for ${title}` })
    .click();
  await expect(toast(waiting.page, "You're 1st in line")).toBeVisible();
  await expect(card).toContainText("1st in line");

  // A can't extend while B waits, and sees why.
  await page.reload();
  const held = page
    .getByRole("region", { name: "My books" })
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: title }) });
  await expect(
    held.getByRole("button", { name: `Extend ${title}` })
  ).toBeDisabled();
  await expect(held).toContainText("Someone is waiting for this book.");

  // The librarian marks it returned: B's 7 days start today.
  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await adminLogin(staff);
  await staff.goto("/admin/library?state=borrowed");
  await staff.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  const row = staff
    .getByRole("listitem")
    .filter({ has: staff.getByRole("heading", { name: title }) });
  await expect(row).toContainText("1 waiting");
  await row.getByRole("button", { name: `Mark ${title} returned` }).click();
  await staff
    .getByRole("alertdialog")
    .getByRole("button", { name: "Mark returned" })
    .click();
  await expect(toast(staff, `“${title}” is back on the shelf`)).toBeVisible();
  await staff.goto("/admin/library?state=reserved");
  await staff.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  await expect(row).toContainText(
    `Held for ${waiting.user.name} until ${dayLabel(holdEndsOn(today))}`
  );

  // B sees it's theirs and borrows it; A can't.
  await search(waiting.page, suffix);
  await expect(card).toContainText(
    `Reserved for you · until ${dayLabel(holdEndsOn(today))}`
  );
  await search(page, suffix);
  await expect(
    page.getByRole("button", { name: `Borrow ${title}` })
  ).toHaveCount(0);
  await borrow(waiting.page, title);
  await expect(
    waiting.page.getByRole("region", { name: "My books" })
  ).toContainText(`Due ${dayLabel(dueOnFrom(today))}`);

  // The history shows both loans and the queue's turn.
  await staff.goto("/admin/library");
  await staff.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  await row.getByRole("button", { name: `History of ${title}` }).click();
  const history = staff.getByRole("list", { name: "History" });
  await expect(history).toContainText("Reservation collected");
  await expect(history).toContainText("Reserved for the next in line");
  await expect(history).toContainText("Joined the queue");
  await expect(history.getByText("Borrowed", { exact: true })).toHaveCount(2);
  await staffContext.close();
  await waiting.context.close();
});

test("a member offers their own book, the librarian accepts it, and the lender sees who has it", async ({
  browser,
  page,
}) => {
  const suffix = uniqueSuffix();
  const title = `Nachfolge ${suffix}`;
  const today = localDay(new Date());

  // C offers a book.
  await createSignedInUser(page, "Lender");
  await page.goto("/library");
  await page.getByRole("button", { name: "Offer a book" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Author").fill("Dietrich Bonhoeffer");
  await dialog.getByLabel("Language").fill("German");
  await dialog.getByRole("button", { name: "Offer book" }).click();
  await expect(toast(page, "Thanks!")).toBeVisible();
  await search(page, suffix);
  const card = cardOf(page, title);
  await expect(card).toContainText("Offered");
  await expect(card).toContainText(
    "Hand it to the librarian; it appears once accepted."
  );

  // The librarian accepts it once it's in hand.
  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await adminLogin(staff);
  await staff.goto("/admin/library?state=offered");
  await staff.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  await staff.getByRole("button", { name: `Accept ${title}` }).click();
  await expect(toast(staff, "On the shelf and available")).toBeVisible();
  await staffContext.close();

  // Someone borrows it.
  const reader = await newMember(browser, "Reader");
  await search(reader.page, suffix);
  await borrow(reader.page, title);
  await reader.context.close();

  // C sees who has it and until when.
  await page.goto("/library");
  const lent = page.getByRole("region", { name: "Books you lend" });
  const mine = lent
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: title }) });
  await expect(mine).toContainText(
    `With ${reader.user.name} until ${dayLabel(dueOnFrom(today))}`
  );
  await expect(mine).toContainText("Lent 1 time");
});
