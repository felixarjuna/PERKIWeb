import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import {
  schedules,
  type TakeawayStatus,
  takeawayComments,
  takeaways,
  users,
} from "~/lib/db/schema/schema";
import { COMMENT_MAX_LENGTH, QUOTE_MAX_LENGTH } from "~/lib/takeaway-comments";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

vi.mock("~/server/authz", { spy: true });

const MISSING_ID = 404;
const QUOTE = "Abraham believed God";
const NOTES = `${QUOTE}, and it was counted to him as righteousness.`;

const insertTakeaway = async (status: TakeawayStatus, authorId: string) => {
  const [schedule] = await testDb
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
  if (!schedule) {
    throw new Error("Failed to insert schedule");
  }
  const [row] = await testDb
    .insert(takeaways)
    .values({
      authorId,
      contributors: [],
      keypoints: NOTES,
      scheduleId: schedule.id,
      status,
    })
    .returning();
  if (!row) {
    throw new Error("Failed to insert takeaway");
  }
  return row;
};

const writer = (name = "Writer") => insertUser({ name, role: "writer" });

describe("takeaway comments", () => {
  it("rechecks role and status for existing callers and comments", async () => {
    const author = await writer();
    const reviewer = await writer("Reviewer");
    const staff = await insertUser({ role: "mita" });
    const { id } = await insertTakeaway("in_review", author.id);
    const api = callerFor(reviewer.id).takeawayComments;
    const comment = await api.add({ body: "Feedback", takeawayId: id });
    await callerFor(staff.id).takeaways.setStatus({ id, status: "published" });
    await expect(
      api.setResolved({ id: comment.id, resolved: true })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(api.list({ takeawayId: id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      callerFor(author.id).takeawayComments.setResolved({
        id: comment.id,
        resolved: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await testDb
      .update(users)
      .set({ role: "member" })
      .where(eq(users.id, staff.id));
    await expect(
      callerFor(staff.id).takeawayComments.add({ body: "Hi", takeawayId: id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it.each([
    { role: "mita", status: "draft" },
    { role: "mita", status: "in_review" },
    { role: "mita", status: "published" },
    { role: "owner", status: "draft" },
    { role: "owner", status: "in_review" },
    { role: "owner", status: "published" },
  ] as const)(
    "allows $role on $status, retains deleted authors and cascades takeaway deletion",
    async ({ role, status }) => {
      const author = await writer();
      const reviewer = await insertUser({ role });
      const { id } = await insertTakeaway(status, author.id);
      const api = callerFor(reviewer.id).takeawayComments;
      const comment = await api.add({ body: "Feedback", takeawayId: id });
      await api.setResolved({ id: comment.id, resolved: true });
      expect(
        (await api.list({ takeawayId: id })).comments.at(0)?.resolvedBy
      ).toEqual({ name: reviewer.name });
      await testDb.delete(users).where(eq(users.id, reviewer.id));
      const staff = await insertUser({ role: "mita" });
      expect(
        (
          await callerFor(staff.id).takeawayComments.list({ takeawayId: id })
        ).comments.at(0)
      ).toMatchObject({ author: null, resolvedBy: null });
      await testDb.delete(takeaways).where(eq(takeaways.id, id));
      expect(
        await testDb
          .select()
          .from(takeawayComments)
          .where(eq(takeawayComments.takeawayId, id))
      ).toEqual([]);
    }
  );

  it("enforces length limits and stores plain text without rendering HTML", async () => {
    const author = await writer();
    const { id } = await insertTakeaway("draft", author.id);
    const api = callerFor(author.id).takeawayComments;
    await expect(
      api.add({ body: "x".repeat(COMMENT_MAX_LENGTH + 1), takeawayId: id })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api.add({
        body: "Hi",
        quote: "x".repeat(QUOTE_MAX_LENGTH + 1),
        takeawayId: id,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await api.add({
      body: "  <script>hello</script>  ",
      quote: "  ",
      takeawayId: id,
    });
    expect((await api.list({ takeawayId: id })).comments.at(0)).toMatchObject({
      body: "<script>hello</script>",
      quote: null,
    });
  });

  it("lets another writer quote a passage and the writer resolve it", async () => {
    const author = await writer("Author");
    const reviewer = await writer("Reviewer");
    const { id } = await insertTakeaway("in_review", author.id);

    await callerFor(reviewer.id).takeawayComments.add({
      body: "Could you add the verse reference here?",
      quote: QUOTE,
      takeawayId: id,
    });

    const thread = await callerFor(author.id).takeawayComments.list({
      takeawayId: id,
    });
    expect(thread.canComment).toBe(true);
    expect(thread.comments).toHaveLength(1);
    const [comment] = thread.comments;
    expect(comment).toMatchObject({
      author: { name: "Reviewer" },
      body: "Could you add the verse reference here?",
      mine: false,
      quote: QUOTE,
      resolvedAt: null,
      resolvedBy: null,
    });
    expect(JSON.stringify(thread)).not.toContain(reviewer.id);

    await callerFor(author.id).takeawayComments.setResolved({
      id: comment?.id ?? MISSING_ID,
      resolved: true,
    });
    const [resolved] = (
      await callerFor(reviewer.id).takeawayComments.list({ takeawayId: id })
    ).comments;
    expect(resolved?.resolvedAt).toBeInstanceOf(Date);
    expect(resolved?.resolvedBy).toEqual({ name: "Author" });
    expect(resolved?.mine).toBe(true);

    await callerFor(reviewer.id).takeawayComments.setResolved({
      id: comment?.id ?? MISSING_ID,
      resolved: false,
    });
    const [reopened] = (
      await callerFor(author.id).takeawayComments.list({ takeawayId: id })
    ).comments;
    expect(reopened).toMatchObject({ resolvedAt: null, resolvedBy: null });
  });

  it("never sends comments through the public takeaway queries", async () => {
    const author = await writer();
    const mita = await insertUser({ role: "mita" });
    const { id } = await insertTakeaway("in_review", author.id);
    await callerFor(mita.id).takeawayComments.add({
      body: "Internal review note",
      quote: QUOTE,
      takeawayId: id,
    });
    await callerFor(mita.id).takeaways.setStatus({ id, status: "published" });

    const visitor = anonymousCaller();
    const responses = JSON.stringify([
      await visitor.takeaways.getTakeawayById({ id }),
      await visitor.takeaways.getTakeaways({}),
      await callerFor((await insertUser()).id).takeaways.getTakeawayById({
        id,
      }),
    ]);
    expect(responses).toContain("Faith");
    expect(responses).not.toContain("Internal review note");
    await expect(
      visitor.takeawayComments.list({ takeawayId: id })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      callerFor((await insertUser()).id).takeawayComments.list({
        takeawayId: id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps other writers out of a draft's thread", async () => {
    const author = await writer();
    const other = await writer("Other");
    const { id } = await insertTakeaway("draft", author.id);
    await callerFor(author.id).takeawayComments.add({
      body: "Note to self",
      takeawayId: id,
    });

    await expect(
      callerFor(other.id).takeawayComments.list({ takeawayId: id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      callerFor(other.id).takeawayComments.add({ body: "Hi", takeawayId: id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const [comment] = await testDb.select().from(takeawayComments);
    await expect(
      callerFor(other.id).takeawayComments.setResolved({
        id: comment?.id ?? MISSING_ID,
        resolved: true,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("lets the writer read but not add to the thread once published", async () => {
    const author = await writer();
    const { id } = await insertTakeaway("published", author.id);
    const api = callerFor(author.id);

    const thread = await api.takeawayComments.list({ takeawayId: id });
    expect(thread).toEqual({ canComment: false, comments: [] });
    await expect(
      api.takeawayComments.add({ body: "Late note", takeawayId: id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an empty comment and a missing takeaway", async () => {
    const author = await writer();
    const { id } = await insertTakeaway("draft", author.id);
    const api = callerFor(author.id);

    await expect(
      api.takeawayComments.add({ body: "   ", takeawayId: id })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api.takeawayComments.add({ body: "Hi", takeawayId: MISSING_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
