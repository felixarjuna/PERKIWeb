import type { SheetSchedule } from "./schedule-sheet";
import { localDay } from "./schedule-team";

/** Fields the sheet owns. Title and description are only set on new schedules, so edits made on the site survive a re-import. */
export const SYNCED_FIELDS = [
  "type",
  "preacher",
  "leader",
  "musician",
  "multimedia",
  "accommodation",
  "noteWriter",
  "cookingGroup",
  "cleaningGroup",
  "bibleVerse",
] as const;
type SyncedField = (typeof SYNCED_FIELDS)[number];

export interface StoredSchedule extends Record<SyncedField, string | null> {
  date: Date;
  id: number;
}

export interface FieldChange {
  field: SyncedField;
  from: string;
  to: string;
}

export type ImportEntry =
  | { schedule: SheetSchedule; status: "new" }
  | {
      changes: FieldChange[];
      id: number;
      schedule: SheetSchedule;
      status: "changed" | "unchanged";
    };

const text = (value: string | null | undefined) => value?.trim() ?? "";

/**
 * Pairs each sheet row with the stored schedule on the same day (preferring
 * the same event type) and lists what the import would change. An empty
 * Bible verse in the sheet keeps the stored one; empty slots clear the slot.
 */
export function planImport(
  rows: SheetSchedule[],
  stored: StoredSchedule[]
): ImportEntry[] {
  const byDay = new Map<string, StoredSchedule[]>();
  for (const schedule of stored) {
    const day = localDay(schedule.date);
    byDay.set(day, [...(byDay.get(day) ?? []), schedule]);
  }
  return rows.map((row) => {
    const candidates = byDay.get(row.day) ?? [];
    const match =
      candidates.find((schedule) => schedule.type === row.type) ??
      candidates.at(0);
    if (!match) {
      return { schedule: row, status: "new" };
    }
    const changes = SYNCED_FIELDS.flatMap((field): FieldChange[] => {
      const from = text(match[field]);
      const to = text(row[field]);
      if (from === to || (field === "bibleVerse" && to === "")) {
        return [];
      }
      return [{ field, from, to }];
    });
    return {
      changes,
      id: match.id,
      schedule: row,
      status: changes.length > 0 ? "changed" : "unchanged",
    };
  });
}
