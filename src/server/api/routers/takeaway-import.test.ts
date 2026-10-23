import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { schedules, settings, takeaways } from "~/lib/db/schema/schema";
import { SETTING_KEYS } from "~/lib/settings";
import { callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";
import { NOTES, notesDoc, TLDRS, tldrDoc } from "~/test/fixtures/takeaway-docs";

const google = vi.hoisted(() => ({
  docs: {} as Record<string, string>,
  failing: false,
}));
vi.mock("~/server/google-docs", () => ({
  docHtml: vi.fn((id: string) =>
    google.failing
      ? Promise.reject(new Error("Google Docs answered 500."))
      : Promise.resolve(google.docs[id] ?? "")
  ),
}));

const admin = async () => callerFor((await insertUser({ role: "mita" })).id);

/** A gathering at 15:30 in Aachen on `day`. */
const gathering = async (day: string, title = "Kebaktian") => {
  const [row] = await testDb
    .insert(schedules)
    .values({
      bibleVerse: "Habakuk 1",
      cleaningGroup: "Group 1",
      date: new Date(`${day}T13:30:00Z`),
      description: "",
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

const statuses = (preview: { entries: { day: string; status: string }[] }) =>
  preview.entries.map((entry) => [entry.day, entry.status]);

describe("takeaway import router", () => {
  beforeEach(async () => {
    google.failing = false;
    google.docs = { "notes-doc": notesDoc(NOTES), "tldr-doc": tldrDoc(TLDRS) };
    await testDb.insert(settings).values([
      { key: SETTING_KEYS.takeawayNotesDocId, value: "notes-doc" },
      { key: SETTING_KEYS.takeawayTldrDocId, value: "tldr-doc" },
    ]);
  });

  it("is off until both documents are set", async () => {
    await testDb
      .delete(settings)
      .where(eq(settings.key, SETTING_KEYS.takeawayTldrDocId));
    const api = await admin();
    expect(await api.takeawayImport.status()).toEqual({ configured: false });
    await expect(api.takeawayImport.preview()).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("is for staff only", async () => {
    const writer = callerFor((await insertUser({ role: "writer" })).id);
    await expect(writer.takeawayImport.preview()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(writer.takeawayImport.run()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("previews without writing, imports drafts, and a second run changes nothing", async () => {
    const first = await gathering("2026-01-03");
    await gathering("2026-01-10");
    await gathering("2026-06-06");
    const api = await admin();

    const preview = await api.takeawayImport.preview();
    expect(statuses(preview)).toEqual([
      ["2026-01-03", "new"],
      ["2026-01-10", "new"],
      ["2026-06-07", "skipped"],
    ]);
    expect(preview.entries[0]).toMatchObject({
      gathering: { id: first.id, title: "Kebaktian" },
      heading: NOTES[0]?.heading,
    });
    expect(preview.entries[2]?.reason).toBe("No gathering on this date");
    expect(await testDb.select().from(takeaways)).toEqual([]);

    expect(await api.takeawayImport.run()).toEqual({ added: 2, updated: 0 });
    const stored = await testDb
      .select()
      .from(takeaways)
      .where(eq(takeaways.scheduleId, first.id));
    expect(stored).toEqual([
      expect.objectContaining({
        authorId: null,
        contributors: [],
        publishedAt: null,
        status: "draft",
      }),
    ]);
    expect(stored[0]?.keypoints).toContain(
      "God hears the **honest** question."
    );
    expect(stored[0]?.tldr).toContain("Bring God your **honest** questions");

    expect(statuses(await api.takeawayImport.preview())).toEqual([
      ["2026-01-03", "unchanged"],
      ["2026-01-10", "unchanged"],
      ["2026-06-07", "skipped"],
    ]);
    expect(await api.takeawayImport.run()).toEqual({ added: 0, updated: 0 });
    expect(await testDb.select().from(takeaways)).toHaveLength(2);
  });

  it("updates unpublished takeaways and never overwrites a published one", async () => {
    const draft = await gathering("2026-01-03");
    const published = await gathering("2026-01-10");
    const api = await admin();
    await api.takeawayImport.run();
    await testDb
      .update(takeaways)
      .set({ publishedAt: new Date(), status: "published" })
      .where(eq(takeaways.scheduleId, published.id));

    google.docs["notes-doc"] = notesDoc(
      NOTES.map((entry) => ({
        ...entry,
        paragraphs: [...entry.paragraphs, "A paragraph added later."],
      }))
    );
    const preview = await api.takeawayImport.preview();
    expect(
      preview.entries.map((entry) => [entry.day, entry.status, entry.changes])
    ).toEqual([
      ["2026-01-03", "changed", ["notes"]],
      ["2026-01-10", "published", []],
      ["2026-06-07", "skipped", []],
    ]);

    expect(await api.takeawayImport.run()).toEqual({ added: 0, updated: 1 });
    const [updated] = await testDb
      .select()
      .from(takeaways)
      .where(eq(takeaways.scheduleId, draft.id));
    expect(updated?.keypoints).toContain("A paragraph added later.");
    const [kept] = await testDb
      .select()
      .from(takeaways)
      .where(eq(takeaways.scheduleId, published.id));
    expect(kept?.keypoints).not.toContain("A paragraph added later.");
    expect(kept?.status).toBe("published");
  });

  it("explains a document Google can't open or the parser can't read", async () => {
    const api = await admin();
    google.failing = true;
    await expect(api.takeawayImport.preview()).rejects.toMatchObject({
      code: "BAD_GATEWAY",
    });
    google.failing = false;
    google.docs["tldr-doc"] = notesDoc([
      { heading: "03-01-2026 Twice", paragraphs: ["One"] },
      { heading: "03-01-2026 Twice", paragraphs: ["Two"] },
    ]);
    await expect(api.takeawayImport.preview()).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("TL;DR document"),
    });
  });
});
