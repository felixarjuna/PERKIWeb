import { expect, type Page, test } from "@playwright/test";
import { SETTING_KEYS } from "~/lib/settings";
import { LIBRARY_SHEET } from "~/test/fixtures/library-sheet";
import {
  deleteLibraryBooksTitled,
  deleteSetting,
  deleteUsersNamed,
  insertProfiledUser,
} from "./db";
import { E2E_LIBRARY_PREFIX, E2E_LIBRARY_SHEET } from "./docs-server";
import { adminLogin, toast } from "./helpers";

const IMPORT_BOOKS = /^Import \d+ books and \d+ loans$/;
const BORROWED_UNTIL = /^Borrowed until/;
const person = (name: string) => `${E2E_LIBRARY_PREFIX} ${name}`;
const WREN = person("Wren");
const WREN_ACCOUNT = person("Wren Lestari");
/** Every title on the stand-in book list, so a retry starts clean. */
const TITLES = [
  ...new Set(LIBRARY_SHEET.slice(1).flatMap((row) => row[1] ?? [])),
];

const search = async (page: Page, text: string) => {
  await page.getByRole("searchbox", { name: "Search books" }).fill(text);
  return page.getByRole("article").filter({
    has: page.getByRole("heading", { name: text }),
  });
};

// The stand-in book list prefixes every person, so only this spec's accounts match.
test("staff import the library and its lending history, linking an owner first", async ({
  page,
}) => {
  await deleteLibraryBooksTitled(TITLES);
  await deleteUsersNamed(E2E_LIBRARY_PREFIX);
  await deleteSetting(SETTING_KEYS.librarySheetId);
  for (const name of ["Arlo", "Vito", "Kai", "Dara"]) {
    // biome-ignore lint/performance/noAwaitInLoops: a few accounts.
    await insertProfiledUser(person(name), "member");
  }
  await insertProfiledUser(WREN_ACCOUNT, "member");

  await adminLogin(page);
  await page.goto("/admin/library");
  await page.getByRole("link", { name: "Import from sheet" }).click();
  await page
    .getByLabel("Sheet")
    .fill(`https://docs.google.com/spreadsheets/d/${E2E_LIBRARY_SHEET}/edit`);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(toast(page, "Connected “E2E Library books”")).toBeVisible();

  await expect(
    page.getByRole("status").filter({ hasText: "13 copies in the sheet" })
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Skipped" }).getByRole("listitem")
  ).toHaveCount(2);
  const toLink = page.getByRole("region", { name: "Names to link" });
  await expect(toLink.getByText(person("Nadia"))).toBeVisible();
  await toLink
    .getByRole("listitem")
    .filter({ hasText: WREN })
    .getByRole("button", { name: `Choose the account for ${WREN}` })
    .click();
  await page.getByRole("option", { name: WREN_ACCOUNT }).click();
  await expect(toast(page, `Linked “${WREN}”`)).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Waiting for their owner" })
  ).toHaveCount(0);

  // The "Peminjaman" tab: Dara has had The Lantern Case since August.
  const history = page.getByRole("region", { name: "Lending history" });
  await expect(history.getByRole("listitem")).toHaveCount(8);
  await expect(
    history
      .getByRole("listitem")
      .filter({ hasText: "The Lantern Case" })
      .filter({ hasText: person("Dara") })
  ).toContainText("August – September 2026 · extended once");
  const toCheck = page.getByRole("region", { name: "Lending rows to check" });
  await expect(toCheck.getByText("Morning Psalms")).toBeVisible();
  await expect(
    toCheck.getByText("without an earlier lend", { exact: false })
  ).toBeVisible();

  await page.getByRole("button", { name: IMPORT_BOOKS }).click();
  await expect(toast(page, "Books imported")).toBeVisible();
  await expect(page).toHaveURL("/admin/library");

  await page.getByRole("searchbox", { name: "Search books" }).fill("Lantern");
  await page
    .getByRole("button", { name: "History of The Lantern Case" })
    .click();
  const lines = page.getByRole("list", { name: "History" });
  await expect(
    lines
      .getByRole("listitem")
      .filter({ hasText: "Borrowed" })
      .filter({ hasText: "August 2026" })
  ).toContainText(`to ${person("Dara")}`);
  await expect(
    lines.getByRole("listitem").filter({ hasText: "Returned" }).first()
  ).toContainText(`from ${person("Kai")}`);
  await page.keyboard.press("Escape");

  await page.goto("/library");
  const lantern = await search(page, "The Lantern Case");
  await expect(lantern).toContainText("English");
  await expect(lantern.getByText("Crossway")).toBeVisible();
  await expect(lantern.getByText("Apologetics")).toBeVisible();
  await expect(lantern.getByText(BORROWED_UNTIL)).toBeVisible();
  const walking = await search(page, "Walking Together");
  await expect(walking.getByText("Ebook · ask the librarian")).toBeVisible();
  await expect(walking.getByRole("button")).toHaveCount(0);
  const rooted = await search(page, "Rooted Hearts");
  await expect(rooted.getByText(`Ebook · ask ${WREN_ACCOUNT}`)).toHaveCount(2);

  await page.goto("/admin/library/import");
  await expect(
    page.getByRole("button", { name: "Everything is up to date" })
  ).toBeDisabled();
});
