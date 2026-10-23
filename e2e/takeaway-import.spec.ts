import { expect, type Page, test } from "@playwright/test";
import { deleteSchedulesBetween, insertSchedule } from "./db";
import { E2E_DOCS } from "./docs-server";
import { adminLogin, toast } from "./helpers";

// The stand-in documents are dated 2031, which only this spec schedules.
const TWO_NEW = /2 new/;
const TWO_UP_TO_DATE = /2 already up to date/;
const YEAR = { before: new Date("2032-01-01"), from: new Date("2031-01-01") };

const saveDoc = async (page: Page, title: string, docId: string) => {
  await page.getByRole("button", { name: `Change the ${title}` }).click();
  const dialog = page.getByRole("dialog", { name: title });
  await dialog
    .getByLabel("Link")
    .fill(`https://docs.google.com/document/d/${docId}/edit`);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(toast(page, `${title} saved`)).toBeVisible();
};

test("staff import takeaways from the Docs, and a second run changes nothing", async ({
  page,
}) => {
  await deleteSchedulesBetween(YEAR.from, YEAR.before);
  await insertSchedule("Import Kebaktian", new Date("2031-01-03T14:30:00Z"));
  await insertSchedule("Import PA", new Date("2031-01-10T14:30:00Z"));
  await adminLogin(page);

  await page.goto("/admin/settings/integrations");
  await saveDoc(page, "Takeaway notes document", E2E_DOCS.notes);
  await saveDoc(page, "TL;DR document", E2E_DOCS.tldr);

  await page.goto("/admin/takeaways/new");
  await page.getByRole("tab", { name: "Import from Docs" }).click();
  await expect(page.getByRole("status").getByText(TWO_NEW)).toBeVisible();
  await expect(page.getByText("No gathering on this date")).toBeVisible();

  await page.getByRole("button", { name: "Import 2 takeaways" }).click();
  await expect(toast(page, "Takeaways imported")).toBeVisible();
  await expect(page).toHaveURL("/admin/takeaways");

  await page.goto("/admin/takeaways/new");
  await page.getByRole("tab", { name: "Import from Docs" }).click();
  await expect(
    page.getByRole("button", { name: "Everything is up to date" })
  ).toBeDisabled();
  await expect(
    page.getByRole("status").getByText(TWO_UP_TO_DATE)
  ).toBeVisible();
});
