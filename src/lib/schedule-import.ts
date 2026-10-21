import type { SheetSchedule } from "./schedule-sheet";
import { localDay, localTime } from "./schedule-team";

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
  description: string;
  id: number;
}

/** Midnight is what dates without a time were stored as. */
const NO_TIME = "00:00";

export interface FieldChange {
  /**
   * `time`: a stored schedule without a time gets the default start.
   * `description`: an internal note an earlier import made public is replaced.
   */
  field: SyncedField | "time" | "description";
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
 * A schedule stored without a time (00:00) gets the default start; a time
 * set on the site is kept.
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
    if (
      row.formerDescription !== null &&
      text(match.description) === row.formerDescription
    ) {
      changes.push({
        field: "description",
        from: match.description,
        to: row.description,
      });
    }
    const storedTime = localTime(match.date);
    if (storedTime === NO_TIME && localTime(row.date) !== NO_TIME) {
      changes.push({
        field: "time",
        from: storedTime,
        to: localTime(row.date),
      });
    }
    return {
      changes,
      id: match.id,
      schedule: row,
      status: changes.length > 0 ? "changed" : "unchanged",
    };
  });
}
