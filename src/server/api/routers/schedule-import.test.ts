import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  scheduleAssignments,
  schedules,
  settings,
} from "~/lib/db/schema/schema";
import { SETTING_KEYS } from "~/lib/settings";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";
import { SHEET_2026 } from "~/test/fixtures/schedule-sheet";

const google = vi.hoisted(() => ({ values: [] as string[][] }));
vi.mock("~/server/google-sheets", () => ({
  sheetTabs: vi.fn(async () => ["List Pelayan 2026", "2025", "2026"]),
  sheetValues: vi.fn(async () => google.values),
}));

const admin = async () => callerFor((await insertUser({ role: "mita" })).id);

describe("schedule import router", () => {
  beforeEach(async () => {
    google.values = SHEET_2026;
    await testDb
      .insert(settings)
      .values({ key: SETTING_KEYS.scheduleSheetId, value: "sheet-id" });
  });

  it("lists only the year tabs, newest first", async () => {
    expect(await (await admin()).scheduleImport.status()).toEqual({
      configured: true,
      tabs: ["2026", "2025"],
    });
  });

  it("reports when the sheet isn't set up", async () => {
    await testDb.delete(settings);
    const api = await admin();
    expect(await api.scheduleImport.status()).toEqual({
      configured: false,
      tabs: [],
    });
    await expect(
      api.scheduleImport.preview({ tab: "2026" })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("previews without writing, then imports new dates with their team", async () => {
    const api = await admin();

    const preview = await api.scheduleImport.preview({ tab: "2026" });
    expect(preview.entries.map((entry) => [entry.day, entry.status])).toEqual([
      ["2026-01-03", "new"],
      ["2026-01-10", "new"],
      ["2026-12-31", "new"],
    ]);
    expect(preview.skipped).toHaveLength(1);
    expect(preview.entries[2]?.schedule.cancelled).toBe(true);
    // The team as it will appear on the schedule: role, name and photo.
    expect(preview.entries[1]?.team).toContainEqual({
      image: null,
      name: "Dan",
      role: "liturgist",
    });
    expect(await testDb.select().from(schedules)).toEqual([]);

    expect(await api.scheduleImport.run({ tab: "2026" })).toEqual({
      added: 3,
      updated: 0,
    });
    const service = (await testDb.select().from(schedules)).find(
      (schedule) => schedule.type === "church_service"
    );
    expect(service).toMatchObject({
      accommodation: "Gus",
      bibleVerse: "Habakuk 2",
      cancelled: false,
      cookingGroup: "Group 1",
      flags: ["communion"],
      preacher: "Pdt. Guest",
      title: "Kebaktian",
    });
    const cancelled = (await testDb.select().from(schedules)).find(
      (schedule) => schedule.cancelled
    );
    expect(cancelled).toMatchObject({ leader: "", musician: "" });
    expect(
      (await testDb.select().from(scheduleAssignments)).map((a) => a.role)
    ).toContain("liturgist");
  });

  it("changes nothing when the same tab is imported again", async () => {
    const api = await admin();
    await api.scheduleImport.run({ tab: "2026" });

    expect(await api.scheduleImport.run({ tab: "2026" })).toEqual({
      added: 0,
      updated: 0,
    });
    expect(await testDb.select().from(schedules)).toHaveLength(3);
  });

  it("updates changed slots but keeps a title edited on the site", async () => {
    const api = await admin();
    await api.scheduleImport.run({ tab: "2026" });
    const study = (await testDb.select().from(schedules)).find(
      (schedule) => schedule.type === "bible_study"
    );
    await api.schedules.updateSchedule({
      bibleVerse: "Psalm 1",
      cleaningGroup: "Group 3",
      date: study?.date ?? new Date(),
      description: "Edited on the site",
      id: study?.id ?? 0,
      leader: "Ana",
      musician: "Ben",
      noteWriter: "Cleo",
      title: "Renamed on the site",
      type: "bible_study",
    });
    google.values = SHEET_2026.map((cells) =>
      cells[0] === "3.1.2026" ? cells.with(5, "Zoe") : cells
    );

    const preview = await api.scheduleImport.preview({ tab: "2026" });
    expect(preview.entries[0]).toMatchObject({
      changes: [{ field: "musician", from: "Ben", to: "Zoe" }],
      status: "changed",
    });
    expect(await api.scheduleImport.run({ tab: "2026" })).toEqual({
      added: 0,
      updated: 1,
    });
    const updated = (await testDb.select().from(schedules)).find(
      (schedule) => schedule.id === study?.id
    );
    expect(updated).toMatchObject({
      bibleVerse: "Psalm 1",
      musician: "Zoe",
      title: "Renamed on the site",
    });
  });

  it('cancels a gathering whose row is all "-", keeping its team', async () => {
    const api = await admin();
    await api.scheduleImport.run({ tab: "2026" });
    google.values = SHEET_2026.map((cells) =>
      cells[0] === "3.1.2026"
        ? cells.map((cell, column) =>
            column >= 2 && column <= 10 ? "-" : cell
          )
        : cells
    );

    expect(await api.scheduleImport.run({ tab: "2026" })).toEqual({
      added: 0,
      updated: 1,
    });
    const study = (await testDb.select().from(schedules)).find(
      (schedule) => schedule.title === "Penelaahan Alkitab" && schedule.leader
    );
    expect(study).toMatchObject({ cancelled: true, leader: "Ana" });
    expect(
      (await testDb.select().from(scheduleAssignments)).some(
        (a) => a.scheduleId === study?.id
      )
    ).toBe(true);
  });

  it("moves a schedule stored at 00:00 to the default 15:30", async () => {
    const api = await admin();
    await testDb.insert(schedules).values({
      bibleVerse: "",
      cleaningGroup: "Group 3",
      date: new Date("2026-01-02T23:00:00.000Z"),
      description: "",
      leader: "Ana",
      musician: "Ben",
      noteWriter: "Cleo",
      title: "Penelaahan Alkitab",
      type: "bible_study",
    });

    const preview = await api.scheduleImport.preview({ tab: "2026" });
    expect(preview.entries[0]?.changes).toContainEqual({
      field: "time",
      from: "00:00",
      to: "15:30",
    });
    await api.scheduleImport.run({ tab: "2026" });

    const study = (await testDb.select().from(schedules)).find(
      (schedule) => schedule.type === "bible_study"
    );
    expect(study?.date).toEqual(new Date("2026-01-03T14:30:00.000Z"));
  });

  it("is admin-only", async () => {
    const member = callerFor((await insertUser()).id);
    await expect(member.scheduleImport.status()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      anonymousCaller().scheduleImport.run({ tab: "2026" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
