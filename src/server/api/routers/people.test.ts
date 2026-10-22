import { describe, expect, it } from "vitest";
import {
  groupMembers,
  groups,
  groupTerms,
  scheduleAssignments,
} from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const service = {
  bibleVerse: "Psalm 1",
  cleaningGroup: "Group 1",
  date: new Date("2026-05-09T16:00:00Z"),
  description: "Service",
  leader: "Winston A.",
  musician: "Jco",
  noteWriter: "Winston A",
  preacher: "Pdt. Guest",
  title: "Service",
  type: "church_service" as const,
};

const setup = async () => {
  const admin = await insertUser({ name: "Admin", role: "mita" });
  const winston = await insertUser({
    image: "https://example.test/winston.png",
    name: "Winston Alexander",
  });
  const jericho = await insertUser({
    image: "https://example.test/jericho.png",
    name: "Jericho Oland Marsahala",
  });
  const api = callerFor(admin.id);
  await api.schedules.addSchedule(service);
  const [term] = await testDb
    .insert(groupTerms)
    .values({ startsOn: "2026-04-01" })
    .returning();
  const [group] = await testDb
    .insert(groups)
    .values({ name: "Group 1", termId: term?.id ?? 0 })
    .returning();
  await testDb
    .insert(groupMembers)
    .values({ groupId: group?.id ?? 0, name: "Jco" });
  return { api, jericho, winston };
};

describe("people router", () => {
  it("groups unlinked spellings with their uses and a suggested account", async () => {
    const { api, winston } = await setup();

    const unlinked = await api.people.unlinked();

    expect(unlinked).toEqual([
      expect.objectContaining({
        key: "jco",
        suggestion: null,
        total: 2,
        uses: [
          { count: 1, label: "Musician" },
          { count: 1, label: "Group 1" },
        ],
      }),
      expect.objectContaining({
        key: "winston a",
        spellings: ["Winston A.", "Winston A"],
        suggestion: expect.objectContaining({ id: winston.id }),
        total: 2,
      }),
    ]);
  });

  it("links a spelling everywhere it is used, and on later writes", async () => {
    const { api, jericho } = await setup();

    expect(await api.people.link({ name: "Jco", userId: jericho.id })).toEqual({
      groups: 1,
      slots: 1,
    });
    expect(
      (await testDb.select().from(groupMembers)).map((m) => m.userId)
    ).toEqual([jericho.id]);

    await api.schedules.addSchedule({
      ...service,
      date: new Date("2026-05-16T16:00:00Z"),
    });
    const musicians = (await testDb.select().from(scheduleAssignments)).filter(
      (slot) => slot.role === "musician"
    );
    expect(musicians.map((slot) => slot.userId)).toEqual([
      jericho.id,
      jericho.id,
    ]);
    expect(await api.people.linked()).toEqual([
      {
        account: expect.objectContaining({ id: jericho.id }),
        names: [{ count: 3, key: "jco", label: "Jco", saved: true }],
      },
    ]);
  });

  it("groups every spelling under its account, saved links and exact names alike", async () => {
    const { api, winston } = await setup();
    await api.schedules.addSchedule({
      ...service,
      date: new Date("2026-05-16T16:00:00Z"),
      musician: "Winston Alexander",
    });
    await api.people.link({ name: "Winston A.", userId: winston.id });

    const [entry] = await api.people.linked();

    expect(entry).toEqual({
      account: expect.objectContaining({ id: winston.id }),
      names: [
        {
          count: 4,
          key: "winston a",
          label: "Winston A. / Winston A",
          saved: true,
        },
        {
          count: 1,
          key: "winston alexander",
          label: "Winston Alexander",
          saved: false,
        },
      ],
    });
  });

  it("unlinks a spelling again", async () => {
    const { api, jericho } = await setup();
    await api.people.link({ name: "Jco", userId: jericho.id });

    await api.people.unlink({ name: "JCO" });

    expect(await api.people.linked()).toEqual([]);
    expect(
      (await testDb.select().from(groupMembers)).map((m) => m.userId)
    ).toEqual([null]);
  });

  it("rejects a link to a missing account", async () => {
    const { api } = await setup();
    await expect(
      api.people.link({ name: "Jco", userId: "missing" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("shows photos to signed-in members only", async () => {
    const { api, jericho } = await setup();
    await api.people.link({ name: "Jco", userId: jericho.id });
    const member = callerFor((await insertUser()).id);

    const [signedIn] = (await member.schedules.list({})).items;
    const [signedOut] = (await anonymousCaller().schedules.list({})).items;

    const musician = (schedule: typeof signedIn) =>
      schedule?.team.find((slot) => slot.role === "musician");
    expect(musician(signedIn)).toEqual({
      image: "https://example.test/jericho.png",
      name: "Jco",
      role: "musician",
    });
    expect(musician(signedOut)?.image).toBeNull();
    expect(signedIn?.groupMembers.cleaning).toEqual([
      { image: "https://example.test/jericho.png", name: "Jco" },
    ]);
    expect(signedOut?.groupMembers.cleaning).toEqual([
      { image: null, name: "Jco" },
    ]);
    expect(JSON.stringify(signedIn)).not.toContain(jericho.id);
  });

  it("is admin-only", async () => {
    const member = callerFor((await insertUser()).id);
    await expect(member.people.unlinked()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      anonymousCaller().people.link({ name: "x", userId: "y" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
