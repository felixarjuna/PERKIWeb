import { DateTime } from "luxon";
import {
  type PoolRole,
  type PoolScope,
  type PoolStatus,
  poolStatus,
  scopesFor,
} from "./serving-pool";

/** One person in one role, read from the sheet's "List Pelayan" tab. */
export interface SheetPoolEntry {
  /** The name without its bracket notes, used to find the account. */
  name: string;
  /** Bracket notes and the Notes column that don't map to a field. */
  note: string | null;
  /** Marked "stop dlu", "pause" or "praktikum". */
  paused: boolean;
  role: PoolRole;
  /** Sheet row number (1-based) for messages. */
  row: number;
  scope: PoolScope;
  status: PoolStatus;
}

/**
 * The tab's role columns. "Litur/PA Besar" leads both the service (liturgist)
 * and PA Besar (leader); "Puding" is publication and documentation.
 */
const ROLE_COLUMNS: Record<string, "lead" | PoolRole> = {
  akomodasi: "accommodation",
  catatan: "note_writer",
  "litur/pa besar": "lead",
  musiker: "musician",
  puding: "publication",
  techniker: "multimedia",
};

const BRACKETS = /\(([^)]*)\)/g;
const WHITESPACE = /\s+/g;
const STAND = /^stand\s+(\d{1,2}\.\d{1,2}\.\d{4})$/i;
const BIBLE_STUDY = /\bpa\s*besar\b/i;
const SERVICE = /\bibadah\b/i;
const BACKUP = /\bcadangan\b/i;
const PAUSED = /\b(stop|pause|praktikum)\b/i;

const headerKey = (value: string | undefined) =>
  (value ?? "").trim().toLowerCase();

const tidy = (value: string) => value.replace(WHITESPACE, " ").trim();

interface Notes {
  paused: boolean;
  scopes: Set<PoolScope>;
  status: PoolStatus;
  /** Pieces that aren't a scope or status, kept as the private note. */
  text: string[];
}

/** Sorts a cell's bracket notes and its Notes column into pool fields. */
function readNotes(pieces: string[]): Notes {
  const notes: Notes = {
    paused: false,
    scopes: new Set(),
    status: "active",
    text: [],
  };
  for (const piece of pieces.map(tidy).filter(Boolean)) {
    if (BIBLE_STUDY.test(piece)) {
      notes.scopes.add("bible_study");
    } else if (SERVICE.test(piece)) {
      notes.scopes.add("church_service");
    } else if (BACKUP.test(piece)) {
      notes.status = "backup";
    } else {
      // A pause keeps its reason ("praktikum") as the note, like any other text.
      notes.paused ||= PAUSED.test(piece);
      notes.text.push(piece);
    }
  }
  return notes;
}

/** The entries one written cell stands for: a leader can be one or two. */
function entriesFor(
  column: "lead" | PoolRole,
  notes: Notes
): { role: PoolRole; scope: PoolScope }[] {
  if (column === "lead") {
    const both = notes.scopes.size !== 1;
    return [
      ...(both || notes.scopes.has("bible_study")
        ? [{ role: "leader" as const, scope: "bible_study" as const }]
        : []),
      ...(both || notes.scopes.has("church_service")
        ? [{ role: "liturgist" as const, scope: "church_service" as const }]
        : []),
    ];
  }
  const allowed = scopesFor(column);
  const scope = notes.scopes.size === 1 ? [...notes.scopes][0] : allowed[0];
  return [
    {
      role: column,
      scope: scope && allowed.includes(scope) ? scope : (allowed[0] ?? "both"),
    },
  ];
}

interface RoleColumn {
  column: number;
  notes?: number;
  role: "lead" | PoolRole;
}

/** The role columns a header row names, each with its Notes column. */
const readHeader = (cells: string[]): RoleColumn[] =>
  cells.flatMap((cell, column) => {
    const role = ROLE_COLUMNS[headerKey(cell)];
    if (!role) {
      return [];
    }
    const notes =
      headerKey(cells[column + 1]) === "notes" ? column + 1 : undefined;
    return [{ column, notes, role }];
  });

/** The entries one written cell stands for, with its notes read. */
function readCell(
  cells: string[],
  { column, notes: notesColumn, role }: RoleColumn,
  row: number
): SheetPoolEntry[] {
  const written = cells[column] ?? "";
  const name = tidy(written.replace(BRACKETS, " "));
  if (!name) {
    return [];
  }
  const notes = readNotes([
    ...[...written.matchAll(BRACKETS)].map((match) => match[1] ?? ""),
    notesColumn === undefined ? "" : (cells[notesColumn] ?? ""),
  ]);
  return entriesFor(role, notes).map((entry) => ({
    ...entry,
    name,
    note: notes.text.length > 0 ? notes.text.join(" · ") : null,
    paused: notes.paused,
    row,
    status: notes.status,
  }));
}

/**
 * Reads the "List Pelayan" tab as it is kept by hand: a "Stand" date on top,
 * a header row naming each role with a "Notes" column after it, and one
 * person per cell below, with notes in brackets: (PA besar) serves only at
 * the Bible study, (Ibadah) only at the service, (cadangan) is a backup, and
 * "stop dlu", "pause" or "praktikum" pause them. Anything else is kept as the
 * note.
 */
export function parsePoolSheet(values: string[][]): {
  asOf: string | null;
  entries: SheetPoolEntry[];
} {
  let asOf: string | null = null;
  let columns: RoleColumn[] = [];
  const entries: SheetPoolEntry[] = [];

  for (const [index, cells] of values.entries()) {
    const stand = cells
      .map((cell) => STAND.exec(cell.trim())?.[1])
      .find(Boolean);
    const header = readHeader(cells);
    if (stand) {
      asOf = DateTime.fromFormat(stand, "d.M.yyyy").toISODate();
    } else if (header.length > 0) {
      columns = header;
    } else {
      entries.push(
        ...columns.flatMap((column) => readCell(cells, column, index + 1))
      );
    }
  }
  return { asOf, entries };
}

/** A pool entry as stored. */
export interface StoredPoolEntry {
  id: number;
  pausedUntil: string | null;
  pauseNote: string | null;
  role: PoolRole;
  scope: PoolScope;
  status: PoolStatus;
  userId: string;
}

export type PoolChange =
  | { field: "scope"; from: PoolScope; to: PoolScope }
  | { field: "status"; from: PoolStatus; to: PoolStatus }
  | { field: "pause"; from: string | null; to: string }
  | { field: "note"; from: string | null; to: string };

export interface PlannedEntry {
  entry: SheetPoolEntry;
  userId: string;
}

export interface PoolImportPlan {
  added: PlannedEntry[];
  changed: (PlannedEntry & { changes: PoolChange[]; id: number })[];
  /** Pool entries the tab doesn't list; an import leaves them as they are. */
  notInSheet: StoredPoolEntry[];
  /** A second line for an account and role already listed above it. */
  repeated: SheetPoolEntry[];
  unchanged: number;
  /** Sheet names with no account yet; their entries aren't imported. */
  unmatched: { name: string; roles: PoolRole[]; rows: number[] }[];
}

/**
 * How long a pause from the sheet lasts, since the sheet gives no end: until
 * the next group term starts, or six months when none is planned yet. Staff
 * can change it on the pool page; a later import doesn't move it.
 */
export function sheetPauseEnd(terms: { startsOn: string }[], today: string) {
  const next = terms
    .map((term) => term.startsOn)
    .filter((start) => start > today)
    .sort()
    .at(0);
  const end = next
    ? DateTime.fromISO(next).minus({ days: 1 })
    : DateTime.fromISO(today).plus({ months: 6 }).minus({ days: 1 });
  return end.toISODate() ?? today;
}

function changesFor(
  entry: SheetPoolEntry,
  stored: StoredPoolEntry,
  today: string,
  pauseEnd: string
): PoolChange[] {
  const changes: PoolChange[] = [];
  if (entry.scope !== stored.scope) {
    changes.push({ field: "scope", from: stored.scope, to: entry.scope });
  }
  if (entry.status !== stored.status) {
    changes.push({ field: "status", from: stored.status, to: entry.status });
  }
  // A pause is only started, never ended: one set on the pool page runs to
  // its own date, and a pause from the sheet ends on its own.
  if (entry.paused && poolStatus(stored, today) !== "paused") {
    changes.push({ field: "pause", from: stored.pausedUntil, to: pauseEnd });
  }
  if (entry.note && entry.note !== stored.pauseNote) {
    changes.push({ field: "note", from: stored.pauseNote, to: entry.note });
  }
  return changes;
}

/**
 * Compares the tab with the pool: who would be added, whose entry would
 * change, names without an account, and entries the tab no longer lists.
 * Nothing is ever removed.
 */
export function planPoolImport({
  accountFor,
  entries,
  pauseEnd,
  stored,
  today,
}: {
  accountFor: (name: string) => string | undefined;
  entries: SheetPoolEntry[];
  pauseEnd: string;
  stored: StoredPoolEntry[];
  today: string;
}): PoolImportPlan {
  const plan: PoolImportPlan = {
    added: [],
    changed: [],
    notInSheet: [],
    repeated: [],
    unchanged: 0,
    unmatched: [],
  };
  const seen = new Set<string>();
  for (const entry of entries) {
    const userId = accountFor(entry.name);
    if (!userId) {
      const unmatched = plan.unmatched.find((item) => item.name === entry.name);
      if (unmatched) {
        unmatched.roles.push(entry.role);
        unmatched.rows.push(entry.row);
      } else {
        plan.unmatched.push({
          name: entry.name,
          roles: [entry.role],
          rows: [entry.row],
        });
      }
      continue;
    }
    const key = `${userId} ${entry.role}`;
    if (seen.has(key)) {
      plan.repeated.push(entry);
      continue;
    }
    seen.add(key);
    const current = stored.find(
      (item) => item.userId === userId && item.role === entry.role
    );
    if (!current) {
      plan.added.push({ entry, userId });
      continue;
    }
    const changes = changesFor(entry, current, today, pauseEnd);
    if (changes.length > 0) {
      plan.changed.push({ changes, entry, id: current.id, userId });
    } else {
      plan.unchanged += 1;
    }
  }
  plan.notInSheet = stored.filter(
    (item) => !seen.has(`${item.userId} ${item.role}`)
  );
  return plan;
}
