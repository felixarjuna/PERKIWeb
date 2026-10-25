import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  groupTerms,
  servingPool,
  settings,
  users,
} from "~/lib/db/schema/schema";
import { parsePoolSheet } from "~/lib/serving-pool-sheet";
import { SETTING_KEYS } from "~/lib/settings";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";
import { POOL_SHEET_2026 } from "~/test/fixtures/serving-pool-sheet";

const google = vi.hoisted(() => ({ values: [] as string[][] }));
vi.mock("~/server/google-sheets", () => ({
  sheetTabs: vi.fn(async () => [
    "2026",
    "List Pelayan 2025",
    "List Pelayan 2026",
  ]),
  sheetValues: vi.fn(async () => google.values),
}));

/** Every name on the tab, each with an account of that name except Wes. */
const NAMES = [
  "Ana",
  "Ben",
  "Cia",
  "Dan",
  "Eli",
  "Fay",
  "Gus",
  "Hal",
  "Ivy",
  "Jon",
  "Kim",
  "Lou",
  "Mia",
  "Ned",
  "Ola",
  "Pia",
  "Quin",
  "Ray",
  "Sam",
  "Tia",
  "Uma",
  "Val",
];
const TAB = { tab: "List Pelayan 2026" };
const SHEET_ENTRIES = parsePoolSheet(POOL_SHEET_2026).entries.length;

const admin = async () =>
  callerFor((await insertUser({ name: "Mita Staff", role: "mita" })).id);

async function poolOf(name: string) {
  const [user] = (await testDb.select().from(users)).filter(
    (row) => row.name === name
  );
  return (await testDb.select().from(servingPool))
    .filter((entry) => entry.userId === user?.id)
    .map(({ pausedUntil, pauseNote, role, scope, status }) => ({
      pausedUntil,
      pauseNote,
      role,
      scope,
      status,
    }))
    .sort((a, b) => a.role.localeCompare(b.role));
}

describe("servingPoolImport", () => {
  beforeEach(async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-25T12:00:00Z"),
      toFake: ["Date"],
    });
    google.values = POOL_SHEET_2026;
    await testDb
      .insert(settings)
      .values({ key: SETTING_KEYS.scheduleSheetId, value: "sheet-id" });
    await testDb
      .insert(groupTerms)
      .values([{ startsOn: "2026-04-01" }, { startsOn: "2027-04-01" }]);
    for (const name of NAMES) {
      // biome-ignore lint/performance/noAwaitInLoops: distinct rows, set up once.
      await insertUser({ name });
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is for staff only", async () => {
    const member = callerFor((await insertUser({ name: "Member" })).id);
    await expect(
      anonymousCaller().servingPoolImport.preview(TAB)
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(member.servingPoolImport.run(TAB)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(member.servingPoolImport.status()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("lists the pool tabs, newest first", async () => {
    expect(await (await admin()).servingPoolImport.status()).toEqual({
      configured: true,
      tabs: ["List Pelayan 2026", "List Pelayan 2025"],
    });
  });

  it("fills the pool with roles, scopes and statuses, and a second import changes nothing", async () => {
    const api = await admin();
    const wes = await insertUser({ name: "Wes Hart" });

    const preview = await api.servingPoolImport.preview(TAB);
    expect(preview.asOf).toBe("2026-09-23");
    expect(preview.added).toHaveLength(SHEET_ENTRIES - 1);
    expect(preview.unmatched).toEqual([
      {
        name: "Wes",
        roles: ["musician"],
        rows: [15],
        suggestion: { id: wes.id, image: null, name: "Wes Hart" },
      },
    ]);
    expect(await testDb.select().from(servingPool)).toEqual([]);

    expect(await api.servingPoolImport.run(TAB)).toEqual({
      added: SHEET_ENTRIES - 1,
      updated: 0,
    });
    expect(await poolOf("Ana")).toMatchObject([
      { role: "leader", scope: "bible_study", status: "active" },
      { role: "liturgist", scope: "church_service", status: "active" },
      { role: "musician", scope: "both", status: "active" },
    ]);
    expect(await poolOf("Val")).toMatchObject([
      { role: "leader", scope: "bible_study" },
    ]);
    expect(await poolOf("Ben")).toEqual([
      {
        pausedUntil: null,
        pauseNote: null,
        role: "multimedia",
        scope: "church_service",
        status: "active",
      },
      {
        // Paused until the next group term starts.
        pausedUntil: "2027-03-31",
        pauseNote: "stop dlu",
        role: "musician",
        scope: "both",
        status: "active",
      },
    ]);
    expect(await poolOf("Pia")).toMatchObject([
      { pausedUntil: "2027-03-31", pauseNote: "pause", role: "leader" },
      { pauseNote: "pause", role: "liturgist" },
      { pausedUntil: null, role: "multimedia", status: "backup" },
    ]);
    expect(await poolOf("Mia")).toMatchObject([
      { role: "leader" },
      { role: "liturgist" },
      { role: "musician", scope: "church_service" },
      { role: "publication" },
    ]);

    const again = await api.servingPoolImport.preview(TAB);
    expect(again.added).toEqual([]);
    expect(again.changed).toEqual([]);
    expect(again.unchanged).toBe(SHEET_ENTRIES - 1);
    expect(await api.servingPoolImport.run(TAB)).toEqual({
      added: 0,
      updated: 0,
    });
  });

  it("imports an unknown name once it's linked in the preview", async () => {
    const api = await admin();
    const wes = await insertUser({ name: "Wesley Hartono" });
    await api.servingPoolImport.run(TAB);

    await api.people.link({ name: "Wes", userId: wes.id });
    const preview = await api.servingPoolImport.preview(TAB);
    expect(preview.unmatched).toEqual([]);
    expect(preview.added).toMatchObject([
      {
        name: "Wes",
        role: "musician",
        scope: "bible_study",
        user: { id: wes.id, name: "Wesley Hartono" },
      },
    ]);
    await api.servingPoolImport.run(TAB);
    expect(await poolOf("Wesley Hartono")).toMatchObject([
      { role: "musician", scope: "bible_study", status: "active" },
    ]);
  });

  it("updates changed entries and leaves people the tab doesn't list", async () => {
    const api = await admin();
    const zoe = await insertUser({ name: "Zoe" });
    const kim = (await testDb.select().from(users)).find(
      (user) => user.name === "Kim"
    );
    await testDb.insert(servingPool).values([
      { role: "musician", scope: "both", status: "active", userId: zoe.id },
      {
        role: "publication",
        scope: "both",
        status: "active",
        userId: kim?.id ?? "",
      },
    ]);

    const preview = await api.servingPoolImport.preview(TAB);
    expect(preview.changed).toMatchObject([
      {
        changes: [{ field: "status", from: "active", to: "backup" }],
        name: "Kim",
        role: "publication",
      },
    ]);
    expect(preview.notInSheet).toMatchObject([
      { role: "musician", user: { id: zoe.id, name: "Zoe" } },
    ]);

    expect(await api.servingPoolImport.run(TAB)).toMatchObject({ updated: 1 });
    expect(await poolOf("Kim")).toContainEqual(
      expect.objectContaining({ role: "publication", status: "backup" })
    );
    expect(await poolOf("Zoe")).toHaveLength(1);
  });
});
