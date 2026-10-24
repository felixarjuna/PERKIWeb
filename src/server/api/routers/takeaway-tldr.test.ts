import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const TLDR = "Abraham **believed** God.";

const insertSchedule = async (title: string) => {
  const [row] = await testDb
    .insert(schedules)
    .values({
      bibleVerse: "Roma 4:1-12",
      cleaningGroup: "Group 4",
      date: new Date("2026-03-01"),
      description: "Sunday service",
      leader: "Leader",
      musician: "Musician",
      noteWriter: "Writer",
      title,
      type: "church_service",
    })
    .returning();
  if (!row) {
    throw new Error("Failed to insert schedule");
  }
  return row;
};

/** A writer's draft takeaway, with the writer's caller and mita's. */
const draft = async () => {
  const writer = await insertUser({ role: "writer" });
  const mita = callerFor((await insertUser({ role: "mita" })).id);
  const api = callerFor(writer.id);
  const schedule = await insertSchedule("Faith");
  const { id } = await api.takeaways.addTakeaway({
    contributors: [],
    keypoints: "Abraham believed God",
    scheduleId: schedule.id,
  });
  return { api, id, mita };
};

const storedTldr = async (id: number) => {
  const [row] = await testDb
    .select({ tldr: takeaways.tldr })
    .from(takeaways)
    .where(eq(takeaways.id, id));
  return row?.tldr;
};

describe("takeaway TL;DR", () => {
  it("is saved by the writer, published with the notes and shown to the public", async () => {
    const { api, id, mita } = await draft();

    await api.takeawayTldr.save({ id, tldr: TLDR });
    await api.takeaways.setStatus({ id, status: "in_review" });
    await mita.takeaways.setStatus({ id, status: "published" });

    const visitor = anonymousCaller();
    const page = await visitor.takeaways.getTakeawayById({ id });
    expect(page.takeaways.tldr).toBe(TLDR);
    const [listed] = (await visitor.takeaways.getTakeaways({})).items;
    expect(listed?.takeaways.tldr).toBe(TLDR);
  });

  it("never reaches public responses before it is published", async () => {
    const { api, id } = await draft();
    await api.takeawayTldr.save({ id, tldr: "Secret draft summary" });
    const visitor = anonymousCaller();

    await expect(visitor.takeaways.getTakeawayById({ id })).rejects.toThrow(
      expect.objectContaining({ code: "NOT_FOUND" })
    );
    await api.takeaways.setStatus({ id, status: "in_review" });
    await expect(visitor.takeaways.getTakeawayById({ id })).rejects.toThrow(
      expect.objectContaining({ code: "NOT_FOUND" })
    );
    const list = await visitor.takeaways.getTakeaways({});
    expect(JSON.stringify(list)).not.toContain("Secret draft summary");
  });

  it("lets staff edit it in draft, and locks it once submitted", async () => {
    const { api, id, mita } = await draft();
    await api.takeawayTldr.save({ id, tldr: TLDR });
    await mita.takeawayTldr.save({ id, tldr: "Shorter." });
    expect(await storedTldr(id)).toBe("Shorter.");
    await api.takeaways.setStatus({ id, status: "in_review" });

    expect((await mita.takeaways.getTakeawayById({ id })).takeaways.tldr).toBe(
      "Shorter."
    );
    await expect(
      mita.takeawayTldr.save({ id, tldr: "Changed" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await storedTldr(id)).toBe("Shorter.");
  });

  it("stores an empty TL;DR as none", async () => {
    const { api, id } = await draft();
    await api.takeawayTldr.save({ id, tldr: TLDR });

    await api.takeawayTldr.save({ id, tldr: "  \n " });

    expect(await storedTldr(id)).toBeNull();
  });

  it("keeps a published TL;DR live while its change waits for review", async () => {
    const { api, id, mita } = await draft();
    await api.takeawayTldr.save({ id, tldr: TLDR });
    await api.takeaways.setStatus({ id, status: "in_review" });
    await mita.takeaways.setStatus({ id, status: "published" });

    await mita.takeawayTldr.save({ id, tldr: "Changed" });

    expect(await storedTldr(id)).toBe(TLDR);
    expect(
      await api.takeawayRevisions.current({ takeawayId: id })
    ).toMatchObject({ tldr: "Changed" });
  });

  it("only lets the author and staff save it", async () => {
    const { id } = await draft();
    const otherWriter = callerFor((await insertUser({ role: "writer" })).id);
    const member = callerFor((await insertUser()).id);

    await expect(
      otherWriter.takeawayTldr.save({ id, tldr: "Mine now" })
    ).rejects.toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
    await expect(member.takeawayTldr.save({ id, tldr: "x" })).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN" })
    );
    await expect(
      anonymousCaller().takeawayTldr.save({ id, tldr: "x" })
    ).rejects.toThrow(expect.objectContaining({ code: "UNAUTHORIZED" }));
    await expect(
      otherWriter.takeawayTldr.save({ id: 404, tldr: "x" })
    ).rejects.toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
    expect(await storedTldr(id)).toBeNull();
  });
});
