import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { schedules } from "~/lib/db/schema/schema";
import { planImport } from "~/lib/schedule-import";
import { parseScheduleSheet, type SheetSchedule } from "~/lib/schedule-sheet";
import { db } from "~/server";
import { sheetTabs, sheetValues } from "~/server/google-sheets";
import { insertSchedule, syncAssignments } from "~/server/schedule-assignments";
import { scheduleSheetId } from "~/server/settings";
import { adminProcedure, createTRPCRouter } from "../trpc";

const YEAR_TAB = /^\d{4}$/;
const tabInput = z.object({ tab: z.string().min(1).max(100) });

async function requireSheetId() {
  const id = await scheduleSheetId();
  if (!id) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No schedule sheet is set. Add its link on the Settings page.",
    });
  }
  return id;
}

/** Calls Google and turns its failures into one readable error. */
const fromGoogle = <T>(request: () => Promise<T>): Promise<T> =>
  request().catch((error: unknown) => {
    throw new TRPCError({
      cause: error,
      code: "BAD_GATEWAY",
      message: "The schedule sheet couldn't be read from Google. Try again.",
    });
  });

/** Reads a tab and compares it with the stored schedules. */
async function planTab(tab: string) {
  const sheetId = await requireSheetId();
  const values = await fromGoogle(() => sheetValues(sheetId, tab));
  const { schedules: rows, skipped } = parseScheduleSheet(values);
  const stored = await db
    .select({
      accommodation: schedules.accommodation,
      bibleVerse: schedules.bibleVerse,
      cleaningGroup: schedules.cleaningGroup,
      cookingGroup: schedules.cookingGroup,
      date: schedules.date,
      id: schedules.id,
      leader: schedules.leader,
      multimedia: schedules.multimedia,
      musician: schedules.musician,
      noteWriter: schedules.noteWriter,
      preacher: schedules.preacher,
      type: schedules.type,
    })
    .from(schedules);
  return { entries: planImport(rows, stored), skipped };
}

/** The columns the sheet owns, with empty optional slots stored as null. */
const syncedColumns = (row: SheetSchedule) => ({
  accommodation: row.accommodation || null,
  cleaningGroup: row.cleaningGroup,
  cookingGroup: row.cookingGroup || null,
  leader: row.leader,
  multimedia: row.multimedia || null,
  musician: row.musician,
  noteWriter: row.noteWriter,
  preacher: row.preacher || null,
  type: row.type,
  ...(row.bibleVerse ? { bibleVerse: row.bibleVerse } : {}),
});

export const scheduleImportRouter = createTRPCRouter({
  /** What importing the tab would do, without writing anything. */
  preview: adminProcedure.input(tabInput).query(async ({ input }) => {
    const { entries, skipped } = await planTab(input.tab);
    return {
      entries: entries.map((entry) => ({
        changes: entry.status === "new" ? [] : entry.changes,
        day: entry.schedule.day,
        row: entry.schedule.row,
        schedule: entry.schedule,
        status: entry.status,
      })),
      skipped,
    };
  }),
  /**
   * Imports the tab: adds new dates and updates changed ones, all or nothing.
   * The sheet is read again here, so the result never depends on a stale preview.
   */
  run: adminProcedure.input(tabInput).mutation(async ({ input }) => {
    const { entries } = await planTab(input.tab);
    return db.transaction(async (tx) => {
      let added = 0;
      let updated = 0;
      for (const entry of entries) {
        const row = entry.schedule;
        if (entry.status === "new") {
          // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
          await insertSchedule(tx, {
            ...syncedColumns(row),
            bibleVerse: row.bibleVerse,
            date: row.date,
            description: row.description,
            title: row.title,
          });
          added += 1;
        } else if (entry.status === "changed") {
          const columns = syncedColumns(row);
          const setsTime = entry.changes.some(
            (change) => change.field === "time"
          );
          await tx
            .update(schedules)
            .set(setsTime ? { ...columns, date: row.date } : columns)
            .where(eq(schedules.id, entry.id));
          await syncAssignments(tx, entry.id, columns);
          updated += 1;
        }
      }
      return { added, updated };
    });
  }),
  /** Whether the import is set up, and the sheet's year tabs (newest first). */
  status: adminProcedure.query(async () => {
    const sheetId = await scheduleSheetId();
    if (!sheetId) {
      return { configured: false as const, tabs: [] };
    }
    const tabs = await fromGoogle(() => sheetTabs(sheetId));
    return {
      configured: true as const,
      tabs: tabs
        .filter((tab) => YEAR_TAB.test(tab))
        .sort()
        .reverse(),
    };
  }),
});
