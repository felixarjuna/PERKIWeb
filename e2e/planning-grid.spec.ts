import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import {
  insertGroupWith,
  insertPoolEntry,
  insertProfiledUser,
  insertSchedule,
} from "./db";
import { uniqueSuffix } from "./fixtures";
import { adminLogin, toast } from "./helpers";

const PLAN_MONTHS = /Plan months/;

/** A month of its own far ahead, so other specs' gatherings stay out of it. */
const ownMonth = () => {
  const year = 2060 + Math.floor(Math.random() * 30);
  const month = 1 + Math.floor(Math.random() * 12);
  return { month, year };
};

test("mita fill a month in the planning grid and see the warnings", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const { month, year } = ownMonth();
  const key = `${year}-${String(month).padStart(2, "0")}`;
  // How the grid names the day, e.g. "6 Nov".
  const monthName = DateTime.fromObject({ month }).toFormat("LLL");
  const group = `Plan G ${suffix.slice(-4)}`;
  const title = `Plan service ${suffix}`;
  const liturgist = await insertProfiledUser(`Plan Lia ${suffix}`, "member");
  const musician = await insertProfiledUser(`Plan Budi ${suffix}`, "member");
  // 15:30 in Aachen on the 6th; any month is within an hour of UTC+1/+2.
  const date = new Date(Date.UTC(year, month - 1, 6, 14, 0));
  const id = await insertSchedule(title, date, {
    cleaningGroup: "-",
    cookingGroup: group,
    leader: "-",
    musician: "-",
    noteWriter: "-",
    type: "church_service",
  });
  await insertPoolEntry(liturgist.id, "liturgist", {
    scope: "church_service",
  });
  await insertPoolEntry(musician.id, "musician", {
    pausedUntil: `${year + 1}-01-01`,
  });
  // The liturgist's group cooks that day.
  await insertGroupWith(group, liturgist, `${key}-06`);

  await adminLogin(page);
  // Planning starts from "Add schedule".
  await page.goto("/admin/schedules");
  await page.getByRole("button", { name: "Add schedule" }).click();
  await page.getByRole("menuitem", { name: PLAN_MONTHS }).click();
  await expect(page).toHaveURL("/admin/schedules/plan");
  await expect(
    page.getByRole("heading", { level: 1, name: "Plan months" })
  ).toBeVisible();
  await page.goto(`/admin/schedules/plan?from=${key}&months=3`);
  // The first read of a month can be slow while other specs run.
  await expect(page.getByRole("link", { name: title })).toBeVisible({
    timeout: 15_000,
  });

  // The picker offers the pool with this term's count and the warning ahead.
  await page
    .getByRole("button", { name: `Liturgist on 6 ${monthName}: open` })
    .click();
  const lia = page.getByRole("option", { name: new RegExp(liturgist.name) });
  await expect(lia).toContainText("0×");
  await expect(lia).toContainText("Their group cooks this day.");
  await lia.click();
  // A warning is advice: the choice is saved and the warning stays beside it.
  await expect(
    page.getByRole("button", {
      name: `Liturgist on 6 ${monthName}: ${liturgist.name}, 1 warning`,
    })
  ).toBeVisible();

  await page
    .getByRole("button", { name: `Musician on 6 ${monthName}: open` })
    .click();
  await page.getByRole("option", { name: new RegExp(musician.name) }).click();
  await expect(
    page.getByRole("button", {
      name: `Musician on 6 ${monthName}: ${musician.name}, 1 warning`,
    })
  ).toBeVisible();
  // The table and the phone cards both exist; only one is shown.
  await expect(
    page
      .getByRole("main")
      .getByText("Paused until 1 Jan.")
      .filter({ visible: true })
  ).toBeVisible();

  // A name that isn't in the pool can be typed in.
  await page
    .getByRole("button", { name: `Note writer on 6 ${monthName}: open` })
    .click();
  await page.getByPlaceholder("Search or type a name…").fill("Guest Writer");
  await page.getByRole("option", { name: "Use “Guest Writer”" }).click();
  await expect(
    page.getByRole("button", {
      name: `Note writer on 6 ${monthName}: Guest Writer`,
    })
  ).toBeVisible();

  // The first Saturday of the next month isn't added yet: its first slot adds it.
  const next = DateTime.fromObject({ day: 1, month, year }).plus({
    months: 1,
  });
  const saturday = next.plus({ days: (6 - next.weekday + 7) % 7 });
  const nextDay = saturday.toFormat("d LLL");
  await page
    .getByRole("button", { name: `Note writer on ${nextDay}: open` })
    .click();
  await page.getByPlaceholder("Search or type a name…").fill("New Writer");
  await page.getByRole("option", { name: "Use “New Writer”" }).click();
  await expect(
    toast(
      page,
      `Added Penelaahan Alkitab on ${saturday.toFormat("ccc d LLL")}.`
    )
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Note writer on ${nextDay}: New Writer` })
  ).toBeVisible();

  // The public schedule shows the names.
  await page.goto(`/schedule/${id}`);
  await expect(page.getByRole("main")).toContainText(liturgist.name);
  await expect(page.getByRole("main")).toContainText(musician.name);
  await expect(page.getByRole("main")).toContainText("Guest Writer");
});
