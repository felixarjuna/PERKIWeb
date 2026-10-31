import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { settings } from "~/lib/db/schema/schema";
import { SETTING_KEYS } from "~/lib/settings";
import {
  carriedOverSource,
  type DocsSource,
  parseDocsSources,
} from "~/lib/takeaway-sources";
import { db } from "~/server";

type Database = Pick<typeof db, "execute" | "insert" | "select">;

/**
 * Before sources existed, Settings held one notes and one TL;DR document.
 * The first read without a `takeaway_sources` row stores that pair as the
 * first source, so nothing set up in production is lost. The old keys are
 * only read here, and left in place for the release still running beside
 * this one during a deploy.
 */
async function carryOver(tx: Database) {
  const legacy = await tx
    .select({
      key: settings.key,
      updatedById: settings.updatedById,
      value: settings.value,
    })
    .from(settings)
    .where(
      inArray(settings.key, [
        SETTING_KEYS.takeawayNotesDocId,
        SETTING_KEYS.takeawayTldrDocId,
      ])
    );
  const notes = legacy.find(
    (row) => row.key === SETTING_KEYS.takeawayNotesDocId
  );
  const tldr = legacy.find((row) => row.key === SETTING_KEYS.takeawayTldrDocId);
  const first = carriedOverSource(
    { notesDocId: notes?.value, tldrDocId: tldr?.value },
    randomUUID(),
    new Date()
  );
  if (!first) {
    return [];
  }
  // Two first reads at once: only one insert wins, and both return the winner.
  await tx
    .insert(settings)
    .values({
      key: SETTING_KEYS.takeawaySources,
      updatedById: notes?.updatedById ?? null,
      value: JSON.stringify([first]),
    })
    .onConflictDoNothing();
  return (await readStored(tx)) ?? [];
}

async function readStored(tx: Database) {
  const [row] = await tx
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, SETTING_KEYS.takeawaySources));
  return row ? parseDocsSources(row.value) : null;
}

/** The sources "Import from Docs" can read, in the order staff added them. */
export async function takeawaySources(
  tx: Database = db
): Promise<DocsSource[]> {
  return (await readStored(tx)) ?? carryOver(tx);
}

/** One source by id, or null when there's no such source. */
export async function takeawaySource(id: string) {
  return (await takeawaySources()).find((source) => source.id === id) ?? null;
}

/**
 * Changes the list under a lock, so two staff editing at once can't drop
 * each other's change. An empty list is stored too, so removing every
 * source never brings the old documents back.
 */
export function updateTakeawaySources(
  updatedById: string,
  change: (sources: DocsSource[]) => DocsSource[]
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${SETTING_KEYS.takeawaySources}))`
    );
    const next = change(await takeawaySources(tx));
    const value = JSON.stringify(next);
    await tx
      .insert(settings)
      .values({ key: SETTING_KEYS.takeawaySources, updatedById, value })
      .onConflictDoUpdate({
        set: { updatedAt: new Date(), updatedById, value },
        target: settings.key,
      });
    return next;
  });
}
