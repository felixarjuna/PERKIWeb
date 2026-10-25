import { eq } from "drizzle-orm";
import { z } from "zod";
import { schedules, speakers, users } from "~/lib/db/schema/schema";
import { orderedFlags } from "~/lib/schedule-flags";
import { type ImportEntry, planImport } from "~/lib/schedule-import";
import { parseScheduleSheet, type SheetSchedule } from "~/lib/schedule-sheet";
import { type Slot, slotsFromSchedule } from "~/lib/schedule-team";
import { db } from "~/server";
import { sheetTabs, sheetValues } from "~/server/google-sheets";
import { resolveAccounts } from "~/server/people";
import {
  insertSchedule,
  syncAssignments,
  type Transaction,
} from "~/server/schedule-assignments";
import { fromGoogle, requireSheetId } from "~/server/schedule-sheet";
import { scheduleSheetId } from "~/server/settings";
import { resolveSpeakers } from "~/server/speakers";
import { adminProcedure, createTRPCRouter } from "../trpc";

const YEAR_TAB = /^\d{4}$/;
const tabInput = z.object({ tab: z.string().min(1).max(100) });

/** Reads a tab and compares it with the stored schedules. */
async function planTab(tab: string) {
  const sheetId = await requireSheetId();
  const values = await fromGoogle(() => sheetValues(sheetId, tab));
  const { schedules: rows, skipped } = parseScheduleSheet(values);
  const stored = await db
    .select({
      accommodation: schedules.accommodation,
      bibleVerse: schedules.bibleVerse,
      cancelled: schedules.cancelled,
      cleaningGroup: schedules.cleaningGroup,
      cookingGroup: schedules.cookingGroup,
      date: schedules.date,
      description: schedules.description,
      flags: schedules.flags,
      id: schedules.id,
      leader: schedules.leader,
      multimedia: schedules.multimedia,
      musician: schedules.musician,
      noteWriter: schedules.noteWriter,
      preacher: schedules.preacher,
      type: schedules.type,
    })
    .from(schedules);
  return { entries: planImport(rows, stored), skipped, stored };
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

/**
 * Each row's team as it would appear on the schedule: members with their
 * account photo, preachers with their speaker photo. Staff-only, like the
 * preview itself.
 */
async function previewTeams(rows: SheetSchedule[]) {
  const slotsOf = (row: SheetSchedule) => slotsFromSchedule(row);
  const names = rows.flatMap((row) =>
    slotsOf(row)
      .filter((slot) => slot.role !== "preacher")
      .map((slot) => slot.name)
  );
  const [userIdFor, speakerFor] = await db.transaction((tx) =>
    Promise.all([resolveAccounts(tx, names), resolveSpeakers(tx)])
  );
  const [accounts, speakerRows] = await Promise.all([
    db.select({ id: users.id, image: users.image }).from(users),
    db.select({ id: speakers.id, photoUrl: speakers.photoUrl }).from(speakers),
  ]);
  const imageOf = (slot: Slot) => {
    if (slot.role === "preacher") {
      const id = speakerFor(slot.name);
      return speakerRows.find((speaker) => speaker.id === id)?.photoUrl ?? null;
    }
    const id = userIdFor(slot.name);
    return accounts.find((account) => account.id === id)?.image ?? null;
  };
  return (row: SheetSchedule) =>
    slotsOf(row).map((slot) => ({ ...slot, image: imageOf(slot) }));
}

type ChangedEntry = Exclude<ImportEntry, { status: "new" }>;

/**
 * Writes a changed row onto its stored schedule. A cancelled row keeps the
 * stored team, so the date can be planned again as it was; flags set on the
 * site stay, and the sheet only adds its own.
 */
async function updateFromSheet(
  tx: Transaction,
  entry: ChangedEntry,
  storedFlags: readonly string[]
) {
  const row = entry.schedule;
  const columns = row.cancelled ? null : syncedColumns(row);
  const changes = (field: string) =>
    entry.changes.some((change) => change.field === field);
  await tx
    .update(schedules)
    .set({
      ...columns,
      cancelled: row.cancelled,
      flags: orderedFlags([...storedFlags, ...row.flags]),
      ...(changes("time") ? { date: row.date } : {}),
      ...(changes("description") ? { description: row.description } : {}),
    })
    .where(eq(schedules.id, entry.id));
  if (columns) {
    await syncAssignments(tx, entry.id, columns);
  }
}

export const scheduleImportRouter = createTRPCRouter({
  /** What importing the tab would do, without writing anything. */
  preview: adminProcedure.input(tabInput).query(async ({ input }) => {
    const { entries, skipped } = await planTab(input.tab);
    const teamOf = await previewTeams(entries.map((entry) => entry.schedule));
    return {
      entries: entries.map((entry) => ({
        changes: entry.status === "new" ? [] : entry.changes,
        day: entry.schedule.day,
        row: entry.schedule.row,
        schedule: entry.schedule,
        status: entry.status,
        team: teamOf(entry.schedule),
      })),
      skipped,
    };
  }),
  /**
   * Imports the tab: adds new dates and updates changed ones, all or nothing.
   * The sheet is read again here, so the result never depends on a stale preview.
   */
  run: adminProcedure.input(tabInput).mutation(async ({ input }) => {
    const { entries, stored } = await planTab(input.tab);
    const flagsOf = (id: number) =>
      stored.find((schedule) => schedule.id === id)?.flags ?? [];
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
            cancelled: row.cancelled,
            date: row.date,
            description: row.description,
            flags: row.flags,
            title: row.title,
          });
          added += 1;
        } else if (entry.status === "changed") {
          await updateFromSheet(tx, entry, flagsOf(entry.id));
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
