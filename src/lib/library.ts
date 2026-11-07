import { DateTime } from "luxon";

/**
 * The library's shared rules (#136): a book's state is derived from its open
 * loan and its reservations, never read from the cached `library_books.status`
 * alone, and every day is an Aachen calendar day (`yyyy-MM-dd`).
 */

/** Days a loan runs, and how far each extension moves the due date. */
export const LOAN_DAYS = 30;
/** Extensions a member may ask for themselves; staff can go past it. */
export const MAX_EXTENSIONS = 2;
/** Days a returned book waits for the first in line, counted from the return. */
export const HOLD_DAYS = 7;

/** Longest title, author, language and description staff can save. */
export const MAX_TITLE = 200;
export const MAX_AUTHOR = 200;
export const MAX_LANGUAGE = 50;
export const MAX_DESCRIPTION = 1000;

export const BOOK_STATUSES = [
  "offered",
  "available",
  "borrowed",
  "reserved",
  "withdrawn",
] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const RESERVATION_STATUSES = [
  "waiting",
  "ready",
  "fulfilled",
  "expired",
  "cancelled",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** What `library_events.type` records; both history views read them. */
export const LIBRARY_EVENT_TYPES = [
  "added",
  "edited",
  "offered",
  "accepted",
  "withdrawn",
  "restored",
  "borrowed",
  "extended",
  "returned",
  "queued",
  "left_queue",
  "ready",
  "expired",
  "cancelled",
] as const;
export type LibraryEventType = (typeof LIBRARY_EVENT_TYPES)[number];

const EVENT_LABELS: Record<LibraryEventType, string> = {
  accepted: "Accepted on the shelf",
  added: "Added to the library",
  borrowed: "Borrowed",
  cancelled: "Reservation cancelled",
  edited: "Details edited",
  expired: "Hold ran out",
  extended: "Loan extended",
  left_queue: "Left the queue",
  offered: "Offered to the library",
  queued: "Joined the queue",
  ready: "Reserved for the next in line",
  restored: "Brought back",
  returned: "Returned",
  withdrawn: "Withdrawn",
};

/** A history line's heading, e.g. "Withdrawn". */
export const eventLabel = (type: string) =>
  EVENT_LABELS[type as LibraryEventType] ?? type;

const ZONE = "Europe/Berlin";
const parse = (day: string) => DateTime.fromISO(day, { zone: ZONE });

/** `day` moved by `days` calendar days, as `yyyy-MM-dd`. */
export const addDays = (day: string, days: number) =>
  parse(day).plus({ days }).toISODate() ?? day;

/** The due date of a loan that starts on `today`. */
export const dueOnFrom = (today: string) => addDays(today, LOAN_DAYS);

/** Last day of a hold that starts on `readyOn` (the day it was returned). */
export const holdEndsOn = (readyOn: string) => addDays(readyOn, HOLD_DAYS);

/** A book is overdue from the day after its due date. */
export const isOverdue = (dueOn: string, today: string) => today > dueOn;

/** "7 Dec". */
export const dayLabel = (day: string) => parse(day).toFormat("d LLL");

export interface OpenLoan {
  dueOn: string;
  userId: string;
}

export interface ReservationLine {
  createdAt: Date;
  /** Last day of the hold; set once it's that member's turn. */
  expiresOn: string | null;
  id: number;
  status: ReservationStatus;
  userId: string;
}

export type BookState =
  | { kind: "offered" }
  | { kind: "withdrawn" }
  | { kind: "available"; queue: number }
  | {
      dueOn: string;
      holderId: string;
      kind: "borrowed";
      overdue: boolean;
      queue: number;
    }
  | {
      holdEndsOn: string;
      kind: "reserved";
      /** Waiting behind the member it's reserved for. */
      queue: number;
      reservedFor: string;
    };

export type BookKind = BookState["kind"];

const inLine = (reservation: ReservationLine) =>
  reservation.status === "waiting" || reservation.status === "ready";

/** The queue in order: the one whose turn it is, then by when they joined. */
export function queueOrder(reservations: readonly ReservationLine[]) {
  return reservations.filter(inLine).sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "ready" ? -1 : 1;
    }
    return a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id;
  });
}

/**
 * A book's state on `today`. Offered and withdrawn come from the book; the
 * rest from its open loan and queue. A hold that ran out passes to the next
 * in line for `HOLD_DAYS` from the day after, without anyone writing it, so
 * no scheduled job is needed; once the queue runs out the book is available.
 */
export function bookState(
  book: { status: BookStatus },
  openLoan: OpenLoan | null | undefined,
  reservations: readonly ReservationLine[],
  today: string
): BookState {
  if (book.status === "offered" || book.status === "withdrawn") {
    return { kind: book.status };
  }
  const line = queueOrder(reservations);
  if (openLoan) {
    return {
      dueOn: openLoan.dueOn,
      holderId: openLoan.userId,
      kind: "borrowed",
      overdue: isOverdue(openLoan.dueOn, today),
      queue: line.length,
    };
  }
  const [first] = line;
  // Nobody's turn has started: the queue waits for a return.
  if (!(first?.status === "ready" && first.expiresOn)) {
    return { kind: "available", queue: line.length };
  }
  let endsOn = first.expiresOn;
  for (const [index, reservation] of line.entries()) {
    if (index > 0) {
      endsOn = holdEndsOn(addDays(endsOn, 1));
    }
    if (today <= endsOn) {
      return {
        holdEndsOn: endsOn,
        kind: "reserved",
        queue: line.length - index - 1,
        reservedFor: reservation.userId,
      };
    }
  }
  return { kind: "available", queue: 0 };
}

/**
 * What a member may see of a book's state: never who holds it or whom it's
 * reserved for, only whether that is them.
 */
export interface MemberBookState {
  dueOn: string | null;
  holdEndsOn: string | null;
  kind: BookKind;
  mine: boolean;
  overdue: boolean;
}

export function memberBookState(
  state: BookState,
  viewerId: string
): MemberBookState {
  switch (state.kind) {
    case "borrowed": {
      const mine = state.holderId === viewerId;
      return {
        dueOn: state.dueOn,
        holdEndsOn: null,
        kind: "borrowed",
        mine,
        overdue: mine && state.overdue,
      };
    }
    case "reserved": {
      const mine = state.reservedFor === viewerId;
      return {
        dueOn: null,
        holdEndsOn: mine ? state.holdEndsOn : null,
        kind: "reserved",
        mine,
        overdue: false,
      };
    }
    default:
      return {
        dueOn: null,
        holdEndsOn: null,
        kind: state.kind,
        mine: false,
        overdue: false,
      };
  }
}

/** The chip a member sees, e.g. "Borrowed until 7 Dec". */
export function stateLabel(state: MemberBookState): string {
  switch (state.kind) {
    case "borrowed":
      if (!state.dueOn) {
        return "Borrowed";
      }
      if (state.overdue) {
        return `Overdue since ${dayLabel(addDays(state.dueOn, 1))}`;
      }
      return state.mine
        ? `Yours until ${dayLabel(state.dueOn)}`
        : `Borrowed until ${dayLabel(state.dueOn)}`;
    case "reserved":
      return state.mine ? "Reserved for you" : "Reserved";
    case "offered":
      return "Offered";
    case "withdrawn":
      return "Withdrawn";
    default:
      return "Available";
  }
}

/** Whether the viewer could take the book now (it's free, or held for them). */
export const borrowableBy = (state: MemberBookState) =>
  state.kind === "available" || (state.kind === "reserved" && state.mine);

export const LIBRARY_SORTS = [
  "available",
  "title",
  "author",
  "recent",
] as const;
export type LibrarySort = (typeof LIBRARY_SORTS)[number];
export const SORT_LABELS: Record<LibrarySort, string> = {
  author: "Author",
  available: "Available first",
  recent: "Recently added",
  title: "Title",
};

export const LIBRARY_SHOWS = ["all", "available", "borrowed"] as const;
export type LibraryShow = (typeof LIBRARY_SHOWS)[number];
export const SHOW_LABELS: Record<LibraryShow, string> = {
  all: "All books",
  available: "Available",
  borrowed: "Borrowed",
};

/** Whether a book belongs under the member list's "Available" or "Borrowed". */
export function shownFor(state: MemberBookState, show: LibraryShow) {
  if (show === "available") {
    return borrowableBy(state);
  }
  if (show === "borrowed") {
    return (
      state.kind === "borrowed" || (state.kind === "reserved" && !state.mine)
    );
  }
  return true;
}

interface Sortable {
  addedAt: Date;
  author: string;
  id: number;
  state: MemberBookState;
  title: string;
}

const compareText = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

/** Free to take first, then out, then not on the shelf yet. */
const availability = (state: MemberBookState) => {
  if (borrowableBy(state)) {
    return 0;
  }
  if (state.kind === "offered") {
    return 2;
  }
  return state.kind === "withdrawn" ? 3 : 1;
};

/** Sorts a member list in place by `sort`, title as the tie-breaker. */
export function sortBooks<T extends Sortable>(books: T[], sort: LibrarySort) {
  const byTitle = (a: T, b: T) =>
    compareText(a.title, b.title) || compareText(a.author, b.author);
  return books.sort((a, b) => {
    switch (sort) {
      case "author":
        return compareText(a.author, b.author) || byTitle(a, b);
      case "recent":
        return b.addedAt.getTime() - a.addedAt.getTime() || b.id - a.id;
      case "title":
        return byTitle(a, b);
      default:
        return availability(a.state) - availability(b.state) || byTitle(a, b);
    }
  });
}

export interface LibraryFilters {
  q: string;
  show: LibraryShow;
  sort: LibrarySort;
}

export const NO_LIBRARY_FILTERS: LibraryFilters = {
  q: "",
  show: "all",
  sort: "available",
};

const oneOf = <T extends string>(
  values: readonly T[],
  value: string | null,
  fallback: T
): T =>
  (values as readonly string[]).includes(value ?? "") ? (value as T) : fallback;

/** The member list's filters from `?q=`, `?show=` and `?sort=`. */
export const libraryFiltersFrom = (
  params: URLSearchParams
): LibraryFilters => ({
  q: params.get("q") ?? "",
  show: oneOf(LIBRARY_SHOWS, params.get("show"), "all"),
  sort: oneOf(LIBRARY_SORTS, params.get("sort"), "available"),
});

/** The librarian's state filter; "shelf" is everything but withdrawn books. */
export const SHELF_STATES = [
  "shelf",
  "available",
  "borrowed",
  "overdue",
  "reserved",
  "offered",
  "withdrawn",
  "all",
] as const;
export type ShelfState = (typeof SHELF_STATES)[number];
export const SHELF_STATE_LABELS: Record<ShelfState, string> = {
  all: "Every book",
  available: "Available",
  borrowed: "Out",
  offered: "Offered",
  overdue: "Overdue",
  reserved: "Reserved",
  shelf: "In the library",
  withdrawn: "Withdrawn",
};

export const shelfStateOf = (value: string | null): ShelfState =>
  oneOf(SHELF_STATES, value, "shelf");

/** Whether a book matches the librarian's state filter. */
export function inShelfState(state: BookState, filter: ShelfState) {
  switch (filter) {
    case "all":
      return true;
    case "shelf":
      return state.kind !== "withdrawn";
    case "overdue":
      return state.kind === "borrowed" && state.overdue;
    default:
      return state.kind === filter;
  }
}
