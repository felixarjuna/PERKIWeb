import { eq } from "drizzle-orm";
import { z } from "zod";
import { groupTerms, servingPool, users } from "~/lib/db/schema/schema";
import { suggestAccount } from "~/lib/people";
import { localDay } from "~/lib/schedule-team";
import type { PoolRole, PoolScope, PoolStatus } from "~/lib/serving-pool";
import {
  parsePoolSheet,
  planPoolImport,
  type SheetPoolEntry,
  sheetPauseEnd,
} from "~/lib/serving-pool-sheet";
import { db } from "~/server";
import { sheetTabs, sheetValues } from "~/server/google-sheets";
import { resolveAccounts } from "~/server/people";
import { fromGoogle, requireSheetId } from "~/server/schedule-sheet";
import { scheduleSheetId } from "~/server/settings";
import { adminProcedure, createTRPCRouter } from "../trpc";

/** "List Pelayan 2026": the serving pool tab, one per year. */
const POOL_TAB = /^list pelayan\b/i;
const tabInput = z.object({ tab: z.string().min(1).max(100) });

/** Reads the tab and compares it with the pool. */
async function planTab(tab: string) {
  const sheetId = await requireSheetId();
  const values = await fromGoogle(() => sheetValues(sheetId, tab));
  const { asOf, entries } = parsePoolSheet(values);
  const today = localDay(new Date());
  const [accountFor, stored, terms] = await Promise.all([
    db.transaction((tx) =>
      resolveAccounts(
        tx,
        entries.map((entry) => entry.name)
      )
    ),
    db
      .select({
        id: servingPool.id,
        pausedUntil: servingPool.pausedUntil,
        pauseNote: servingPool.pauseNote,
        role: servingPool.role,
        scope: servingPool.scope,
        status: servingPool.status,
        userId: servingPool.userId,
      })
      .from(servingPool),
    db.select({ startsOn: groupTerms.startsOn }).from(groupTerms),
  ]);
  const pauseEnd = sheetPauseEnd(terms, today);
  const plan = planPoolImport({
    accountFor,
    entries,
    pauseEnd,
    stored: stored.map((row) => ({
      ...row,
      role: row.role as PoolRole,
      scope: row.scope as PoolScope,
      status: row.status as PoolStatus,
    })),
    today,
  });
  return { asOf, pauseEnd, plan };
}

/** The pool fields an entry from the sheet sets. */
const fieldsOf = (entry: SheetPoolEntry, pauseEnd: string) => ({
  pausedUntil: entry.paused ? pauseEnd : null,
  pauseNote: entry.note,
  scope: entry.scope,
  status: entry.status,
});

export const servingPoolImportRouter = createTRPCRouter({
  /**
   * What importing the tab would do, without writing anything: new entries,
   * changed fields, names without an account (with a suggested one) and
   * entries the tab doesn't list.
   */
  preview: adminProcedure.input(tabInput).query(async ({ input }) => {
    const { asOf, pauseEnd, plan } = await planTab(input.tab);
    const accounts = await db
      .select({ id: users.id, image: users.image, name: users.name })
      .from(users);
    const accountOf = (userId: string) => {
      const account = accounts.find((item) => item.id === userId);
      return {
        id: userId,
        image: account?.image ?? null,
        name: account?.name ?? "Unnamed account",
      };
    };
    return {
      added: plan.added.map(({ entry, userId }) => ({
        ...fieldsOf(entry, pauseEnd),
        name: entry.name,
        role: entry.role,
        row: entry.row,
        user: accountOf(userId),
      })),
      asOf,
      changed: plan.changed.map(({ changes, entry, id, userId }) => ({
        changes,
        id,
        name: entry.name,
        role: entry.role,
        row: entry.row,
        user: accountOf(userId),
      })),
      notInSheet: plan.notInSheet.map((entry) => ({
        id: entry.id,
        role: entry.role,
        user: accountOf(entry.userId),
      })),
      pauseEnd,
      repeated: plan.repeated.map((entry) => ({
        name: entry.name,
        role: entry.role,
        row: entry.row,
      })),
      unchanged: plan.unchanged,
      unmatched: plan.unmatched.map((item) => ({
        ...item,
        suggestion: suggestAccount(item.name, accounts),
      })),
    };
  }),
  /**
   * Imports the tab: adds new entries and updates changed ones, all or
   * nothing. The sheet is read again here, so the result never depends on a
   * stale preview; nobody is removed.
   */
  run: adminProcedure.input(tabInput).mutation(async ({ input }) => {
    const { pauseEnd, plan } = await planTab(input.tab);
    return db.transaction(async (tx) => {
      if (plan.added.length > 0) {
        await tx
          .insert(servingPool)
          .values(
            plan.added.map(({ entry, userId }) => ({
              ...fieldsOf(entry, pauseEnd),
              role: entry.role,
              userId,
            }))
          )
          .onConflictDoNothing();
      }
      for (const { changes, id } of plan.changed) {
        const set: Partial<typeof servingPool.$inferInsert> = {};
        for (const change of changes) {
          if (change.field === "scope") {
            set.scope = change.to;
          } else if (change.field === "status") {
            set.status = change.to;
          } else if (change.field === "pause") {
            set.pausedUntil = change.to;
          } else {
            set.pauseNote = change.to;
          }
        }
        // biome-ignore lint/performance/noAwaitInLoops: a transaction runs one query at a time.
        await tx.update(servingPool).set(set).where(eq(servingPool.id, id));
      }
      return { added: plan.added.length, updated: plan.changed.length };
    });
  }),
  /** Whether the import is set up, and the sheet's pool tabs (newest first). */
  status: adminProcedure.query(async () => {
    const sheetId = await scheduleSheetId();
    if (!sheetId) {
      return { configured: false as const, tabs: [] };
    }
    const tabs = await fromGoogle(() => sheetTabs(sheetId));
    return {
      configured: true as const,
      tabs: tabs
        .filter((tab) => POOL_TAB.test(tab))
        .sort()
        .reverse(),
    };
  }),
});
