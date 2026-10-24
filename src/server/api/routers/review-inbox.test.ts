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
        status: "in_review",
        title: "Faith",
        type: "bible_study",
      },
    ]);
    expect(inbox.needsReview).toEqual([]);
  });

  it("shows another writer what needs review, never someone's draft", async () => {
    const writer = await insertUser({ name: "Writer", role: "writer" });
    const reviewer = await insertUser({ name: "Reviewer", role: "writer" });
    const inReview = await insertTakeaway("Grace", "in_review", writer.id);
    await insertTakeaway("Draft", "draft", writer.id);
    await insertTakeaway("Live", "published", writer.id);

    const inbox = await callerFor(reviewer.id).reviewInbox.mine();

    expect(inbox.needsReview.map((row) => row.id)).toEqual([inReview.id]);
    expect(inbox.openFeedback).toEqual([]);
    expect(inbox.readyToPublish).toEqual([]);
  });

  it("shows mita what is ready to publish once the feedback is handled", async () => {
    const writer = await insertUser({ name: "Writer", role: "writer" });
    const mita = await insertUser({ role: "mita" });
    const note = await insertTakeaway("Hope", "in_review", writer.id);
    await comment(note.id, mita.id);
    const api = callerFor(mita.id);

    expect((await api.reviewInbox.mine()).needsReview).toHaveLength(1);
    expect((await api.reviewInbox.mine()).readyToPublish).toEqual([]);

    await testDb.update(takeawayComments).set({ resolvedAt: new Date() });

    const ready = await api.reviewInbox.mine();
    expect(ready.readyToPublish.map((row) => row.id)).toEqual([note.id]);
    expect(ready.needsReview).toEqual([]);
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
