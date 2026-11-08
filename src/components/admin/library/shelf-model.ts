import { addDays, type BookKind, dayLabel, eventLabel } from "~/lib/library";

/** What staff see of a book's lending, holder included. */
export interface ShelfLending {
  dueOn: string | null;
  holdEndsOn: string | null;
  holder: string | null;
  kind: BookKind;
  overdue: boolean;
  queue: number;
}

/**
 * "Out with Ana until 7 Dec · 2 waiting"; "" when the badge says it all (a
 * free book nobody waits for, a withdrawn one).
 */
export function shelfLabel(book: ShelfLending): string {
  const waiting = book.queue > 0 ? ` · ${book.queue} waiting` : "";
  const holder = book.holder ?? "a member";
  switch (book.kind) {
    case "borrowed":
      if (!book.dueOn) {
        return `Out with ${holder}${waiting}`;
      }
      return book.overdue
        ? `Overdue since ${dayLabel(addDays(book.dueOn, 1))}, with ${holder}${waiting}`
        : `Out with ${holder} until ${dayLabel(book.dueOn)}${waiting}`;
    case "reserved":
      return `Held for ${holder}${book.holdEndsOn ? ` until ${dayLabel(book.holdEndsOn)}` : ""}${waiting}`;
    case "offered":
      return "Offered, not on the shelf yet";
    case "withdrawn":
      return "";
    default:
      return book.queue > 0 ? `${book.queue} waiting` : "";
  }
}

/** Why staff can't withdraw a book now: one that's out needs its return first. */
export const withdrawRefusal = (book: Pick<ShelfLending, "kind">) =>
  book.kind === "borrowed" ? "Mark it returned before withdrawing it." : null;

/**
 * Whether staff can lend a book by hand: one on the shelf, or one held for
 * a member (who came without a phone), which the server lends only to them.
 */
export const lendsByHand = (kind: BookKind) =>
  kind === "available" || kind === "reserved";

/** The Lend dialog's first line. */
export const lendHint = (book: Pick<ShelfLending, "holder" | "kind">) =>
  book.kind === "reserved"
    ? `It's held for ${book.holder ?? "the next in line"}: lend it to them only.`
    : "For a member who can't tap Borrow themselves.";

const FIELD_LABELS: Record<string, string> = {
  author: "author",
  description: "description",
  language: "language",
  ownerId: "owner",
  title: "title",
};

export interface HistoryEvent {
  actor: string | null;
  details: Record<string, unknown>;
  subject: string | null;
  type: string;
}

const subjectPhrase: Record<string, string> = {
  accepted: "lent by",
  added: "lent by",
  borrowed: "to",
  edited: "lent by",
  returned: "from",
};

/** Things members do for themselves, so their name is said once. */
const SELF_SERVICE = new Set([
  "borrowed",
  "extended",
  "fulfilled",
  "left_queue",
  "offered",
  "queued",
]);

const text = (value: unknown) => (typeof value === "string" ? value : null);

/** A history line: its heading and the who/what under it. */
export function historyLine(event: HistoryEvent) {
  const parts: string[] = [];
  if (event.actor) {
    parts.push(`by ${event.actor}`);
  }
  const changed = Array.isArray(event.details.changed)
    ? event.details.changed.map((field) => FIELD_LABELS[String(field)] ?? field)
    : [];
  if (event.type === "edited" && changed.length > 0) {
    parts.push(`changed ${changed.join(", ")}`);
  }
  // A member borrowing or extending for themselves is said once.
  const self = event.subject === event.actor && SELF_SERVICE.has(event.type);
  if (event.subject && !self) {
    parts.push(`${subjectPhrase[event.type] ?? "for"} ${event.subject}`);
  }
  const dueOn = text(event.details.dueOn);
  if (dueOn && event.type === "borrowed") {
    parts.push(`due ${dayLabel(dueOn)}`);
  }
  if (dueOn && event.type === "extended") {
    parts.push(`until ${dayLabel(dueOn)}`);
  }
  const expiresOn = text(event.details.expiresOn);
  if (expiresOn && event.type === "ready") {
    parts.push(`until ${dayLabel(expiresOn)}`);
  }
  const note = text(event.details.note);
  if (note) {
    parts.push(`“${note}”`);
  }
  const byHand = event.type === "borrowed" && event.details.byHand === true;
  return {
    detail: parts.join(" · "),
    title: byHand ? "Lent by hand" : eventLabel(event.type),
  };
}
