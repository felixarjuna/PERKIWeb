import { describe, expect, it } from "vitest";
import { scheduleAssignments } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const service = {
  bibleVerse: "Psalm 1",
  cleaningGroup: "Group 1",
  date: new Date("2026-05-09T16:00:00Z"),
  description: "Service",
  leader: "Ana",
  musician: "Ben",
  noteWriter: "Cleo",
  preacher: "Ev. Riggrubben",
  title: "Service",
  type: "church_service" as const,
};

const admin = async () =>
  callerFor((await insertUser({ name: "Admin", role: "mita" })).id);

const preacherSlots = () =>
  testDb
    .select({
      name: scheduleAssignments.name,
      speakerId: scheduleAssignments.speakerId,
      userId: scheduleAssignments.userId,
    })
    .from(scheduleAssignments)
    .then((rows) => rows.filter((row) => row.name.startsWith("Ev.")));

describe("speakers router", () => {
  it("adds a speaker and links preacher slots by name or other spelling", async () => {
    const api = await admin();
    await api.schedules.addSchedule(service);
    await api.schedules.addSchedule({
      ...service,
      date: new Date("2026-05-16T16:00:00Z"),
      preacher: "Ev. Nehemiah Riggruben",
    });
    expect(await api.speakers.unmatched()).toHaveLength(2);

    const created = await api.speakers.create({
      aliases: ["Ev. Riggrubben", "Ev. Nehemiah  Riggruben."],
      name: "Ev. Riggruben",
      photoUrl: "/images/riggrubben.jpg",
    });

    expect((await preacherSlots()).map((slot) => slot.speakerId)).toEqual([
      created?.id,
      created?.id,
    ]);
    expect(await api.speakers.unmatched()).toEqual([]);
    expect(await api.speakers.all()).toEqual([
      expect.objectContaining({
        aliases: ["ev riggrubben", "ev nehemiah riggruben"],
        sermons: 2,
      }),
    ]);
  });

  it("never links a preacher to a member account", async () => {
    const api = await admin();
    await insertUser({ name: "Ev. Riggrubben" });
    await api.schedules.addSchedule(service);

    expect(await preacherSlots()).toEqual([
      { name: "Ev. Riggrubben", speakerId: null, userId: null },
    ]);
  });

  it("adds a spelling from an unmatched preacher name", async () => {
    const api = await admin();
    const created = await api.speakers.create({ name: "Ev. Riggruben" });
    await api.schedules.addSchedule(service);
    const [unmatched] = await api.speakers.unmatched();
    expect(unmatched).toMatchObject({ count: 1, name: "Ev. Riggrubben" });

    await api.speakers.addSpelling({
      id: created?.id ?? 0,
      name: "Ev. Riggrubben",
    });

    expect((await preacherSlots())[0]?.speakerId).toBe(created?.id);
  });

  it("refuses a spelling that belongs to another speaker", async () => {
    const api = await admin();
    await api.speakers.create({ name: "Pdt. John Kusuma" });

    await expect(
      api.speakers.create({ aliases: ["pdt john kusuma"], name: "Someone" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      api.speakers.create({ name: "Pdt. John Kusuma" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("validates the photo link", async () => {
    const api = await admin();
    await expect(
      api.speakers.create({ name: "Pdt. Guest", photoUrl: "not a link" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("lists only active speakers publicly, and shows a speaker's photo to everyone", async () => {
    const api = await admin();
    const riggruben = await api.speakers.create({
      aliases: ["Ev. Riggrubben"],
      name: "Ev. Riggruben",
      photoUrl: "/images/riggrubben.jpg",
    });
    const retired = await api.speakers.create({ name: "Pdt. Retired" });
    await api.speakers.update({
      active: false,
      id: retired?.id ?? 0,
      name: "Pdt. Retired",
    });
    await api.schedules.addSchedule(service);

    expect(
      (await anonymousCaller().speakers.active()).map((speaker) => speaker.id)
    ).toEqual([riggruben?.id]);
    const [schedule] = (await anonymousCaller().schedules.list({})).items;
    expect(schedule?.team.find((slot) => slot.role === "preacher")).toEqual({
      image: "/images/riggrubben.jpg",
      name: "Ev. Riggrubben",
      role: "preacher",
    });
  });

  it("is admin-only for everything but the public list", async () => {
    const member = callerFor((await insertUser()).id);
    await expect(member.speakers.all()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      anonymousCaller().speakers.create({ name: "Pdt. Guest" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
