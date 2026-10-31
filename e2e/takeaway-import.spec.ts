import { expect, type Page, test } from "@playwright/test";
import { deleteSchedulesBetween, insertSchedule } from "./db";
import { E2E_DOCS } from "./docs-server";
import { uniqueSuffix } from "./fixtures";
import { adminLogin, toast } from "./helpers";

// The stand-in documents are dated 2031, which only this spec schedules.
const TWO_NEW = /2 new/;
const TWO_UP_TO_DATE = /2 already up to date/;
const MONTH_TWO_NEW = /This month: 2 new/;
const YEAR = { before: new Date("2032-01-01"), from: new Date("2031-01-01") };

const docLink = (docId: string) =>
  `https://docs.google.com/document/d/${docId}/edit`;

const addSource = async (
  page: Page,
  label: string,
  docs: { notes: string; tldr?: string }
) => {
  await page.getByRole("button", { name: "Add source" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a source" });
  await dialog.getByLabel("Name").fill(label);
  await dialog.getByLabel("Notes document").fill(docLink(docs.notes));
  if (docs.tldr) {
    await dialog.getByLabel("TL;DR document").fill(docLink(docs.tldr));
  }
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(toast(page, `“${label}” saved`)).toBeVisible();
};

const openImport = async (page: Page) => {
  await page.goto("/admin/takeaways/new");
  await page.getByRole("tab", { name: "Import from Docs" }).click();
};

test("staff import takeaways from a chosen source, and a second run changes nothing", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const withTldr = `Docs ${suffix}`;
  const notesOnly = `Notes only ${suffix}`;
  await deleteSchedulesBetween(YEAR.from, YEAR.before);
  await insertSchedule("Import Kebaktian", new Date("2031-01-03T14:30:00Z"));
  await insertSchedule("Import PA", new Date("2031-01-10T14:30:00Z"));
  await adminLogin(page);

  await page.goto("/admin/settings/takeaways");
  await addSource(page, withTldr, E2E_DOCS);
  await addSource(page, notesOnly, { notes: E2E_DOCS.notes });
  await expect(
    page.getByRole("button", { name: `Edit the source ${notesOnly}` })
  ).toBeVisible();

  await openImport(page);
  const source = page.getByLabel("Source");
  await source.click();
  await page.getByRole("option", { name: withTldr }).click();
  await expect(page.getByRole("status").getByText(TWO_NEW)).toBeVisible();
  await expect(page.getByText("No gathering on this date")).toBeVisible();
  await page.getByRole("radio", { name: "Calendar" }).click();
  await expect(page.getByText(MONTH_TWO_NEW)).toBeVisible();

  await page.getByRole("button", { name: "Import 2 takeaways" }).click();
  await expect(toast(page, "Takeaways imported")).toBeVisible();
  await expect(page).toHaveURL("/admin/takeaways");

  // The picker starts on the source used last, not the newest one.
  await openImport(page);
  await expect(source).toHaveText(withTldr);
  await expect(
    page.getByRole("button", { name: "Everything is up to date" })
  ).toBeDisabled();
  await expect(
    page.getByRole("status").getByText(TWO_UP_TO_DATE)
  ).toBeVisible();
});
