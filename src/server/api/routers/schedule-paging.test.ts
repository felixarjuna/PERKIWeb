import { describe, expect, it } from "vitest";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const validSchedule = {
  bibleVerse: "Roma 4:1-12",
  cleaningGroup: "Group 4",
  date: new Date("2026-10-10T18:00:00.000Z"),
  description: "Weekly bible study",
  leader: "Leader",
  musician: "Musician",
  noteWriter: "Writer",
  title: "Heroes of Faith",
  type: "bible_study" as const,
};

type ListInput = Parameters<
  ReturnType<typeof anonymousCaller>["schedules"]["list"]
>[0];

/** Inserts schedules directly, so ids follow the order given. */
const insert = (rows: Partial<typeof schedules.$inferInsert>[]) =>
  testDb
    .insert(schedules)
    .values(rows.map((row) => ({ ...validSchedule, ...row })))
    .returning();

const day = (n: number) =>
  new Date(`2026-01-${String(n).padStart(2, "0")}T14:30:00Z`);

const titles = async (input: ListInput) =>
  (await anonymousCaller().schedules.list(input)).items.map((s) => s.title);

/** Follows `nextCursor` to the end, returning every title and the page count. */
const everyPage = async (input: ListInput) => {
  const seen: string[] = [];
  let cursor: { date: Date; id: number } | null = null;
  let pages = 0;
  do {
    // biome-ignore lint/performance/noAwaitInLoops: each page needs the previous cursor.
    const page = await anonymousCaller().schedules.list({ ...input, cursor });
    seen.push(...page.items.map((s) => s.title));
    cursor = page.nextCursor;
    pages += 1;
  } while (cursor);
  return { pages, titles: seen };
};

describe("schedule paging", () => {
  it("pages through every schedule once, in both directions", async () => {
    await insert(
      Array.from({ length: 7 }, (_, i) => ({
        date: day(i + 1),
        title: `S${i + 1}`,
      }))
    );

    expect(await everyPage({ limit: 3, order: "desc" })).toEqual({
      pages: 3,
      titles: ["S7", "S6", "S5", "S4", "S3", "S2", "S1"],
    });
    expect((await everyPage({ limit: 3, order: "asc" })).titles).toEqual([
      "S1",
      "S2",
      "S3",
      "S4",
      "S5",
      "S6",
      "S7",
    ]);
  });

  it("ends without a cursor when the last page is exactly full", async () => {
    await insert([{ date: day(1) }, { date: day(2) }]);

    const page = await anonymousCaller().schedules.list({ limit: 2 });

    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });

  it("never skips or repeats schedules on the same date", async () => {
    await insert(
      Array.from({ length: 5 }, (_, i) => ({ date: day(1), title: `Tie${i}` }))
    );

    expect(await everyPage({ limit: 2 })).toEqual({
      pages: 3,
      titles: ["Tie4", "Tie3", "Tie2", "Tie1", "Tie0"],
    });
  });

  it("filters by words, type and a date window on the server", async () => {
    await insert([
      { date: day(1), leader: "Maria", title: "Weekly study" },
      { date: day(2), title: "Pélayanan Kasih", type: "church_service" },
      { date: day(3), title: "Heroes of Faith" },
      { date: day(4), title: "100% grace" },
    ]);

    expect(await titles({ q: "maria" })).toEqual(["Weekly study"]);
    expect(await titles({ q: "  KASIH pelayanan " })).toEqual([
      "Pélayanan Kasih",
    ]);
    expect(await titles({ q: "faith nuh" })).toEqual([]);
    // LIKE wildcards in a search are literal characters.
    expect(await titles({ q: "%" })).toEqual(["100% grace"]);
    expect(await titles({ type: "church_service" })).toEqual([
      "Pélayanan Kasih",
    ]);
    expect(await titles({ before: day(3), from: day(2) })).toEqual([
      "Pélayanan Kasih",
    ]);
  });

  it("finds gatherings by passage or by anyone serving", async () => {
    await insert([
      { bibleVerse: "Kejadian 6:9-22", date: day(1), title: "Nuh" },
      { date: day(2), musician: "Felix Arjuna", title: "Grace" },
      { date: day(3), noteWriter: "Kezia", title: "Hope" },
    ]);

    expect(await titles({ q: "kejadian 6" })).toEqual(["Nuh"]);
    expect(await titles({ q: "felix" })).toEqual(["Grace"]);
    expect(await titles({ q: "kezia" })).toEqual(["Hope"]);
  });

  it("lists the months that have gatherings, newest first", async () => {
    await insert([
      { date: new Date("2026-03-07T14:30:00Z") },
      { date: new Date("2026-03-21T14:30:00Z") },
      // Already 1 November in Aachen.
      { date: new Date("2026-10-31T23:30:00Z") },
    ]);

    expect(await anonymousCaller().schedules.months()).toEqual([
      "2026-11",
      "2026-03",
    ]);
  });

  it("reads a whole month earliest first, for the calendar", async () => {
    await insert([
      { date: new Date("2026-09-30T21:59:00Z"), title: "September" },
      { date: new Date("2026-10-31T14:30:00Z"), title: "Late October" },
      { date: new Date("2026-10-03T13:30:00Z"), title: "Early October" },
      { date: new Date("2026-10-31T23:00:00Z"), title: "November" },
    ]);

    const month = await anonymousCaller().schedules.inRange({
      before: new Date("2026-10-31T23:00:00Z"),
      from: new Date("2026-09-30T22:00:00Z"),
    });

    expect(month.map((s) => s.title)).toEqual([
      "Early October",
      "Late October",
    ]);
  });

  it("loads the team of the schedules on the page", async () => {
    const api = callerFor((await insertUser({ role: "admin" })).id);
    await api.schedules.addScheduleBatch([
      { ...validSchedule, date: day(1), leader: "Old leader" },
      { ...validSchedule, date: day(2), leader: "New leader" },
    ]);

    const page = await anonymousCaller().schedules.list({ limit: 1 });

    expect(page.items.map((s) => s.team.map((slot) => slot.name))).toEqual([
      ["New leader", "Musician", "Writer"],
    ]);
  });

  it("offers schedules to takeaway writers as a light list", async () => {
    await insert([{ date: day(1), title: "Faith" }]);
    const writer = callerFor((await insertUser({ role: "writer" })).id);
    const member = callerFor((await insertUser()).id);

    expect(await writer.schedules.options()).toEqual([
      {
        bibleVerse: "Roma 4:1-12",
        date: day(1),
        id: expect.any(Number),
        title: "Faith",
      },
    ]);
    await expect(member.schedules.options()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects page sizes over the limit", async () => {
    await expect(
      anonymousCaller().schedules.list({ limit: 51 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("gatherings and their takeaways", () => {
  it("lists each gathering's takeaway ids, oldest first", async () => {
    const [noted] = await insert([
      { date: day(2), title: "Noted" },
      { date: day(1), title: "Quiet" },
    ]);
    const [first, second] = await testDb
      .insert(takeaways)
      .values([
        { contributors: [], keypoints: "First", scheduleId: noted?.id ?? 0 },
        { contributors: [], keypoints: "Second", scheduleId: noted?.id ?? 0 },
      ])
      .returning({ id: takeaways.id });

    const page = await anonymousCaller().schedules.list({});

    expect(page.items.map((s) => [s.title, s.takeawayIds])).toEqual([
      ["Noted", [first?.id, second?.id]],
      ["Quiet", []],
    ]);
  });

  it("loads one gathering with its team, or NOT_FOUND", async () => {
    const [gathering] = await insert([{ date: day(1), title: "Faith" }]);
    const caller = anonymousCaller();

    const loaded = await caller.schedules.getGathering({
      id: gathering?.id ?? 0,
    });

    expect(loaded).toMatchObject({ takeawayIds: [], title: "Faith" });
    expect(loaded.team.map((slot) => slot.role)).toContain("leader");
    await expect(
      caller.schedules.getGathering({ id: 404 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
