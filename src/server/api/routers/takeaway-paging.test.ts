import { describe, expect, it } from "vitest";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const day = (n: number) =>
  new Date(`2026-02-${String(n).padStart(2, "0")}T14:30:00Z`);

/** A schedule on `date` with one takeaway. */
const add = async (
  title: string,
  date: Date,
  keypoints: string,
  contributors: string[] = []
) => {
  const [schedule] = await testDb
    .insert(schedules)
    .values({
      bibleVerse: "Roma 4:1-12",
      cleaningGroup: "Group 4",
      date,
      description: "Weekly bible study",
      leader: "Leader",
      musician: "Musician",
      noteWriter: "Writer",
      title,
      type: "bible_study",
    })
    .returning();
  if (!schedule) {
    throw new Error("Failed to insert schedule");
  }
  await testDb
    .insert(takeaways)
    .values({ contributors, keypoints, scheduleId: schedule.id });
  return schedule;
};

/** Adds `count` takeaways, one per day, in date order. */
const addMany = async (count: number, keypoints = "Notes") => {
  for (let n = 1; n <= count; n += 1) {
    // biome-ignore lint/performance/noAwaitInLoops: keeps ids in date order.
    await add(`T${n}`, day(n), keypoints);
  }
};

describe("takeaway paging", () => {
  it("pages the public list newest first without repeats", async () => {
    await addMany(5);
    const caller = anonymousCaller();

    const first = await caller.takeaways.getTakeaways({ limit: 2 });
    const second = await caller.takeaways.getTakeaways({
      cursor: first.nextCursor,
      limit: 2,
    });
    const third = await caller.takeaways.getTakeaways({
      cursor: second.nextCursor,
      limit: 2,
    });

    expect(
      [first, second, third].flatMap((page) =>
        page.items.map((row) => row.schedules.title)
      )
    ).toEqual(["T5", "T4", "T3", "T2", "T1"]);
    expect(third.nextCursor).toBeNull();
  });

  it("keeps two takeaways of the same gathering on separate pages", async () => {
    const schedule = await add("Shared", day(1), "First");
    await testDb.insert(takeaways).values({
      contributors: [],
      keypoints: "Second",
      scheduleId: schedule.id,
    });
    const caller = anonymousCaller();

    const first = await caller.takeaways.getTakeaways({ limit: 1 });
    const second = await caller.takeaways.getTakeaways({
      cursor: first.nextCursor,
      limit: 1,
    });

    expect(
      [...first.items, ...second.items].map((row) => row.takeaways.keypoints)
    ).toEqual(["Second", "First"]);
    expect(second.nextCursor).toBeNull();
  });

  it("searches every takeaway on the server, ignoring case and accents", async () => {
    await addMany(12, "Other notes");
    await add("Heroes of Faith", day(20), "Integritas Nuh", ["Gaby"]);
    await add("Kasih", day(21), "Pélayanan");
    const search = async (q: string, type: "all" | "church_service" = "all") =>
      (
        await anonymousCaller().takeaways.getTakeaways({ limit: 5, q, type })
      ).items.map((row) => row.schedules.title);

    expect(await search("nuh FAITH")).toEqual(["Heroes of Faith"]);
    expect(await search("pelayanan")).toEqual(["Kasih"]);
    expect(await search("gaby")).toEqual(["Heroes of Faith"]);
    expect(await search("other T1")).toEqual(["T12", "T11", "T10", "T1"]);
    expect(await search("nuh musa")).toEqual([]);
    expect(await search("nuh", "church_service")).toEqual([]);
  });

  it("pages and filters the manage list in both orders", async () => {
    const writer = await insertUser({ role: "writer" });
    await add("M1", day(1), "Notes");
    await add("M2", day(2), "Grace");
    await add("M3", day(3), "Notes");
    const api = callerFor(writer.id);

    const first = await api.takeaways.getManageable({ limit: 2, order: "asc" });
    const rest = await api.takeaways.getManageable({
      cursor: first.nextCursor,
      limit: 2,
      order: "asc",
    });
    expect(
      [...first.items, ...rest.items].map((row) => row.schedules.title)
    ).toEqual(["M1", "M2", "M3"]);
    expect(rest.nextCursor).toBeNull();

    const grace = await api.takeaways.getManageable({ q: "grace" });
    expect(
      grace.items.map((row) => [row.schedules.title, row.canManage])
    ).toEqual([["M2", false]]);
  });

  it("filters by month and lists the months that have takeaways", async () => {
    await add("Late March", new Date("2026-03-28T14:30:00Z"), "Notes");
    // 22:30 UTC on 30 April is already 1 May in Aachen.
    await add("May Day", new Date("2026-04-30T22:30:00Z"), "Notes");
    await add("October", new Date("2026-10-03T13:30:00Z"), "Notes");
    const caller = anonymousCaller();

    const may = await caller.takeaways.getTakeaways({
      before: new Date("2026-05-31T22:00:00Z"),
      from: new Date("2026-04-30T22:00:00Z"),
    });

    expect(may.items.map((row) => row.schedules.title)).toEqual(["May Day"]);
    expect(await caller.takeaways.months()).toEqual([
      "2026-10",
      "2026-05",
      "2026-03",
    ]);
  });
});
