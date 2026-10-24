import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

vi.mock("~/server/authz", { spy: true });

const PASSAGE = "Abraham believed God";
const NOTES = `${PASSAGE}, and it was counted to him as righteousness.`;

const insertSchedule = async () => {
  const [row] = await testDb
    .insert(schedules)
    .values({
      bibleVerse: "Roma 4:1-12",
      cleaningGroup: "Group 4",
      date: new Date("2026-03-01"),
      description: "Weekly bible study",
      leader: "Leader",
      musician: "Musician",
      noteWriter: "Writer",
      title: "Faith",
      type: "bible_study",
    })
    .returning();
  if (!row) {
    throw new Error("Failed to insert schedule");
  }
  return row;
};

/** The writing team: the takeaway's writer, another writer, mita, a member. */
const team = async () => {
  const [author, peer, mita, member] = await Promise.all([
    insertUser({ name: "Author", role: "writer" }),
    insertUser({ name: "Peer", role: "writer" }),
    insertUser({ name: "Mita", role: "mita" }),
    insertUser({ name: "Member" }),
  ]);
  return {
    author: callerFor(author.id),
    member: callerFor(member.id),
    mita: callerFor(mita.id),
    peer: callerFor(peer.id),
  };
};

/** A draft written by `author`. */
const draft = async (author: ReturnType<typeof callerFor>) => {
  const schedule = await insertSchedule();
  const { id } = await author.takeaways.addTakeaway({
    contributors: [],
    keypoints: NOTES,
    scheduleId: schedule.id,
  });
  return { id, scheduleId: schedule.id };
};

const statusOf = async (id: number) =>
  (
    await testDb
      .select({ status: takeaways.status })
      .from(takeaways)
      .where(eq(takeaways.id, id))
  ).at(0)?.status;

describe("shared draft flow (#75)", () => {
  it("goes draft → comment → resolve → submit → request changes → fix → resubmit → publish", async () => {
    const { author, mita, peer } = await team();
    const { id, scheduleId } = await draft(author);

    // Another writer reads the shared draft, comments and suggests an edit.
    const read = await peer.takeaways.getTakeawayById({ id });
    expect(read.takeaways.status).toBe("draft");
    const comment = await peer.takeawayComments.add({
      body: "Add the verse reference.",
      takeawayId: id,
    });
    await peer.takeawaySuggestions.add({
      original: PASSAGE,
      replacement: "Abraham trusted God",
      takeawayId: id,
    });

    // The open comment blocks submitting, with a message that says so.
    await expect(
      author.takeaways.setStatus({ id, status: "in_review" })
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message:
        "Resolve the open comment from Peer before submitting to mita.",
    });
    const thread = await author.takeawayComments.list({ takeawayId: id });
    expect(thread.comments.map((row) => row.blocksSubmit)).toEqual([true]);

    await author.takeawayComments.setResolved({
      id: comment.id,
      resolved: true,
    });
    await author.takeaways.setStatus({ id, status: "in_review" });
    expect(await statusOf(id)).toBe("in_review");

    // Mita must say what to change; the note lands in the thread.
    await expect(
      mita.takeaways.setStatus({ id, status: "draft" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      mita.takeaways.setStatus({ id, note: "   ", status: "draft" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await statusOf(id)).toBe("in_review");
    await mita.takeaways.setStatus({
      id,
      note: "Please shorten the second point.",
      status: "draft",
    });
    expect(await statusOf(id)).toBe("draft");
    const returned = await author.takeawayComments.list({ takeawayId: id });
    const note = returned.comments.find((row) => row.requestsChanges);
    expect(note).toMatchObject({
      author: { name: "Mita" },
      blocksSubmit: true,
      body: "Please shorten the second point.",
      resolvedAt: null,
    });

    // The writer fixes it, resolves the note and resubmits.
    await author.takeaways.updateTakeaway({
      contributors: [],
      id,
      keypoints: `${NOTES} Shorter.`,
      scheduleId,
    });
    await expect(
      author.takeaways.setStatus({ id, status: "in_review" })
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: "Resolve the open comment from Mita before submitting to mita.",
    });
    if (!note) {
      throw new Error("expected the request-changes note");
    }
    await author.takeawayComments.setResolved({ id: note.id, resolved: true });
    await author.takeaways.setStatus({ id, status: "in_review" });
    await mita.takeaways.setStatus({ id, status: "published" });
    expect(await statusOf(id)).toBe("published");
  });

  it("lets other writers read, comment on and suggest edits to a draft, but not change it", async () => {
    const { author, peer } = await team();
    const { id, scheduleId } = await draft(author);

    const [listed] = (await peer.takeaways.getManageable({})).items;
    expect(listed).toMatchObject({ actions: [], canManage: false });
    expect(
      (await peer.takeawayComments.list({ takeawayId: id })).canComment
    ).toBe(true);
    expect(
      (await peer.takeawaySuggestions.list({ takeawayId: id })).canSuggest
    ).toBe(true);
    await expect(
      peer.takeaways.updateTakeaway({
        contributors: [],
        id,
        keypoints: "Hacked",
        scheduleId,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      peer.takeaways.setStatus({ id, status: "in_review" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(peer.takeaways.deleteTakeaway({ id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("locks a submitted takeaway's text for everyone, and its thread for other writers", async () => {
    const { author, mita, peer } = await team();
    const { id, scheduleId } = await draft(author);
    const suggestion = await peer.takeawaySuggestions.add({
      original: PASSAGE,
      replacement: "Abraham trusted God",
      takeawayId: id,
    });
    await author.takeaways.setStatus({ id, status: "in_review" });

    for (const api of [author, mita, peer]) {
      // biome-ignore lint/performance/noAwaitInLoops: one viewer at a time.
      await expect(
        api.takeaways.updateTakeaway({
          contributors: [],
          id,
          keypoints: "Changed while submitted",
          scheduleId,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        api.takeawaySuggestions.accept({ id: suggestion.id })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    await expect(
      peer.takeawayComments.add({ body: "Late note", takeawayId: id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      peer.takeawaySuggestions.add({
        original: PASSAGE,
        replacement: "x",
        takeawayId: id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    // Other writers still read it; its writer and mita still talk in the thread.
    expect((await peer.takeaways.getTakeawayById({ id })).takeaways.status).toBe(
      "in_review"
    );
    await author.takeawayComments.add({ body: "Ready?", takeawayId: id });
    await mita.takeawayComments.add({ body: "Looking now.", takeawayId: id });
    expect(
      (
        await testDb
          .select({ keypoints: takeaways.keypoints })
          .from(takeaways)
          .where(eq(takeaways.id, id))
      ).at(0)?.keypoints
    ).toBe(NOTES);
  });

  it("refuses each role the moves it may not make", async () => {
    const { author, member, mita, peer } = await team();
    const { id } = await draft(author);

    // Draft: only the writer submits; mita can't publish or submit for them.
    await expect(
      mita.takeaways.setStatus({ id, status: "in_review" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      mita.takeaways.setStatus({ id, status: "published" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      member.takeaways.setStatus({ id, status: "in_review" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // Submitted: other writers can't publish or send it back; the writer
    // withdraws without a note but can't publish.
    await author.takeaways.setStatus({ id, status: "in_review" });
    await expect(
      peer.takeaways.setStatus({ id, note: "No", status: "draft" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      peer.takeaways.setStatus({ id, status: "published" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      author.takeaways.setStatus({ id, status: "published" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await author.takeaways.setStatus({ id, status: "draft" });
    expect(await statusOf(id)).toBe("draft");
    expect(
      (await author.takeawayComments.list({ takeawayId: id })).comments
    ).toEqual([]);
  });

  it("doesn't count a writer's notes to themselves against submitting", async () => {
    const { author } = await team();
    const { id } = await draft(author);
    await author.takeawayComments.add({ body: "Check later", takeawayId: id });

    await author.takeaways.setStatus({ id, status: "in_review" });

    expect(await statusOf(id)).toBe("in_review");
  });

  it("names every writer whose open comments block submitting", async () => {
    const { author, mita, peer } = await team();
    const { id } = await draft(author);
    await peer.takeawayComments.add({ body: "One", takeawayId: id });
    await peer.takeawayComments.add({ body: "Two", takeawayId: id });
    await mita.takeawayComments.add({ body: "Three", takeawayId: id });

    await expect(
      author.takeaways.setStatus({ id, status: "in_review" })
    ).rejects.toMatchObject({
      message:
        "Resolve the 3 open comments from Peer and Mita before submitting to mita.",
    });
  });
});
