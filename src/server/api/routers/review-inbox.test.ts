import { describe, expect, it } from "vitest";
import {
  schedules,
  type TakeawayStatus,
  takeawayComments,
  takeawaySuggestions,
  takeaways,
} from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const insertTakeaway = async (
  title: string,
  status: TakeawayStatus,
  authorId: string | null
) => {
  const [schedule] = await testDb
    .insert(schedules)
    .values({
      bibleVerse: "Roma 4:1-12",
      cleaningGroup: "Group 4",
      date: new Date("2026-03-01T14:30:00Z"),
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
  const [row] = await testDb
    .insert(takeaways)
    .values({
      authorId,
      contributors: [],
      keypoints: "Abraham believed God.",
      scheduleId: schedule.id,
      status,
    })
    .returning();
  if (!row) {
    throw new Error("Failed to insert takeaway");
  }
  return row;
};

const comment = (takeawayId: number, authorId: string, resolved = false) =>
  testDb.insert(takeawayComments).values({
    authorId,
    body: "Which verse?",
    resolvedAt: resolved ? new Date() : null,
    takeawayId,
  });

const suggestion = (
  takeawayId: number,
  authorId: string,
  status: "open" | "accepted" | "rejected" = "open"
) =>
  testDb.insert(takeawaySuggestions).values({
    authorId,
    original: "believed",
    replacement: "trusted",
    status,
    takeawayId,
  });

describe("review inbox", () => {
  it("gives the writer their open feedback, counting only others' unresolved comments and open suggestions", async () => {
    const writer = await insertUser({ name: "Writer", role: "writer" });
    const reviewer = await insertUser({ name: "Reviewer", role: "writer" });
    const note = await insertTakeaway("Faith", "in_review", writer.id);
    await comment(note.id, reviewer.id);
    await comment(note.id, reviewer.id, true);
    await comment(note.id, writer.id);
    await suggestion(note.id, reviewer.id);
    await suggestion(note.id, reviewer.id, "accepted");
    await insertTakeaway("Quiet", "draft", writer.id);

    const inbox = await callerFor(writer.id).reviewInbox.mine();

    expect(inbox.openFeedback).toEqual([
      {
        authorName: "Writer",
        date: new Date("2026-03-01T14:30:00Z"),
        id: note.id,
        openComments: 1,
        openSuggestions: 1,
        revision: null,
        status: "in_review",
        title: "Faith",
        type: "bible_study",
      },
    ]);
    expect(inbox.needsReview).toEqual([]);
  });

  it("shows another writer the drafts to review, never submitted or published ones", async () => {
    const writer = await insertUser({ name: "Writer", role: "writer" });
    const reviewer = await insertUser({ name: "Reviewer", role: "writer" });
    await insertTakeaway("Grace", "in_review", writer.id);
    const draft = await insertTakeaway("Draft", "draft", writer.id);
    await insertTakeaway("Live", "published", writer.id);

    const inbox = await callerFor(reviewer.id).reviewInbox.mine();

    expect(inbox.needsReview.map((row) => row.id)).toEqual([draft.id]);
    expect(inbox.openFeedback).toEqual([]);
    expect(inbox.readyToPublish).toEqual([]);
  });

  it("shows mita every submitted takeaway as ready, and drafts with open feedback to review", async () => {
    const writer = await insertUser({ name: "Writer", role: "writer" });
    const mita = await insertUser({ role: "mita" });
    const submitted = await insertTakeaway("Hope", "in_review", writer.id);
    const draft = await insertTakeaway("Love", "draft", writer.id);
    await insertTakeaway("Quiet", "draft", writer.id);
    await comment(draft.id, mita.id);
    const api = callerFor(mita.id);

    const inbox = await api.reviewInbox.mine();
    expect(inbox.readyToPublish.map((row) => row.id)).toEqual([submitted.id]);
    expect(inbox.needsReview.map((row) => row.id)).toEqual([draft.id]);

    await testDb.update(takeawayComments).set({ resolvedAt: new Date() });

    expect((await api.reviewInbox.mine()).needsReview).toEqual([]);
  });

  it("lists a correction at its status with the feedback on that correction only", async () => {
    const writer = await insertUser({ name: "Writer", role: "writer" });
    const reviewer = await insertUser({ name: "Reviewer", role: "writer" });
    const mita = await insertUser({ role: "mita" });
    const note = await insertTakeaway("Faith", "published", writer.id);
    // Feedback from the takeaway's own review, before it was published.
    await comment(note.id, reviewer.id);
    const author = callerFor(writer.id);
    await author.takeawayTldr.save({ id: note.id, tldr: "Waiting is faith." });

    // A correction in draft is the shared draft: other writers review it.
    const reviewing = await callerFor(reviewer.id).reviewInbox.mine();
    expect(reviewing.needsReview).toEqual([
      expect.objectContaining({
        id: note.id,
        openComments: 0,
        revision: "draft",
        status: "published",
      }),
    ]);
    expect(
      (await callerFor(mita.id).reviewInbox.mine()).readyToPublish
    ).toEqual([]);

    await callerFor(reviewer.id).takeawayComments.add({
      body: "Which son?",
      takeawayId: note.id,
    });
    expect((await author.reviewInbox.mine()).openFeedback).toEqual([
      expect.objectContaining({ id: note.id, openComments: 1 }),
    ]);
    expect(
      (await callerFor(mita.id).reviewInbox.mine()).needsReview.map(
        (row) => row.id
      )
    ).toEqual([note.id]);

    await testDb.update(takeawayComments).set({ resolvedAt: new Date() });
    await author.takeawayRevisions.setStatus({
      status: "in_review",
      takeawayId: note.id,
    });
    const staff = await callerFor(mita.id).reviewInbox.mine();
    expect(staff.readyToPublish.map((row) => row.id)).toEqual([note.id]);
    expect(staff.needsReview).toEqual([]);
    expect(
      (await callerFor(reviewer.id).reviewInbox.mine()).needsReview
    ).toEqual([]);

    // Once published, the correction leaves every list.
    await callerFor(mita.id).takeawayRevisions.setStatus({
      status: "published",
      takeawayId: note.id,
    });
    expect(await callerFor(mita.id).reviewInbox.mine()).toEqual({
      needsReview: [],
      openFeedback: [],
      readyToPublish: [],
    });
  });

  it("is only for writers and staff", async () => {
    const member = await insertUser({ role: "member" });
    await expect(anonymousCaller().reviewInbox.mine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(callerFor(member.id).reviewInbox.mine()).rejects.toMatchObject(
      { code: "FORBIDDEN" }
    );
  });
});
