import { afterEach, describe, expect, it, vi } from "vitest";
import { groupTerms } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const gathering = {
  bibleVerse: "Roma 4:1-12",
  cleaningGroup: "Group 1",
  description: "Weekly gathering",
  leader: "Guest Leader",
  musician: "Guest Musician",
  noteWriter: "Guest Writer",
  title: "Gathering",
};

const admin = async () =>
  callerFor((await insertUser({ name: "Mita", role: "mita" })).id);

describe("servingPool", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is for staff only", async () => {
    const member = callerFor((await insertUser({ name: "Member" })).id);
    const writer = callerFor(
      (await insertUser({ name: "Writer", role: "writer" })).id
    );
    await expect(anonymousCaller().servingPool.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(member.servingPool.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(writer.servingPool.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      member.servingPool.add({ group: "musician", userId: "x" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("adds a leader as both leader and liturgist", async () => {
    const api = await admin();
    const ana = await insertUser({ name: "Ana Putri" });

    await api.servingPool.add({ group: "lead", userId: ana.id });
    // Adding again keeps the existing entries.
    await expect(
      api.servingPool.add({ group: "lead", userId: ana.id })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const { entries } = await api.servingPool.list();
    expect(
      entries.map(({ role, scope, status, user }) => ({
        name: user.name,
        role,
        scope,
        status,
      }))
    ).toEqual([
      {
        name: "Ana Putri",
        role: "leader",
        scope: "bible_study",
        status: "active",
      },
      {
        name: "Ana Putri",
        role: "liturgist",
        scope: "church_service",
        status: "active",
      },
    ]);
  });

  it("adds a leader for the service only or PA Besar only", async () => {
    const api = await admin();
    const ana = await insertUser({ name: "Ana Putri" });
    const budi = await insertUser({ name: "Budi Santoso" });

    await api.servingPool.add({ group: "liturgist", userId: ana.id });
    await api.servingPool.add({ group: "leader", userId: budi.id });

    const { entries } = await api.servingPool.list();
    expect(
      entries.map(({ role, scope, user }) => [user.name, role, scope])
    ).toEqual([
      ["Ana Putri", "liturgist", "church_service"],
      ["Budi Santoso", "leader", "bible_study"],
    ]);
  });

  it("refuses a scope the role isn't scheduled for", async () => {
    const api = await admin();
    const ana = await insertUser({ name: "Ana Putri" });
    await expect(
      api.servingPool.add({
        group: "multimedia",
        scope: "bible_study",
        userId: ana.id,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await api.servingPool.add({
      group: "musician",
      scope: "both",
      userId: ana.id,
    });
    const [entry] = (await api.servingPool.list()).entries;
    await expect(
      api.servingPool.update({
        id: entry?.id ?? 0,
        scope: "church_service",
        status: "backup",
      })
    ).resolves.toBeDefined();
    expect((await api.servingPool.list()).entries).toEqual([
      expect.objectContaining({ scope: "church_service", status: "backup" }),
    ]);
  });

  it("counts times served this term and the last time served", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-25T12:00:00Z"),
      toFake: ["Date"],
    });
    const api = await admin();
    const ana = await insertUser({ name: "Ana Putri" });
    const budi = await insertUser({ name: "Budi Santoso" });
    await testDb
      .insert(groupTerms)
      .values([{ startsOn: "2026-04-01" }, { startsOn: "2026-10-01" }]);
    await api.servingPool.add({ group: "lead", userId: ana.id });
    await api.servingPool.add({ group: "musician", userId: ana.id });
    await api.servingPool.add({ group: "musician", userId: budi.id });
    await api.schedules.addScheduleBatch([
      // Last term: the latest liturgist slot, but not counted this term.
      {
        ...gathering,
        date: new Date("2026-09-27T13:30:00Z"),
        leader: "Ana Putri",
        type: "church_service",
      },
      // This term, in Aachen (00:30 on 1 October is still this term).
      {
        ...gathering,
        date: new Date("2026-09-30T22:30:00Z"),
        leader: "Ana Putri",
        musician: "Ana Putri",
        type: "bible_study",
      },
      {
        ...gathering,
        date: new Date("2026-10-17T13:30:00Z"),
        leader: "Ana Putri",
        type: "bible_study",
      },
      // Upcoming: not served yet.
      {
        ...gathering,
        date: new Date("2026-11-07T14:30:00Z"),
        leader: "Ana Putri",
        type: "bible_study",
      },
    ]);

    const { entries, term } = await api.servingPool.list();
    expect(term).toEqual({ before: null, from: "2026-10-01" });
    const served = Object.fromEntries(
      entries.map((entry) => [
        `${entry.user.name} ${entry.role}`,
        [entry.servedThisTerm, entry.lastServed?.toISOString() ?? null],
      ])
    );
    expect(served).toEqual({
      "Ana Putri leader": [2, "2026-10-17T13:30:00.000Z"],
      "Ana Putri liturgist": [0, "2026-09-27T13:30:00.000Z"],
      "Ana Putri musician": [1, "2026-09-30T22:30:00.000Z"],
      "Budi Santoso musician": [0, null],
    });
  });

  it("pauses entries until a day with a private note, then resumes them", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-25T12:00:00Z"),
      toFake: ["Date"],
    });
    const api = await admin();
    const ana = await insertUser({ name: "Ana Putri" });
    await api.servingPool.add({ group: "lead", userId: ana.id });
    const ids = (await api.servingPool.list()).entries.map((entry) => entry.id);

    await expect(
      api.servingPool.pause({ ids, note: "Exams", until: "2026-10-24" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await api.servingPool.pause({ ids, note: "Exams", until: "2026-11-30" });
    expect((await api.servingPool.list()).entries).toEqual([
      expect.objectContaining({
        pausedUntil: "2026-11-30",
        pauseNote: "Exams",
        status: "paused",
      }),
      expect.objectContaining({ status: "paused" }),
    ]);

    // The day after the pause ends, the stored status shows again.
    vi.setSystemTime(new Date("2026-12-01T12:00:00Z"));
    expect(
      (await api.servingPool.list()).entries.map((entry) => entry.status)
    ).toEqual(["active", "active"]);

    await api.servingPool.resume({ ids });
    expect((await api.servingPool.list()).entries).toEqual([
      expect.objectContaining({ pausedUntil: null, pauseNote: null }),
      expect.objectContaining({ pausedUntil: null, pauseNote: null }),
    ]);
  });

  it("removes an entry", async () => {
    const api = await admin();
    const ana = await insertUser({ name: "Ana Putri" });
    await api.servingPool.add({ group: "musician", userId: ana.id });
    const [entry] = (await api.servingPool.list()).entries;
    await api.servingPool.remove({ id: entry?.id ?? 0 });
    expect((await api.servingPool.list()).entries).toEqual([]);
  });

  it("never shows the pool or its notes on the public site", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-25T12:00:00Z"),
      toFake: ["Date"],
    });
    const api = await admin();
    const ana = await insertUser({ name: "Ana Putri" });
    await api.servingPool.add({ group: "lead", userId: ana.id });
    const ids = (await api.servingPool.list()).entries.map((entry) => entry.id);
    await api.servingPool.pause({
      ids,
      note: "Private family matter",
      until: "2026-11-30",
    });
    await api.schedules.addSchedule({
      ...gathering,
      date: new Date("2026-10-31T14:30:00Z"),
      leader: "Ana Putri",
      type: "bible_study",
    });

    const member = callerFor(ana.id);
    const publicViews = await Promise.all([
      anonymousCaller().schedules.inRange({
        before: new Date("2026-12-01T00:00:00Z"),
        from: new Date("2026-10-01T00:00:00Z"),
      }),
      anonymousCaller().schedules.list({}),
      member.schedules.list({}),
      member.schedules.myDuties(),
      member.profiles.mine(),
    ]);
    const shown = JSON.stringify(publicViews);
    expect(shown).not.toContain("Private family matter");
    expect(shown).not.toContain("pausedUntil");
    expect(shown).not.toContain("2026-11-30");
  });
});
