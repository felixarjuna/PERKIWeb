import { expect, test } from "@playwright/test";
import {
  addDays,
  dayLabel,
  dueOnFrom,
  EXTEND_WINDOW_DAYS,
  extendedDueOn,
} from "~/lib/library";
import { localDay } from "~/lib/schedule-team";
import { insertLibraryBook, setOpenLoanDueOn } from "./db";
import { uniqueSuffix } from "./fixtures";
import { adminLogin, createSignedInUser, toast } from "./helpers";

test.use({ viewport: { height: 844, width: 390 } });

test("a member borrows and extends a book, others see only the due date, and the librarian takes it back", async ({
  browser,
  page,
}) => {
  const suffix = uniqueSuffix();
  const title = `The Four Loves ${suffix}`;
  const book = await insertLibraryBook(title, "C. S. Lewis");
  const today = localDay(new Date());
  const dueOn = dueOnFrom(today);

  // The first member, at the shelf with the book in hand.
  const holder = await createSignedInUser(page, "Holder");
  await page.goto("/library");
  await page.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  await page.getByRole("button", { name: `Borrow ${title}` }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText(`Borrow ${title}?`);
  await expect(confirm).toContainText(
    `You have it until ${dayLabel(dueOn)}, 30 days. You can extend twice from My books. Bring it back to the librarian.`
  );
  await confirm.getByRole("button", { name: "Borrow" }).click();
  await expect(toast(page, `Borrowed. Due ${dayLabel(dueOn)}`)).toBeVisible();
  const myBooks = page.getByRole("region", { name: "My books" });
  const held = myBooks
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: title }) });
  await expect(held).toContainText(`Due ${dayLabel(dueOn)}`);

  // Another member sees when it's back, never who has it.
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await createSignedInUser(other, "Other");
  await other.goto("/library");
  await other.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  const card = other
    .getByRole("listitem")
    .filter({ has: other.getByRole("heading", { name: title }) });
  await expect(card).toContainText(`Borrowed until ${dayLabel(dueOn)}`);
  await expect(card).not.toContainText(holder.name);
  await expect(
    card.getByRole("button", { name: `Borrow ${title}` })
  ).toHaveCount(0);
  await otherContext.close();

  // Extend stays off until the last 3 days before the due date.
  const extend = held.getByRole("button", { name: `Extend ${title}` });
  await expect(extend).toBeDisabled();
  await expect(held).toContainText(
    `You can extend from ${dayLabel(addDays(dueOn, -EXTEND_WINDOW_DAYS))}.`
  );

  // Two days before it's due, the member extends by 30 days.
  const soon = addDays(today, 2);
  await setOpenLoanDueOn(book.id, soon);
  await page.reload();
  await page.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  await expect(held).toContainText(`Due ${dayLabel(soon)}`);
  await expect(held).not.toContainText("You can extend from");
  const extended = extendedDueOn(soon);
  await extend.click();
  await expect(held).toContainText(`Due ${dayLabel(extended)}`);
  await expect(extend).toBeDisabled();
  await expect(held).toContainText(
    `You can extend from ${dayLabel(addDays(extended, -EXTEND_WINDOW_DAYS))}.`
  );

  // The librarian takes it back on the shelf.
  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await adminLogin(staff);
  await staff.goto("/admin/library?state=borrowed");
  await staff.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  const row = staff
    .getByRole("listitem")
    .filter({ has: staff.getByRole("heading", { name: title }) });
  await expect(row).toContainText(
    `Borrowed by ${holder.name} until ${dayLabel(extended)}`
  );
  await row.getByRole("button", { name: `Mark ${title} returned` }).click();
  await staff
    .getByRole("alertdialog")
    .getByRole("button", { name: "Mark returned" })
    .click();
  await expect(toast(staff, `“${title}” is back on the shelf`)).toBeVisible();

  await staff.goto("/admin/library");
  await staff.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  await expect(row).toContainText("Available");
  await row.getByRole("button", { name: `History of ${title}` }).click();
  const history = staff.getByRole("list", { name: "History" });
  await expect(history.getByRole("listitem").first()).toContainText("Returned");
  await expect(history.getByRole("listitem").first()).toContainText(
    `from ${holder.name}`
  );
  await expect(history).toContainText("Borrowed");
  await expect(history).toContainText(`by ${holder.name}`);
  await staffContext.close();

  // The book is free again, and the member's loan moved to past borrows.
  await page.reload();
  await page.getByRole("searchbox", { name: "Search books" }).fill(suffix);
  await expect(
    page.getByRole("button", { name: `Borrow ${title}` })
  ).toBeVisible();
  await expect(myBooks).toContainText("Past borrows (1)");
});
