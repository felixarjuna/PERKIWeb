import { TRPCError } from "@trpc/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { localDay } from "~/lib/schedule-team";
import { SETTING_KEYS } from "~/lib/settings";
import {
  planDocsImport,
  type TakeawaySource,
  type TextChange,
} from "~/lib/takeaway-import";
import { parseTakeawaySource } from "~/lib/takeaway-source";
import { preselectedSource } from "~/lib/takeaway-sources";
import { db } from "~/server";
import { docHtml } from "~/server/google-docs";
import { getSetting, setSetting } from "~/server/settings";
import { takeawaySource, takeawaySources } from "~/server/takeaway-sources";
import { adminProcedure, createTRPCRouter } from "../trpc";

type Database = Pick<typeof db, "select">;

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

const sourceInput = z.object({ sourceId: z.string() });

/** No TL;DR document: every TL;DR counts as missing, so stored ones stay. */
const NO_TLDRS: TakeawaySource = { entries: [], instructions: "" };

/**
 * The source's documents, read again on every call so nothing depends on a
 * stale preview.
 */
async function readDocs(sourceId: string) {
  const source = await takeawaySource(sourceId);
  if (!source) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message:
        "This source isn't in Settings → Takeaways anymore. Pick another one.",
    });
  }
  const [notes, tldr] = await Promise.all([
    readDoc(source.notesDocId, "notes document"),
    source.tldrDocId
      ? readDoc(source.tldrDocId, "TL;DR document")
      : Promise.resolve(NO_TLDRS),
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
  preview: adminProcedure.input(sourceInput).query(async ({ input }) => {
    const entries = await planDocs(db, await readDocs(input.sourceId));
    return { entries };
  }),
  /**
   * Adds a draft for every new date and replaces the notes and TL;DR of
   * changed takeaways that aren't published, all or nothing. Nothing is
   * deleted; published takeaways are never touched.
   */
  run: adminProcedure.input(sourceInput).mutation(async ({ ctx, input }) => {
    const docs = await readDocs(input.sourceId);
    const result = await db.transaction(async (tx) => {
      // Plan under the same lock as the writes, so two imports can't both add a draft.
      await tx.execute(
        sql`lock table ${takeaways} in share row exclusive mode`
      );
      let added = 0;
      let updated = 0;
      for (const entry of await planDocs(tx, docs)) {
        const replaces = (field: TextChange["field"]) =>
          entry.changes.some((change) => change.field === field);
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
              ...(replaces("notes") && entry.notes
                ? { keypoints: entry.notes }
                : {}),
              ...(replaces("tldr") ? { tldr: entry.tldr } : {}),
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
    await setSetting(
      SETTING_KEYS.takeawayLastSourceId,
      input.sourceId,
      ctx.session.user.id
    );
    return result;
  }),
  /** The sources to pick from, and the one the picker starts on. */
  sources: adminProcedure.query(async () => {
    const [sources, lastUsed] = await Promise.all([
      takeawaySources(),
      getSetting(SETTING_KEYS.takeawayLastSourceId),
    ]);
    return {
      selected: preselectedSource(sources, lastUsed),
      sources: sources.map(({ id, label }) => ({ id, label })),
    };
  }),
});
