import { afterEach, describe, expect, it, vi } from "vitest";
import { groupMembers, groups, groupTerms } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const gathering = {
  bibleVerse: "Roma 4:1-12",
  cleaningGroup: "Group 9",
  description: "Weekly gathering",
  leader: "Lia",
  musician: "Max",
  noteWriter: "Nia",
  type: "bible_study" as const,
};

/** A group term with one group and its linked members. */
const insertGroup = async (
  startsOn: string,
  name: string,
  members: { name: string; userId?: string }[]
) => {
  const [term] = await testDb
    .insert(groupTerms)
    .values({ startsOn })
    .returning();
  const [group] = await testDb
    .insert(groups)
    .values({ name, termId: term?.id ?? 0 })
    .returning();
  await testDb.insert(groupMembers).values(
    members.map((member, position) => ({
      groupId: group?.id ?? 0,
      position,
      ...member,
    }))
  );
};

describe("schedules.myDuties", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is only for signed-in members", async () => {
    await expect(anonymousCaller().schedules.myDuties()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("lists only the member's own slots and group days, soonest first", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-21T12:00:00Z"),
      toFake: ["Date"],
    });
    const ana = await insertUser({ name: "Ana Putri" });
    const budi = await insertUser({ name: "Budi Santoso" });
    const admin = callerFor((await insertUser({ role: "mita" })).id);
    await insertGroup("2026-04-01", "Group 3", [
      { name: "Ana", userId: ana.id },
      { name: "Budi", userId: budi.id },
    ]);
    await admin.schedules.addScheduleBatch([
      {
        ...gathering,
        date: new Date("2026-11-07T14:30:00Z"),
        musician: "Ana Putri",
        title: "Later",
      },
      {
        ...gathering,
        date: new Date("2026-10-24T13:30:00Z"),
        leader: "Ana Putri",
        noteWriter: "Budi Santoso",
        title: "Soon",
      },
      {
        ...gathering,
        cleaningGroup: "group 3",
        date: new Date("2026-10-31T14:30:00Z"),
        title: "Cleaning",
      },
      {
        ...gathering,
        date: new Date("2026-10-28T14:30:00Z"),
        noteWriter: "Budi Santoso",
        title: "Not hers",
      },
      {
        ...gathering,
        date: new Date("2026-09-05T13:30:00Z"),
        musician: "Ana Putri",
        title: "Earlier",
      },
      {
        ...gathering,
        date: new Date("2026-10-03T13:30:00Z"),
        musician: "Ana Putri",
        title: "Recent",
      },
    ]);

    const duties = await callerFor(ana.id).schedules.myDuties();

    expect(
      duties.upcoming.map(({ title, duties: own }) => ({ own, title }))
    ).toEqual([
      { own: [{ role: "leader" }], title: "Soon" },
      { own: [{ group: "Group 3", role: "cleaning" }], title: "Cleaning" },
      { own: [{ role: "musician" }], title: "Later" },
    ]);
    expect(duties.past.map((duty) => duty.title)).toEqual([
      "Recent",
      "Earlier",
    ]);
    // The team is the public one: names, never account ids.
    expect(JSON.stringify(duties)).not.toContain(budi.id);
    expect(JSON.stringify(duties)).not.toContain(ana.id);
  });

  it("leaves out cancelled gatherings", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-21T12:00:00Z"),
      toFake: ["Date"],
    });
    const ana = await insertUser({ name: "Ana Putri" });
    const admin = callerFor((await insertUser({ role: "mita" })).id);
    await insertGroup("2026-04-01", "Group 3", [
      { name: "Ana", userId: ana.id },
    ]);
    await admin.schedules.addScheduleBatch([
      {
        ...gathering,
        cancelled: true,
        date: new Date("2026-10-24T13:30:00Z"),
        leader: "Ana Putri",
        title: "Cancelled",
      },
      {
        ...gathering,
        cancelled: true,
        cleaningGroup: "Group 3",
        date: new Date("2026-10-31T14:30:00Z"),
        title: "Cancelled cleaning",
      },
      {
        ...gathering,
        cancelled: true,
        date: new Date("2026-10-03T13:30:00Z"),
        musician: "Ana Putri",
        title: "Cancelled earlier",
      },
      {
        ...gathering,
        date: new Date("2026-11-07T14:30:00Z"),
        musician: "Ana Putri",
        title: "Planned",
      },
    ]);

    const duties = await callerFor(ana.id).schedules.myDuties();
    expect(duties.upcoming.map((duty) => duty.title)).toEqual(["Planned"]);
    expect(duties.past).toEqual([]);
  });

  it("uses the group term in force on each gathering's day", async () => {
    vi.useFakeTimers({
      now: new Date("2026-03-01T12:00:00Z"),
      toFake: ["Date"],
    });
    const ana = await insertUser({ name: "Ana Putri" });
    const admin = callerFor((await insertUser({ role: "mita" })).id);
    await insertGroup("2025-10-01", "Group 1", [
      { name: "Ana", userId: ana.id },
    ]);
    await insertGroup("2026-04-01", "Group 2", [
      { name: "Ana", userId: ana.id },
    ]);
    // A later term reuses the name "Group 1" for other people.
    await insertGroup("2026-05-01", "Group 1", [{ name: "Someone" }]);
    await admin.schedules.addScheduleBatch([
      {
        ...gathering,
        bibleVerse: "Mark 1",
        cookingGroup: "Group 1",
        date: new Date("2026-03-14T14:30:00Z"),
        title: "Old term",
        type: "church_service",
      },
      {
        ...gathering,
        cleaningGroup: "Group 1",
        date: new Date("2026-05-09T13:30:00Z"),
        title: "Someone else's group",
      },
      {
        ...gathering,
        cleaningGroup: "Group 2",
        date: new Date("2026-04-11T13:30:00Z"),
        title: "New term",
      },
    ]);

    const duties = await callerFor(ana.id).schedules.myDuties();

    expect(
      duties.upcoming.map(({ title, duties: own }) => ({ own, title }))
    ).toEqual([
      { own: [{ group: "Group 1", role: "cooking" }], title: "Old term" },
      { own: [{ group: "Group 2", role: "cleaning" }], title: "New term" },
    ]);
  });

  it("follows a member moved to another group in a new term", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-21T12:00:00Z"),
      toFake: ["Date"],
    });
    const ana = await insertUser({ name: "Ana Putri" });
    const admin = callerFor((await insertUser({ role: "mita" })).id);
    await insertGroup("2026-04-01", "Group 1", [
      { name: "Ana Putri", userId: ana.id },
    ]);
    const [april] = await testDb.select().from(groupTerms);
    await testDb
      .insert(groups)
      .values({ name: "Group 2", termId: april?.id ?? 0 });
    await admin.groups.startTerm({ startsOn: "2026-11-01" });
    const next = (await admin.groups.terms()).terms.find(
      (term) => term.startsOn === "2026-11-01"
    );
    const [group1, group2] = next?.groups ?? [];
    await admin.groups.moveMember({
      groupId: group2?.id ?? 0,
      memberId: group1?.members[0]?.id ?? 0,
    });
    await admin.schedules.addScheduleBatch([
      {
        ...gathering,
        cleaningGroup: "Group 1",
        date: new Date("2026-10-24T13:30:00Z"),
        title: "Group 1, old term",
      },
      {
        ...gathering,
        cleaningGroup: "Group 1",
        date: new Date("2026-11-07T14:30:00Z"),
        title: "Group 1, new term",
      },
      {
        ...gathering,
        cleaningGroup: "Group 2",
        date: new Date("2026-11-14T14:30:00Z"),
        title: "Group 2, new term",
      },
    ]);

    const duties = await callerFor(ana.id).schedules.myDuties();

    expect(
      duties.upcoming.map(({ title, duties: own }) => ({ own, title }))
    ).toEqual([
      {
        own: [{ group: "Group 1", role: "cleaning" }],
        title: "Group 1, old term",
      },
      {
        own: [{ group: "Group 2", role: "cleaning" }],
        title: "Group 2, new term",
      },
    ]);
  });

  it("is empty for a member with no linked slots or group", async () => {
    const ana = await insertUser({ name: "Ana Putri" });
    expect(await callerFor(ana.id).schedules.myDuties()).toEqual({
      past: [],
      upcoming: [],
    });
  });
});
