import { expect, test } from "@playwright/test";
import { SETTING_KEYS } from "~/lib/settings";
import { deleteUsersNamed, insertProfiledUser, saveSetting } from "./db";
import { E2E_POOL_PREFIX, E2E_SHEET } from "./docs-server";
import { adminLogin, toast } from "./helpers";

const NEW_ENTRIES = /^Import \d+ entries$/;
const ANA = `${E2E_POOL_PREFIX} Ana`;
const WES = `${E2E_POOL_PREFIX} Wes`;
const WESLEY = `${E2E_POOL_PREFIX} Wesley`;

// The stand-in pool tab prefixes every name, so only this spec's accounts match.
test("staff import the serving pool from the sheet, linking an unknown name first", async ({
  page,
}) => {
  await deleteUsersNamed(E2E_POOL_PREFIX);
  await saveSetting(SETTING_KEYS.scheduleSheetId, E2E_SHEET);
  await insertProfiledUser(ANA, "member");
  await insertProfiledUser(`${E2E_POOL_PREFIX} Kim`, "member");
  await insertProfiledUser(WESLEY, "member");

  await adminLogin(page);
  await page.goto("/admin/serving");
  await page.getByRole("link", { name: "Import from sheet" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Sheet as of 23 Sep 2026" })
  ).toBeVisible();

  const unmatched = page
    .getByRole("region", { name: "Without an account" })
    .getByRole("listitem")
    .filter({ hasText: WES });
  await unmatched.getByRole("button", { name: `Link to ${WESLEY}` }).click();
  await expect(toast(page, `Linked “${WES}”`)).toBeVisible();

  const added = page.getByRole("region", { name: "New" });
  await expect(added.getByText(WESLEY)).toBeVisible();
  await expect(added.getByText(`Written as “${WES}”`)).toBeVisible();

  await page.getByRole("button", { name: NEW_ENTRIES }).click();
  await expect(toast(page, "Serving teams imported")).toBeVisible();
  await expect(page).toHaveURL("/admin/serving");

  await page.getByLabel("Search the serving teams").fill(ANA);
  const table = page.getByRole("table", { name: "Serving teams" });
  // Ana leads both (two entries) and plays music: a header and three rows.
  await expect(table.getByRole("row")).toHaveCount(4);

  await page.goto("/admin/serving/import");
  await expect(
    page.getByRole("button", { name: "Everything is up to date" })
  ).toBeDisabled();
});
