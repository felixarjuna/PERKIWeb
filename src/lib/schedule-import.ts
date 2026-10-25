import { FLAG_LABELS, orderedFlags } from "./schedule-flags";
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
  cancelled: boolean;
  date: Date;
  description: string;
  flags: string[];
  id: number;
}

/** Midnight is what dates without a time were stored as. */
const NO_TIME = "00:00";

export interface FieldChange {
  /**
   * `time`: a stored schedule without a time gets the default start.
   * `description`: an internal note an earlier import made public is replaced.
   * `cancelled`: the sheet calls the date off (every slot "-") or plans it again.
   * `flags`: the sheet names flags the schedule doesn't have yet.
   */
  field: SyncedField | "time" | "description" | "cancelled" | "flags";
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

const planned = (cancelled: boolean) => (cancelled ? "Cancelled" : "Planned");
const flagList = (flags: readonly string[]) =>
  orderedFlags(flags)
    .map((flag) => FLAG_LABELS[flag])
    .join(", ");

/**
 * Whether the gathering is called off, and flags the sheet adds. A flag set
 * on the site is never removed by the sheet.
 */
function statusChanges(row: SheetSchedule, match: StoredSchedule) {
  const changes: FieldChange[] = [];
  if (row.cancelled !== match.cancelled) {
    changes.push({
      field: "cancelled",
      from: planned(match.cancelled),
      to: planned(row.cancelled),
    });
  }
  if (row.flags.some((flag) => !match.flags.includes(flag))) {
    changes.push({
      field: "flags",
      from: flagList(match.flags),
      to: flagList([...match.flags, ...row.flags]),
    });
  }
  return changes;
}

/**
 * Pairs each sheet row with the stored schedule on the same day (preferring
 * the same event type) and lists what the import would change. An empty
 * Bible verse in the sheet keeps the stored one; empty slots clear the slot,
 * except on a cancelled row, which only cancels.
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
    // A cancelled row has every slot empty; the stored team stays, so the
    // date can be planned again as it was.
    const slots = row.cancelled ? [] : SYNCED_FIELDS;
    const changes = slots.flatMap((field): FieldChange[] => {
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
    changes.push(...statusChanges(row, match));
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
