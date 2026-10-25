import { DateTime } from "luxon";
import { SCHEDULE_FLAGS, type ScheduleFlag } from "./schedule-flags";
import { startOn } from "./schedule-team";

/** Gatherings happen in Aachen; a sheet date is that calendar day there. */
const ZONE = "Europe/Berlin";
const DATE_PATTERN = /^\d{1,2}\.\d{1,2}\.\d{4}$/;

/** A schedule read from one row of a year tab ("2026", "2025", …). */
export interface SheetSchedule {
  accommodation: string;
  bibleVerse: string;
  /** Every slot is "-": the gathering is called off. */
  cancelled: boolean;
  cleaningGroup: string;
  cookingGroup: string;
  date: Date;
  /** `yyyy-MM-dd` in Aachen, used to match the row with a stored schedule. */
  day: string;
  /** Public: the 2025 "Event Description", or the 2026 "Events" note. */
  description: string;
  /** Event flags named in the row's notes (Holy Communion, online, Putzdienst). */
  flags: ScheduleFlag[];
  /**
   * What an earlier import wrote as the description when the row has
   * internal "Special notes" (null when it has none). The import replaces it,
   * so those notes stop being public.
   */
  formerDescription: string | null;
  leader: string;
  multimedia: string;
  musician: string;
  noteWriter: string;
  preacher: string;
  /** Sheet row number (1-based) for messages. */
  row: number;
  title: string;
  type: "church_service" | "bible_study";
}

export interface SkippedRow {
  day: string;
  reason: string;
  row: number;
}

const EVENT_TYPES: Record<string, SheetSchedule["type"]> = {
  kebaktian: "church_service",
  "penelaahan alkitab": "bible_study",
};

/** Slot columns; a row with none of them filled has nothing planned. */
const SLOT_COLUMNS = [
  "preacher",
  "leader",
  "liturgis",
  "musik",
  "multimedia",
  "akomodasi",
  "catatan",
  "masak",
  "piket",
];

/** How the sheet's notes name each flag. */
const FLAG_WORDS: Record<ScheduleFlag, RegExp> = {
  communion: /perjamuan|holy communion|abendmahl/i,
  online: /\bonline\b|\bzoom\b/i,
  putzdienst: /putzdienst/i,
};

/** The flags a row's notes name; only the flag is read, never the note. */
const flagsIn = (notes: string[]) =>
  SCHEDULE_FLAGS.filter((flag) =>
    notes.some((note) => FLAG_WORDS[flag].test(note))
  );

/** The sheet writes "-" (or nothing) for an empty slot. */
const clean = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  return trimmed === "-" ? "" : trimmed;
};

const headerKey = (value: string) => value.trim().toLowerCase();

/** Reads one dated row: a schedule, or the reason it's skipped. */
function readRow(
  cells: string[],
  columns: Map<string, number>,
  row: number
): { schedule: SheetSchedule } | { skipped: SkippedRow } {
  const raw = (name: string) => {
    const column = columns.get(name);
    return column === undefined ? "" : (cells[column]?.trim() ?? "");
  };
  const cell = (name: string) => clean(raw(name));
  const dateText = cells[0]?.trim() ?? "";
  const date = DateTime.fromFormat(dateText, "d.M.yyyy", { zone: ZONE });
  const day = date.toISODate();
  if (!(date.isValid && day)) {
    return {
      skipped: { day: dateText, reason: "The date can't be read.", row },
    };
  }
  const event = cell("acara");
  const type = EVENT_TYPES[event.toLowerCase()];
  if (!type) {
    const reason = event
      ? `"${event}" isn't a service or Bible study, so it isn't imported.`
      : "The row has no event.";
    return { skipped: { day, reason, row } };
  }
  // "-" in every slot means the date is called off; nothing at all means
  // it isn't planned yet.
  const cancelled = SLOT_COLUMNS.every((name) => cell(name) === "");
  if (cancelled && !SLOT_COLUMNS.some((name) => raw(name) === "-")) {
    return {
      skipped: { day, reason: "Nothing is planned on this date.", row },
    };
  }
  const description = cell("event description") || cell("events");
  const specialNotes = cell("special notes");
  return {
    schedule: {
      accommodation: cell("akomodasi"),
      bibleVerse: cell("bible verse") || cell("tema kotbah"),
      cancelled,
      cleaningGroup: cell("piket"),
      cookingGroup: cell("masak"),
      date: startOn({ day: date.day, month: date.month, year: date.year }),
      day,
      // "Special notes" are for the team (who's away, reminders) and never
      // become the public description.
      description,
      flags: flagsIn([cell("events"), cell("event description"), specialNotes]),
      formerDescription:
        specialNotes && !cell("event description")
          ? [cell("events"), specialNotes].filter(Boolean).join(" · ")
          : null,
      leader: type === "church_service" ? cell("liturgis") : cell("leader"),
      multimedia: cell("multimedia"),
      musician: cell("musik"),
      noteWriter: cell("catatan"),
      preacher: cell("preacher"),
      row,
      title: cell("event title") || event,
      type,
    },
  };
}

/**
 * Reads a year tab as it is kept by hand: header rows repeat every quarter,
 * blank rows separate months, and the group list sits below the dates. Columns
 * are found by their header, because the layout changes between years (2025
 * has "Event Title" and "Bible verse"; 2026 has "Events" and "Tema Kotbah").
 */
export function parseScheduleSheet(values: string[][]): {
  schedules: SheetSchedule[];
  skipped: SkippedRow[];
} {
  const schedules: SheetSchedule[] = [];
  const skipped: SkippedRow[] = [];
  let columns: Map<string, number> | undefined;

  for (const [index, cells] of values.entries()) {
    const first = cells[0]?.trim() ?? "";
    if (headerKey(first) === "tanggal") {
      // Repeated header rows can be shorter (2026 drops "Tema Kotbah" after
      // the first one), so a header only updates the columns it names.
      columns = new Map([
        ...(columns ?? []),
        ...cells.flatMap((header, column): [string, number][] =>
          headerKey(header) ? [[headerKey(header), column]] : []
        ),
      ]);
    } else if (columns && DATE_PATTERN.test(first)) {
      const result = readRow(cells, columns, index + 1);
      if ("schedule" in result) {
        schedules.push(result.schedule);
      } else {
        skipped.push(result.skipped);
      }
    }
  }
  return { schedules, skipped };
}
