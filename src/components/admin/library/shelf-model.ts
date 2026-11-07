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
  if (event.subject) {
    parts.push(
      event.type === "added" || event.type === "edited"
        ? `lent by ${event.subject}`
        : `for ${event.subject}`
    );
  }
  return { detail: parts.join(" · "), title: eventLabel(event.type) };
}
