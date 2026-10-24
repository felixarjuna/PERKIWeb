import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import {
  schedules,
  type TakeawayStatus,
  takeawaySuggestions,
  takeaways,
  users,
} from "~/lib/db/schema/schema";
import { QUOTE_MAX_LENGTH } from "~/lib/takeaway-comments";
import { REPLACEMENT_MAX_LENGTH } from "~/lib/takeaway-suggestions";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

vi.mock("~/server/authz", { spy: true });

const MISSING_ID = 404;
const ORIGINAL = "Abraham believed God";
const NOTES = `${ORIGINAL}, and it was counted to him as righteousness.`;

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

const notesOf = async (id: number) => {
  const [row] = await testDb
    .select({ keypoints: takeaways.keypoints })
    .from(takeaways)
    .where(eq(takeaways.id, id));
  return row?.keypoints;
};

const writer = (name = "Writer") => insertUser({ name, role: "writer" });

/** Submits the takeaway to mita as is. */
const markSubmitted = (id: number) =>
  testDb
    .update(takeaways)
    .set({ status: "in_review" })
    .where(eq(takeaways.id, id));

/** A draft by one writer, with a suggestion from another. */
const reviewed = async () => {
  const author = await writer("Author");
  const reviewer = await writer("Reviewer");
  const { id } = await insertTakeaway("draft", author.id);
  const suggestion = await callerFor(reviewer.id).takeawaySuggestions.add({
    original: ORIGINAL,
    replacement: "Abraham trusted God",
    takeawayId: id,
  });
  return { author, id, reviewer, suggestion };
};

describe("takeaway suggestions", () => {
  it("lets the writer accept another writer's suggestion, replacing the passage", async () => {
    const { author, id, reviewer, suggestion } = await reviewed();
    const list = await callerFor(author.id).takeawaySuggestions.list({
      takeawayId: id,
    });
    expect(list).toMatchObject({ canDecide: true, canSuggest: false });
    expect(list.suggestions).toHaveLength(1);
    expect(list.suggestions.at(0)).toMatchObject({
      applies: true,
      author: { name: "Reviewer" },
      decidedBy: null,
      mine: false,
      original: ORIGINAL,
      replacement: "Abraham trusted God",
      status: "open",
    });
    expect(JSON.stringify(list)).not.toContain(reviewer.id);
    expect(JSON.stringify(list)).not.toContain(reviewer.email);

    const result = await callerFor(author.id).takeawaySuggestions.accept({
      id: suggestion.id,
    });
    const expected =
      "Abraham trusted God, and it was counted to him as righteousness.";
    expect(result).toEqual({ keypoints: expected });
    expect(await notesOf(id)).toBe(expected);
    const [accepted] = (
      await callerFor(reviewer.id).takeawaySuggestions.list({ takeawayId: id })
    ).suggestions;
    expect(accepted).toMatchObject({
      decidedBy: { name: "Author" },
      mine: true,
      status: "accepted",
    });
    expect(accepted?.decidedAt).toBeInstanceOf(Date);
    await expect(
      callerFor(author.id).takeawaySuggestions.accept({ id: suggestion.id })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("asks the writer to apply a stale suggestion by hand", async () => {
    const { author, id, suggestion } = await reviewed();
    await testDb
      .update(takeaways)
      .set({ keypoints: "Abraham believed the Lord." })
      .where(eq(takeaways.id, id));
    const api = callerFor(author.id).takeawaySuggestions;
    expect(
      (await api.list({ takeawayId: id })).suggestions.at(0)?.applies
    ).toBe(false);
    await expect(api.accept({ id: suggestion.id })).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("by hand"),
    });
    expect(await notesOf(id)).toBe("Abraham believed the Lord.");

    await api.accept({ byHand: true, id: suggestion.id });
    expect(await notesOf(id)).toBe("Abraham believed the Lord.");
    expect((await api.list({ takeawayId: id })).suggestions.at(0)?.status).toBe(
      "accepted"
    );
  });

  it("lets the writer reject a suggestion without changing the text", async () => {
    const { author, id, suggestion } = await reviewed();
    const api = callerFor(author.id).takeawaySuggestions;
    await api.reject({ id: suggestion.id });
    expect(await notesOf(id)).toBe(NOTES);
    expect(
      (await api.list({ takeawayId: id })).suggestions.at(0)
    ).toMatchObject({ decidedBy: { name: "Author" }, status: "rejected" });
    await expect(api.accept({ id: suggestion.id })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("lets mita and the dev decide, but no other writer", async () => {
    const { id, reviewer, suggestion } = await reviewed();
    const other = await writer("Other");
    await Promise.all(
      [reviewer, other].flatMap((user) => [
        expect(
          callerFor(user.id).takeawaySuggestions.accept({ id: suggestion.id })
        ).rejects.toMatchObject({ code: "FORBIDDEN" }),
        expect(
          callerFor(user.id).takeawaySuggestions.reject({ id: suggestion.id })
        ).rejects.toMatchObject({ code: "FORBIDDEN" }),
      ])
    );
    expect(
      (
        await callerFor(reviewer.id).takeawaySuggestions.list({
          takeawayId: id,
        })
      ).canDecide
    ).toBe(false);
    const staff = await insertUser({ name: "Staff", role: "mita" });
    await callerFor(staff.id).takeawaySuggestions.accept({ id: suggestion.id });
    expect(await notesOf(id)).toContain("Abraham trusted God");

    const dev = await insertUser({ role: "owner" });
    const second = await callerFor(reviewer.id).takeawaySuggestions.add({
      original: "righteousness",
      replacement: "right",
      takeawayId: id,
    });
    await callerFor(dev.id).takeawaySuggestions.reject({ id: second.id });
  });

  it("only takes suggestions from reviewers, never from the writer", async () => {
    const author = await writer();
    const other = await writer("Other");
    const draft = await insertTakeaway("draft", author.id);
    await expect(
      callerFor(author.id).takeawaySuggestions.add({
        original: ORIGINAL,
        replacement: "x",
        takeawayId: draft.id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const submitted = await insertTakeaway("in_review", author.id);
    await expect(
      callerFor(other.id).takeawaySuggestions.add({
        original: ORIGINAL,
        replacement: "x",
        takeawayId: submitted.id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const mita = await insertUser({ role: "mita" });
    await callerFor(mita.id).takeawaySuggestions.add({
      original: ORIGINAL,
      replacement: "x",
      takeawayId: draft.id,
    });
    await testDb
      .update(users)
      .set({ role: "member" })
      .where(eq(users.id, mita.id));
    await expect(
      callerFor(mita.id).takeawaySuggestions.add({
        original: ORIGINAL,
        replacement: "x",
        takeawayId: draft.id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("freezes suggestions once the takeaway is published", async () => {
    const { author, id, reviewer, suggestion } = await reviewed();
    const staff = await insertUser({ role: "mita" });
    await markSubmitted(id);
    await callerFor(staff.id).takeaways.setStatus({ id, status: "published" });
    await expect(
      callerFor(author.id).takeawaySuggestions.accept({ id: suggestion.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      callerFor(staff.id).takeawaySuggestions.add({
        original: "righteousness",
        replacement: "x",
        takeawayId: id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      callerFor(reviewer.id).takeawaySuggestions.list({ takeawayId: id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(
      await callerFor(author.id).takeawaySuggestions.list({ takeawayId: id })
    ).toMatchObject({ canDecide: false, canSuggest: false });
    expect(await notesOf(id)).toBe(NOTES);
  });

  it("lets reviewers withdraw only their own open suggestions", async () => {
    const { author, id, reviewer, suggestion } = await reviewed();
    await expect(
      callerFor(author.id).takeawaySuggestions.remove({ id: suggestion.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await callerFor(reviewer.id).takeawaySuggestions.remove({
      id: suggestion.id,
    });
    expect(
      await testDb
        .select()
        .from(takeawaySuggestions)
        .where(eq(takeawaySuggestions.takeawayId, id))
    ).toEqual([]);
    const decided = await callerFor(reviewer.id).takeawaySuggestions.add({
      original: "righteousness",
      replacement: "right",
      takeawayId: id,
    });
    await callerFor(author.id).takeawaySuggestions.reject({ id: decided.id });
    await expect(
      callerFor(reviewer.id).takeawaySuggestions.remove({ id: decided.id })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("validates the passage and replacement", async () => {
    const { id, reviewer } = await reviewed();
    const api = callerFor(reviewer.id).takeawaySuggestions;
    const invalid = [
      { original: "  ", replacement: "x" },
      { original: "x".repeat(QUOTE_MAX_LENGTH + 1), replacement: "x" },
      {
        original: ORIGINAL,
        replacement: "x".repeat(REPLACEMENT_MAX_LENGTH + 1),
      },
      { original: ORIGINAL, replacement: "  " },
      { original: ORIGINAL, replacement: ` ${ORIGINAL} ` },
    ];
    await Promise.all(
      invalid.map((input) =>
        expect(api.add({ ...input, takeawayId: id })).rejects.toMatchObject({
          code: "BAD_REQUEST",
        })
      )
    );
    await expect(
      api.add({ original: ORIGINAL, replacement: "x", takeawayId: MISSING_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("never sends suggestions through the public takeaway queries", async () => {
    const { author, id, reviewer } = await reviewed();
    const staff = await insertUser({ role: "mita" });
    await markSubmitted(id);
    await callerFor(staff.id).takeaways.setStatus({ id, status: "published" });
    const visitor = anonymousCaller();
    const responses = JSON.stringify([
      await visitor.takeaways.getTakeawayById({ id }),
      await visitor.takeaways.getTakeaways({}),
    ]);
    expect(responses).toContain("Faith");
    expect(responses).not.toContain("Abraham trusted God");
    await expect(
      visitor.takeawaySuggestions.list({ takeawayId: id })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      callerFor((await insertUser()).id).takeawaySuggestions.list({
        takeawayId: id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await testDb.delete(users).where(eq(users.id, reviewer.id));
    expect(
      (
        await callerFor(author.id).takeawaySuggestions.list({ takeawayId: id })
      ).suggestions.at(0)?.author
    ).toBeNull();
    await testDb.delete(takeaways).where(eq(takeaways.id, id));
    expect(await testDb.select().from(takeawaySuggestions)).toEqual([]);
  });
});
