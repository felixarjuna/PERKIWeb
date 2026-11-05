import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import { insertPoolEntry, insertProfiledUser } from "./db";
import { uniqueSuffix } from "./fixtures";
import { adminLogin, toast } from "./helpers";

const FILLED = /^Filled \d+ slots? as drafts\./;
const REGENERATE = /^Regenerate \d+ unlocked picks?$/;
const PUBLISH = /^Publish \d+ gatherings?$/;
const PUBLISHED = /^Published \d+ gatherings?\. Members see/;
const LOCK = /^Lock /;

/** A month of its own far ahead, so other specs' gatherings stay out of it. */
const ownMonth = () => {
  const year = 2060 + Math.floor(Math.random() * 30);
  const month = 1 + Math.floor(Math.random() * 12);
  return DateTime.fromObject({ month, year });
};

test("mita generate a month of drafts, lock a pick, regenerate and publish", async ({
  browser,
  page,
}) => {
  const suffix = uniqueSuffix();
  const month = ownMonth();
  const key = month.toFormat("yyyy-MM");
  const label = month.toFormat("LLLL yyyy");
  const writer = await insertProfiledUser(`Gen Nia ${suffix}`, "member");
  await insertPoolEntry(writer.id, "note_writer");

  await adminLogin(page);
  await page.goto(`/admin/schedules/plan?from=${key}&months=3`);
  const main = page.getByRole("main");
  await expect(main.getByText("not added yet").first()).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "Generate" }).click();
  const generate = page.getByRole("dialog", { name: "Generate drafts" });
  const short = month.toFormat("LLL yyyy");
  await expect(generate.getByLabel("From")).toContainText(short);
  await expect(generate.getByLabel("Through")).toContainText(short);
  await generate.getByRole("button", { name: "Fill open slots" }).click();
  await expect(toast(page, FILLED)).toBeVisible({ timeout: 15_000 });

  // Every Saturday of the month is a draft now, each pick with its reason.
  await expect(
    main.getByText("Draft", { exact: true }).filter({ visible: true }).first()
  ).toBeVisible();
  await expect(
    main.getByText("Generated:").filter({ visible: true }).first()
  ).toBeVisible();
  const draft = main
    .getByRole("link", { name: "Penelaahan Alkitab" })
    .filter({ visible: true })
    .first();
  const href = (await draft.getAttribute("href")) ?? "";
  const id = href.split("/").at(-2);

  // Lock one pick; regenerate keeps it.
  await main
    .getByRole("button", { name: LOCK })
    .filter({ visible: true })
    .first()
    .click();
  await expect(
    main.getByText("Locked.").filter({ visible: true }).first()
  ).toBeVisible();
  await page.getByRole("button", { name: "Generate" }).click();
  await generate.getByRole("button", { name: REGENERATE }).click();
  await expect(toast(page, FILLED)).toBeVisible({ timeout: 15_000 });
  await expect(
    main.getByText("Locked.").filter({ visible: true }).first()
  ).toBeVisible();

  // Visitors don't see a draft.
  const visitor = await browser.newContext();
  const visitorPage = await visitor.newPage();
  const response = await visitorPage.goto(`/schedule/${id}`);
  expect(response?.status()).toBe(404);

  // Publish the month after a confirmation.
  await page.getByRole("button", { name: "Publish range" }).click();
  const publish = page.getByRole("alertdialog", { name: "Publish drafts?" });
  await expect(publish).toContainText(`draft gatherings in ${label}.`);
  await publish.getByRole("button", { name: PUBLISH }).click();
  await expect(toast(page, PUBLISHED)).toBeVisible();
  await expect(
    main.getByText("Draft", { exact: true }).filter({ visible: true })
  ).toHaveCount(0);

  await visitorPage.goto(`/schedule/${id}`);
  await expect(visitorPage.getByRole("main")).toContainText(
    "Penelaahan Alkitab"
  );
  await visitor.close();
});
