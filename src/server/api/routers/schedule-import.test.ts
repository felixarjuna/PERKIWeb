import { beforeEach, describe, expect, it, vi } from "vitest";
import { scheduleAssignments, schedules } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";
import { SHEET_2026 } from "~/test/fixtures/schedule-sheet";

const google = vi.hoisted(() => ({
  sheetId: "sheet-id" as string | null,
  values: [] as string[][],
}));
vi.mock("~/server/google-sheets", () => ({
  scheduleSheetId: () => google.sheetId,
  sheetTabs: vi.fn(async () => ["List Pelayan 2026", "2025", "2026"]),
  sheetValues: vi.fn(async () => google.values),
}));

const admin = async () => callerFor((await insertUser({ role: "mita" })).id);

describe("schedule import router", () => {
  beforeEach(() => {
    google.sheetId = "sheet-id";
    google.values = SHEET_2026;
  });

  it("lists only the year tabs, newest first", async () => {
    expect(await (await admin()).scheduleImport.status()).toEqual({
      configured: true,
      tabs: ["2026", "2025"],
    });
  });

  it("reports when the sheet isn't set up", async () => {
    google.sheetId = null;
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
    ]);
    expect(preview.skipped).toHaveLength(2);
    expect(await testDb.select().from(schedules)).toEqual([]);

    expect(await api.scheduleImport.run({ tab: "2026" })).toEqual({
      added: 2,
      updated: 0,
    });
    const service = (await testDb.select().from(schedules)).find(
      (schedule) => schedule.type === "church_service"
    );
    expect(service).toMatchObject({
      accommodation: "Gus",
      bibleVerse: "Habakuk 2",
      cookingGroup: "Group 1",
      preacher: "Pdt. Guest",
      title: "Kebaktian",
    });
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
    expect(await testDb.select().from(schedules)).toHaveLength(2);
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
