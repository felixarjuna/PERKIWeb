import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import {
  schedules,
  takeawayComments,
  takeawayRevisions,
  takeawaySuggestions,
  takeaways,
} from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

vi.mock("~/server/authz", { spy: true });

const LIVE = "Abraham believed God, and it was counted to him.";
const LIVE_TLDR = "Faith counts.";
const PENDING = "Abraham trusted God through the long wait for a son.";
const PENDING_TLDR = "Waiting is part of faith.";
const PENDING_WORD = "wait";

const writer = (name = "Writer") => insertUser({ name, role: "writer" });

/** A takeaway its writer wrote and mita published, through the real flow. */
const published = async () => {
  const author = await writer("Author");
  const mita = await insertUser({ name: "Mita", role: "mita" });
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
  const api = callerFor(author.id);
  const { id } = await api.takeaways.addTakeaway({
    contributors: ["Author"],
    keypoints: LIVE,
    scheduleId: schedule.id,
  });
  await api.takeawayTldr.save({ id, tldr: LIVE_TLDR });
  await api.takeaways.setStatus({ id, status: "in_review" });
  await callerFor(mita.id).takeaways.setStatus({ id, status: "published" });
  return {
    api,
    author,
    id,
    mita: callerFor(mita.id),
    mitaId: mita.id,
    schedule,
  };
};

/** The writer corrects the published takeaway's notes and TL;DR. */
const correct = async (
  subject: Awaited<ReturnType<typeof published>>,
  keypoints = PENDING
) => {
  await subject.api.takeawayTldr.save({ id: subject.id, tldr: PENDING_TLDR });
  await subject.api.takeaways.updateTakeaway({
    contributors: ["Author"],
    id: subject.id,
    keypoints,
    scheduleId: subject.schedule.id,
  });
};

const liveRow = async (id: number) => {
  const [row] = await testDb
    .select()
    .from(takeaways)
    .where(eq(takeaways.id, id));
  return row;
};

const revisionRows = (id: number) =>
  testDb
    .select()
    .from(takeawayRevisions)
    .where(eq(takeawayRevisions.takeawayId, id));

/** Everything a visitor can get about the takeaway, as one string. */
const publicView = async (id: number) => {
  const visitor = anonymousCaller();
  const responses = await Promise.all([
    visitor.takeaways.getTakeawayById({ id }),
    visitor.takeaways.getTakeaways({}),
    visitor.takeaways.getTakeaways({ q: PENDING_WORD }),
    visitor.schedules.getGathering({
      id: (await liveRow(id))?.scheduleId ?? 0,
    }),
  ]);
  return JSON.stringify(responses);
};

describe("takeaway revisions", () => {
  it("does not apply an earlier correction's suggestion to an identical passage in a later correction", async () => {
    const subject = await published();
    await correct(subject);
    const reviewer = await writer("Reviewer");
    const suggestion = await callerFor(reviewer.id).takeawaySuggestions.add({
      original: "Waiting",
      replacement: "Patience",
      takeawayId: subject.id,
      target: "tldr",
    });
    await subject.api.takeawayRevisions.setStatus({
      status: "discarded",
      takeawayId: subject.id,
    });
    await correct(subject);
    const list = await subject.api.takeawaySuggestions.list({
      takeawayId: subject.id,
    });
    expect(
      list.suggestions.find((item) => item.id === suggestion.id)?.applies
    ).toBe(false);
    await expect(
      subject.api.takeawaySuggestions.accept({ id: suggestion.id })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(
      (await subject.api.takeawayRevisions.current({ takeawayId: subject.id }))
        ?.tldr
    ).toBe(PENDING_TLDR);
  });

  it("accepts a TL;DR edit in the correction without changing identical notes or published text", async () => {
    const subject = await published();
    await correct(subject, PENDING_TLDR);
    const reviewer = await writer("Reviewer");
    const input = {
      original: "Waiting",
      replacement: "Patience",
      takeawayId: subject.id,
      target: "tldr" as const,
    };
    const suggestion = await callerFor(reviewer.id).takeawaySuggestions.add(
      input
    );
    await subject.api.takeawaySuggestions.accept({ id: suggestion.id });
    expect((await revisionRows(subject.id)).at(0)).toMatchObject({
      keypoints: PENDING_TLDR,
      tldr: "Patience is part of faith.",
    });
    expect(await liveRow(subject.id)).toMatchObject({
      keypoints: LIVE,
      tldr: LIVE_TLDR,
    });
    expect(await publicView(subject.id)).not.toContain("Patience");
  });

  it("keeps the published text live while a correction is reviewed, then publishes it", async () => {
    const subject = await published();
    const { id, mitaId } = subject;
    const publishedAt = (await liveRow(id))?.publishedAt;

    await correct(subject);

    // The website still shows the published text and nothing of the change.
    const visitor = anonymousCaller();
    expect(
      (await visitor.takeaways.getTakeawayById({ id })).takeaways
    ).toMatchObject({ keypoints: LIVE, revisedAt: null, tldr: LIVE_TLDR });
    expect(
      (await visitor.takeaways.getTakeaways({ q: PENDING_WORD })).items
    ).toEqual([]);
    const before = await publicView(id);
    expect(before).not.toContain(PENDING);
    expect(before).not.toContain(PENDING_TLDR);
    expect(await liveRow(id)).toMatchObject({
      keypoints: LIVE,
      status: "published",
      tldr: LIVE_TLDR,
    });

    // The writer and mita see the correction.
    const current = await subject.api.takeawayRevisions.current({
      takeawayId: id,
    });
    expect(current).toMatchObject({
      author: { name: "Author" },
      keypoints: PENDING,
      status: "draft",
      tldr: PENDING_TLDR,
    });

    await subject.api.takeawayRevisions.setStatus({
      status: "in_review",
      takeawayId: id,
    });
    const reviewing = await publicView(id);
    expect(reviewing).not.toContain(PENDING);
    expect(reviewing).not.toContain(PENDING_TLDR);

    const approvedAfter = Date.now();
    await subject.mita.takeawayRevisions.setStatus({
      status: "published",
      takeawayId: id,
    });

    const live = (await visitor.takeaways.getTakeawayById({ id })).takeaways;
    expect(live).toMatchObject({ keypoints: PENDING, tldr: PENDING_TLDR });
    expect(live.publishedAt).toEqual(publishedAt);
    expect(live.revisedAt?.getTime()).toBeGreaterThanOrEqual(approvedAfter);
    expect(
      (await visitor.takeaways.getTakeaways({ q: PENDING_WORD })).items
    ).toHaveLength(1);
    expect(await liveRow(id)).toMatchObject({
      publishedById: expect.any(String),
      status: "published",
    });
    expect(
      await subject.api.takeawayRevisions.current({ takeawayId: id })
    ).toBeNull();
    // The history keeps who changed what, what it replaced and who approved.
    expect(await revisionRows(id)).toEqual([
      expect.objectContaining({
        authorId: subject.author.id,
        decidedById: mitaId,
        keypoints: PENDING,
        previousKeypoints: LIVE,
        previousTldr: LIVE_TLDR,
        status: "published",
        tldr: PENDING_TLDR,
      }),
    ]);
  });

  it("keeps one correction per takeaway: later saves change it", async () => {
    const subject = await published();
    await correct(subject, "First try at the correction.");
    await correct(subject);

    const rows = await revisionRows(subject.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ keypoints: PENDING, status: "draft" });
  });

  it("keeps the live text when mita requests changes or the correction is discarded", async () => {
    const subject = await published();
    const { api, id, mita } = subject;
    await correct(subject);
    await api.takeawayRevisions.setStatus({
      status: "in_review",
      takeawayId: id,
    });

    await mita.takeawayRevisions.setStatus({ status: "draft", takeawayId: id });

    expect(await liveRow(id)).toMatchObject({
      keypoints: LIVE,
      status: "published",
    });
    expect(
      await api.takeawayRevisions.current({ takeawayId: id })
    ).toMatchObject({ keypoints: PENDING, status: "draft" });

    await api.takeawayRevisions.setStatus({
      status: "discarded",
      takeawayId: id,
    });

    expect(await liveRow(id)).toMatchObject({ keypoints: LIVE });
    expect(await api.takeawayRevisions.current({ takeawayId: id })).toBeNull();
    expect(
      (await anonymousCaller().takeaways.getTakeawayById({ id })).takeaways
        .revisedAt
    ).toBeNull();

    // The next save starts a new correction from the live text.
    await api.takeawayTldr.save({ id, tldr: "Again" });
    expect(
      await api.takeawayRevisions.current({ takeawayId: id })
    ).toMatchObject({ keypoints: LIVE, status: "draft", tldr: "Again" });
    expect((await revisionRows(id)).map((row) => row.status).sort()).toEqual([
      "discarded",
      "draft",
    ]);
  });

  it("only lets the writer and staff correct, and only staff publish", async () => {
    const subject = await published();
    const { api, id, schedule } = subject;
    const otherWriter = callerFor((await writer("Other")).id);
    const member = callerFor((await insertUser()).id);

    await expect(
      otherWriter.takeaways.updateTakeaway({
        contributors: [],
        id,
        keypoints: PENDING,
        scheduleId: schedule.id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      otherWriter.takeawayTldr.save({ id, tldr: PENDING_TLDR })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await revisionRows(id)).toEqual([]);

    // Staff may start a correction of any published takeaway.
    await subject.mita.takeawayTldr.save({ id, tldr: PENDING_TLDR });
    expect(await revisionRows(id)).toHaveLength(1);

    // Other writers read a correction in draft too: it is the shared draft.
    expect(
      await otherWriter.takeawayRevisions.current({ takeawayId: id })
    ).toMatchObject({ status: "draft", tldr: PENDING_TLDR });
    await expect(
      member.takeawayRevisions.current({ takeawayId: id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api.takeawayRevisions.setStatus({ status: "published", takeawayId: id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await api.takeawayRevisions.setStatus({
      status: "in_review",
      takeawayId: id,
    });
    expect(
      await otherWriter.takeawayRevisions.current({ takeawayId: id })
    ).toMatchObject({ status: "in_review", tldr: PENDING_TLDR });
    await expect(
      api.takeawayRevisions.setStatus({ status: "published", takeawayId: id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      otherWriter.takeawayRevisions.setStatus({
        status: "discarded",
        takeawayId: id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // A submitted correction is locked until it is withdrawn.
    await expect(
      api.takeawayTldr.save({ id, tldr: "Locked" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await api.takeawayRevisions.setStatus({ status: "draft", takeawayId: id });

    // A published takeaway itself still can't be deleted or moved elsewhere.
    await expect(api.takeaways.deleteTakeaway({ id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      api.takeaways.updateTakeaway({
        contributors: [],
        id,
        keypoints: PENDING,
        scheduleId: schedule.id + 1,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses moves the correction can't make", async () => {
    const subject = await published();
    const { api, id, mita } = subject;
    await expect(
      api.takeawayRevisions.setStatus({ status: "in_review", takeawayId: id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await correct(subject);
    await expect(
      mita.takeawayRevisions.setStatus({ status: "published", takeawayId: id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api.takeawayRevisions.setStatus({ status: "in_review", takeawayId: 404 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("points comments and suggestions on a correction at its text, not the live one", async () => {
    const subject = await published();
    const { api, author, id } = subject;
    await correct(subject);
    const reviewerId = (await writer("Reviewer")).id;
    const reviewer = callerFor(reviewerId);

    await reviewer.takeawayComments.add({
      body: "Which son?",
      quote: "a son",
      takeawayId: id,
    });
    await reviewer.takeawaySuggestions.add({
      original: "a son",
      replacement: "Isaac",
      takeawayId: id,
    });
    // A passage only in the live text can't be suggested against.
    const { suggestions } = await callerFor(author.id).takeawaySuggestions.list(
      { takeawayId: id }
    );
    expect(suggestions).toEqual([
      expect.objectContaining({ applies: true, original: "a son" }),
    ]);
    const [revision] = await revisionRows(id);
    const [comment] = await testDb.select().from(takeawayComments);
    const [suggestion] = await testDb.select().from(takeawaySuggestions);
    expect(comment?.revisionId).toBe(revision?.id);
    expect(suggestion?.revisionId).toBe(revision?.id);

    await api.takeawaySuggestions.accept({ id: suggestion?.id ?? 0 });

    expect(
      await api.takeawayRevisions.current({ takeawayId: id })
    ).toMatchObject({
      keypoints: "Abraham trusted God through the long wait for Isaac.",
    });
    expect(await liveRow(id)).toMatchObject({ keypoints: LIVE });
  });

  it("lists the correction with its moves and finds submitted corrections", async () => {
    const subject = await published();
    const { api, id, mita } = subject;
    const [before] = (await mita.takeaways.getManageable({})).items;
    expect(before?.revision).toBeNull();

    await correct(subject);
    const [draft] = (await api.takeaways.getManageable({})).items;
    expect(draft).toMatchObject({
      canManage: false,
      revision: { status: "draft" },
      takeaways: { preview: LIVE, status: "published" },
    });
    expect(draft?.revision?.actions.map((action) => action.label)).toEqual([
      "Submit changes to mita",
      "Discard changes",
    ]);

    await api.takeawayRevisions.setStatus({
      status: "in_review",
      takeawayId: id,
    });
    const inReview = (
      await mita.takeaways.getManageable({ status: "in_review" })
    ).items;
    expect(inReview.map((row) => row.takeaways.id)).toEqual([id]);
    expect(
      inReview[0]?.revision?.actions.map((action) => action.label)
    ).toEqual(["Publish changes", "Request changes", "Discard changes"]);
  });

  it("carries an open correction into the draft when mita unpublishes", async () => {
    const subject = await published();
    const { api, id, mita } = subject;
    await correct(subject);

    await mita.takeaways.setStatus({ id, status: "draft" });

    expect(await liveRow(id)).toMatchObject({
      keypoints: PENDING,
      status: "draft",
      tldr: PENDING_TLDR,
    });
    expect(await revisionRows(id)).toEqual([]);
    expect(await api.takeawayRevisions.current({ takeawayId: id })).toBeNull();
  });
});
