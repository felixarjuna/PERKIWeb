import { asc, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { groupMembers, groups, groupTerms } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const insertTerm = async (
  startsOn: string,
  group: string,
  members: string[]
) => {
  const [term] = await testDb
    .insert(groupTerms)
    .values({ startsOn })
    .returning();
  const [row] = await testDb
    .insert(groups)
    .values({ name: group, termId: term?.id ?? 0 })
    .returning();
  await testDb.insert(groupMembers).values(
    members.map((name, position) => ({
      groupId: row?.id ?? 0,
      name,
      position,
    }))
  );
  return term?.id ?? 0;
};

describe("groups router", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null before the first term", async () => {
    expect(await anonymousCaller().groups.getCurrent()).toBeNull();
  });

  it("returns the latest term that has started, members in order", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-21T12:00:00Z"),
      toFake: ["Date"],
    });
    await insertTerm("2025-10-01", "Group 1", ["Old"]);
    await insertTerm("2026-04-01", "Group 1", ["Wynnona", "Toni"]);
    await insertTerm("2027-04-01", "Group 1", ["Future"]);

    expect(await anonymousCaller().groups.getCurrent()).toEqual({
      groups: [
        {
          members: [
            { image: null, name: "Wynnona" },
            { image: null, name: "Toni" },
          ],
          name: "Group 1",
        },
      ],
      startsOn: "2026-04-01",
    });
  });
});

type Caller = ReturnType<typeof callerFor>;
type ManagedTerm = Awaited<
  ReturnType<Caller["groups"]["terms"]>
>["terms"][number];

/** A staff caller, and Group 1 / Group 2 in force since April 2026. */
const currentTerm = async () => {
  vi.useFakeTimers({
    now: new Date("2026-10-21T12:00:00Z"),
    toFake: ["Date"],
  });
  const mita = callerFor((await insertUser({ role: "mita" })).id);
  await insertTerm("2025-10-01", "Group 1", ["Old"]);
  const termId = await insertTerm("2026-04-01", "Group 1", [
    "Ana Putri",
    "Toni",
  ]);
  await testDb.insert(groups).values({ name: "Group 2", termId });
  return mita;
};

const termOnDay = async (mita: Caller, day: string) => {
  const { terms } = await mita.groups.terms();
  const term = terms.find((candidate) => candidate.startsOn === day);
  if (!term) {
    throw new Error(`No term on ${day}`);
  }
  return term;
};

const memberNamed = (term: ManagedTerm, name: string) => {
  const member = term.groups
    .flatMap((group) => group.members)
    .find((candidate) => candidate.name === name);
  if (!member) {
    throw new Error(`No member ${name}`);
  }
  return member;
};

const groupNamed = (term: ManagedTerm, name: string) => {
  const group = term.groups.find((candidate) => candidate.name === name);
  if (!group) {
    throw new Error(`No group ${name}`);
  }
  return group;
};

/** The names in each group of the term /group shows right now. */
const publicGroups = async () =>
  (await anonymousCaller().groups.getCurrent())?.groups.map((group) => ({
    members: group.members.map((member) => member.name),
    name: group.name,
  }));

describe("group management", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is staff only", async () => {
    const member = callerFor((await insertUser()).id);
    await expect(member.groups.terms()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      member.groups.startTerm({ startsOn: "2026-11-01" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller().groups.terms()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("lists every term newest first, with its status", async () => {
    const mita = await currentTerm();
    const { terms, today } = await mita.groups.terms();
    expect(today).toBe("2026-10-21");
    expect(
      terms.map((term) => ({
        groups: term.groups.map((group) => ({
          members: group.members.map((member) => member.name),
          name: group.name,
        })),
        startsOn: term.startsOn,
        status: term.status,
      }))
    ).toEqual([
      {
        groups: [
          { members: ["Ana Putri", "Toni"], name: "Group 1" },
          { members: [], name: "Group 2" },
        ],
        startsOn: "2026-04-01",
        status: "current",
      },
      {
        groups: [{ members: ["Old"], name: "Group 1" }],
        startsOn: "2025-10-01",
        status: "past",
      },
    ]);
  });

  it("switches /group to a new term, with a moved member, on its start date", async () => {
    const mita = await currentTerm();
    await mita.groups.startTerm({ startsOn: "2026-11-01" });
    const next = await termOnDay(mita, "2026-11-01");
    expect(next.status).toBe("upcoming");
    await mita.groups.moveMember({
      groupId: groupNamed(next, "Group 2").id,
      memberId: memberNamed(next, "Toni").id,
    });

    // 23:59 on 31 October in Aachen: the running term, untouched.
    vi.setSystemTime(new Date("2026-10-31T22:59:00Z"));
    expect(await publicGroups()).toEqual([
      { members: ["Ana Putri", "Toni"], name: "Group 1" },
      { members: [], name: "Group 2" },
    ]);
    // Midnight in Aachen: the new term.
    vi.setSystemTime(new Date("2026-10-31T23:00:00Z"));
    expect((await anonymousCaller().groups.getCurrent())?.startsOn).toBe(
      "2026-11-01"
    );
    expect(await publicGroups()).toEqual([
      { members: ["Ana Putri"], name: "Group 1" },
      { members: ["Toni"], name: "Group 2" },
    ]);
  });

  it("starts the six empty groups when there is no term yet", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-21T12:00:00Z"),
      toFake: ["Date"],
    });
    const mita = callerFor((await insertUser({ role: "mita" })).id);
    await mita.groups.startTerm({ startsOn: "2026-11-01" });
    const term = await termOnDay(mita, "2026-11-01");
    expect(term.groups.map((group) => group.name)).toEqual([
      "Group 1",
      "Group 2",
      "Group 3",
      "Group 4",
      "Group 5",
      "Group 6",
    ]);
  });

  it("refuses a start date today, in the past or already taken", async () => {
    const mita = await currentTerm();
    await Promise.all(
      ["2026-10-21", "2026-04-01", "2026-09-01"].map((startsOn) =>
        expect(mita.groups.startTerm({ startsOn })).rejects.toMatchObject({
          code: "BAD_REQUEST",
        })
      )
    );
    await mita.groups.startTerm({ startsOn: "2026-11-01" });
    await expect(
      mita.groups.startTerm({ startsOn: "2026-11-01" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("copies from the term in force before the new start date", async () => {
    const mita = await currentTerm();
    await mita.groups.startTerm({ startsOn: "2027-04-01" });
    const april = await termOnDay(mita, "2027-04-01");
    await mita.groups.addMember({
      groupId: groupNamed(april, "Group 2").id,
      name: "Newcomer",
    });
    await mita.groups.startTerm({ startsOn: "2027-10-01" });
    const october = await termOnDay(mita, "2027-10-01");
    expect(
      groupNamed(october, "Group 2").members.map((member) => member.name)
    ).toEqual(["Newcomer"]);
  });

  it("links added and copied members to accounts through name links", async () => {
    const mita = await currentTerm();
    const ana = await insertUser({ image: "/ana.png", name: "Ana Putri" });
    const budi = await insertUser({ name: "Budi Santoso" });
    await mita.people.link({ name: "Budi", userId: budi.id });
    await mita.groups.startTerm({ startsOn: "2026-11-01" });
    const next = await termOnDay(mita, "2026-11-01");
    await mita.groups.addMember({
      groupId: groupNamed(next, "Group 2").id,
      name: "  budi ",
    });
    await mita.groups.addMember({
      groupId: groupNamed(next, "Group 2").id,
      name: "Stranger",
    });

    const stored = await testDb
      .select({ name: groupMembers.name, userId: groupMembers.userId })
      .from(groupMembers)
      .innerJoin(groups, eq(groups.id, groupMembers.groupId))
      .innerJoin(groupTerms, eq(groupTerms.id, groups.termId))
      .where(eq(groupTerms.startsOn, "2026-11-01"))
      .orderBy(asc(groupMembers.name));
    expect(stored).toEqual([
      { name: "Ana Putri", userId: ana.id },
      { name: "Stranger", userId: null },
      { name: "Toni", userId: null },
      { name: "budi", userId: budi.id },
    ]);
    const after = await termOnDay(mita, "2026-11-01");
    expect(memberNamed(after, "Ana Putri")).toMatchObject({
      image: "/ana.png",
      linked: true,
    });
    expect(memberNamed(after, "Stranger").linked).toBe(false);
    // Account ids never leave the server.
    expect(JSON.stringify(after)).not.toContain(ana.id);
  });

  it("keeps a person in one group per term", async () => {
    const mita = await currentTerm();
    const current = await termOnDay(mita, "2026-04-01");
    await expect(
      mita.groups.addMember({
        groupId: groupNamed(current, "Group 2").id,
        name: "ana  putri",
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("Group 1"),
    });
  });

  it("edits the current term but never a past one", async () => {
    const mita = await currentTerm();
    const current = await termOnDay(mita, "2026-04-01");
    await mita.groups.moveMember({
      groupId: groupNamed(current, "Group 2").id,
      memberId: memberNamed(current, "Toni").id,
    });
    await mita.groups.removeMember({
      memberId: memberNamed(current, "Ana Putri").id,
    });
    const edited = await termOnDay(mita, "2026-04-01");
    expect(groupNamed(edited, "Group 1").members).toEqual([]);
    expect(
      groupNamed(edited, "Group 2").members.map((member) => member.name)
    ).toEqual(["Toni"]);

    const past = await termOnDay(mita, "2025-10-01");
    const old = memberNamed(past, "Old");
    await expect(
      mita.groups.removeMember({ memberId: old.id })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      mita.groups.addMember({
        groupId: groupNamed(past, "Group 1").id,
        name: "Late",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    // Only within one term.
    await expect(
      mita.groups.moveMember({
        groupId: groupNamed(current, "Group 2").id,
        memberId: old.id,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("deletes an upcoming term only", async () => {
    const mita = await currentTerm();
    await mita.groups.startTerm({ startsOn: "2026-11-01" });
    const next = await termOnDay(mita, "2026-11-01");
    const current = await termOnDay(mita, "2026-04-01");
    await expect(
      mita.groups.deleteTerm({ termId: current.id })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await mita.groups.deleteTerm({ termId: next.id });
    const { terms } = await mita.groups.terms();
    expect(terms.map((term) => term.startsOn)).toEqual([
      "2026-04-01",
      "2025-10-01",
    ]);
  });
});
