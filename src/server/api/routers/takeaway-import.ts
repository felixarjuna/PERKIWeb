import { TRPCError } from "@trpc/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { localDay } from "~/lib/schedule-team";
import { SETTING_KEYS } from "~/lib/settings";
import {
  parseTakeawaySource,
  planDocsImport,
  type TakeawaySource,
} from "~/lib/takeaway-import";
import { db } from "~/server";
import { docHtml } from "~/server/google-docs";
import { getSettings } from "~/server/settings";
import { adminProcedure, createTRPCRouter } from "../trpc";

type Database = Pick<typeof db, "select">;

async function docIds() {
  const values = await getSettings([
    SETTING_KEYS.takeawayNotesDocId,
    SETTING_KEYS.takeawayTldrDocId,
  ]);
  const notes = values[SETTING_KEYS.takeawayNotesDocId];
  const tldr = values[SETTING_KEYS.takeawayTldrDocId];
  return notes && tldr ? { notes, tldr } : null;
}

/** Reads one document from Google and parses it into dated entries. */
async function readDoc(docId: string, name: string): Promise<TakeawaySource> {
  const html = await docHtml(docId).catch((error: unknown) => {
    throw new TRPCError({
      cause: error,
      code: "BAD_GATEWAY",
      message: `The ${name} couldn't be read from Google. Try again.`,
    });
  });
  return Promise.resolve(html)
    .then(parseTakeawaySource)
    .catch((error: unknown) => {
      throw new TRPCError({
        cause: error,
        code: "BAD_REQUEST",
        message: `The ${name} can't be imported: ${error instanceof Error ? error.message : "unreadable"}`,
      });
    });
}

/** Both documents, read again on every call so nothing depends on a stale preview. */
async function readDocs() {
  const ids = await docIds();
  if (!ids) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "The notes and TL;DR documents aren't set. Add their links on the Settings page.",
    });
  }
  const [notes, tldr] = await Promise.all([
    readDoc(ids.notes, "notes document"),
    readDoc(ids.tldr, "TL;DR document"),
  ]);
  return { notes, tldr };
}

/** Compares the documents with every gathering and its takeaways. */
async function planDocs(
  tx: Database,
  docs: { notes: TakeawaySource; tldr: TakeawaySource }
) {
  const [gatherings, stored] = await Promise.all([
    tx
      .select({
        date: schedules.date,
        id: schedules.id,
        title: schedules.title,
        type: schedules.type,
      })
      .from(schedules),
    tx
      .select({
        id: takeaways.id,
        keypoints: takeaways.keypoints,
        scheduleId: takeaways.scheduleId,
        status: takeaways.status,
        tldr: takeaways.tldr,
      })
      .from(takeaways),
  ]);
  const plan = planDocsImport(
    docs.notes,
    docs.tldr,
    gatherings.map((gathering) => ({
      day: localDay(gathering.date),
      id: gathering.id,
    })),
    stored
  );
  return plan.map((entry) => ({
    ...entry,
    gathering:
      gatherings.find((candidate) => candidate.id === entry.scheduleId) ?? null,
  }));
}

export const takeawayImportRouter = createTRPCRouter({
  /** What importing the documents would do, without writing anything. */
  preview: adminProcedure.query(async () => {
    const entries = await planDocs(db, await readDocs());
    return { entries };
  }),
  /**
   * Adds a draft for every new date and replaces the notes and TL;DR of
   * changed takeaways that aren't published, all or nothing. Nothing is
   * deleted; published takeaways are never touched.
   */
  run: adminProcedure.mutation(async () => {
    const docs = await readDocs();
    return db.transaction(async (tx) => {
      // Plan under the same lock as the writes, so two imports can't both add a draft.
      await tx.execute(
        sql`lock table ${takeaways} in share row exclusive mode`
      );
      let added = 0;
      let updated = 0;
      for (const entry of await planDocs(tx, docs)) {
        if (entry.status === "new" && entry.scheduleId && entry.notes) {
          // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
          await tx.insert(takeaways).values({
            contributors: [],
            keypoints: entry.notes,
            scheduleId: entry.scheduleId,
            status: "draft",
            tldr: entry.tldr,
          });
          added += 1;
        } else if (entry.status === "changed" && entry.takeawayId) {
          await tx
            .update(takeaways)
            .set({
              ...(entry.changes.includes("notes") && entry.notes
                ? { keypoints: entry.notes }
                : {}),
              ...(entry.changes.includes("tldr") ? { tldr: entry.tldr } : {}),
            })
            .where(
              and(
                eq(takeaways.id, entry.takeawayId),
                ne(takeaways.status, "published")
              )
            );
          updated += 1;
        }
      }
      return { added, updated };
    });
  }),
  /** Whether both documents are set. */
  status: adminProcedure.query(async () => ({
    configured: (await docIds()) !== null,
  })),
});
