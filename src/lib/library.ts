import { DateTime } from "luxon";

/**
 * The library's shared rules (#136): a book's state is derived from its open
 * loan and its reservations, never read from the cached `library_books.status`
 * alone, and every day is an Aachen calendar day (`yyyy-MM-dd`).
 */

/** Days a loan runs, and how far each extension moves the due date. */
export const LOAN_DAYS = 30;
/**
 * A member extends only in the last days before the due date: from
 * `dueOn` minus these days through `dueOn`, both ends included.
 */
export const EXTEND_WINDOW_DAYS = 3;
/** Extensions a member may ask for themselves; staff can go past it. */
export const MAX_EXTENSIONS = 2;
/** Days a returned book waits for the first in line, counted from the return. */
export const HOLD_DAYS = 7;

/** Longest title, author and description staff can save. */
export const MAX_TITLE = 200;
export const MAX_AUTHOR = 200;
export const MAX_DESCRIPTION = 1000;
/** Longest note staff keep on a loan when they set its due date. */
export const MAX_LOAN_NOTE = 300;

/**
 * The languages a book can be in (#145). `library_books.language` stores the
 * code; a value from before the list (free text) is still shown as typed.
 */
export const LIBRARY_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "id", name: "Bahasa Indonesia" },
] as const;
export const LANGUAGE_CODES = ["en", "de", "id"] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const isLanguageCode = (value: string): value is LanguageCode =>
  (LANGUAGE_CODES as readonly string[]).includes(value);

/**
 * How a stored language reads: its code (for the flag) and name, or an older
 * free-text value as it was typed, without a code. Null when the book has no
 * language.
 */
export const languageLabel = (
  stored: string | null
): { code: LanguageCode | null; name: string } | null => {
  const value = stored?.trim();
  if (!value) {
    return null;
  }
  const known = LIBRARY_LANGUAGES.find((language) => language.code === value);
  return known
    ? { code: known.code, name: known.name }
    : { code: null, name: value };
};

/** How a book is held: on the shelf, or an ebook its owner shares (#147). */
export const BOOK_FORMATS = ["physical", "ebook"] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];
export const FORMAT_LABELS: Record<BookFormat, string> = {
  ebook: "Ebook",
  physical: "Physical book",
};

/** Longest publisher and category staff can save. */
export const MAX_PUBLISHER = 120;
export const MAX_CATEGORY = 60;

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

/** What `library_history.type` records; both history views read them. */
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
  "fulfilled",
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
  fulfilled: "Reservation collected",
  left_queue: "Left the queue",
  offered: "Offered to the library",
  queued: "Joined the queue",
  ready: "Reserved for the next in line",
  restored: "Put back in the library",
  returned: "Returned",
  withdrawn: "Removed from the library",
};

/** A history line's heading, e.g. "Removed from the library". */
export const eventLabel = (type: string) =>
  EVENT_LABELS[type as LibraryEventType] ?? type;

const ZONE = "Europe/Berlin";
const parse = (day: string) => DateTime.fromISO(day, { zone: ZONE });

/** `day` moved by `days` calendar days, as `yyyy-MM-dd`. */
export const addDays = (day: string, days: number) =>
  parse(day).plus({ days }).toISODate() ?? day;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Whether `day` is a real calendar day written `yyyy-MM-dd` ("2026-02-30" isn't). */
export const isDay = (day: string) => ISO_DAY.test(day) && parse(day).isValid;

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
  /** An ebook on the list: never lent from the shelf, members ask its owner. */
  | { kind: "ebook" }
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

/** What `settleQueue` changes: holds that ran out, and whose turn starts. */
export interface QueueSettlement {
  expire: number[];
  ready: { expiresOn: string; id: number; userId: string } | null;
}

/**
 * What a book's queue needs written on `today` once nobody has the book: a
 * ready hold that ran out expires, and when nobody's hold is running the
 * first in line gets theirs for `HOLD_DAYS` from today. Applied lazily, when
 * the book is next read or written, so no scheduled job is needed.
 */
export function settleQueue(
  reservations: readonly ReservationLine[],
  today: string
): QueueSettlement {
  const line = queueOrder(reservations);
  const [first] = line;
  if (!first) {
    return { expire: [], ready: null };
  }
  const running = first.status === "ready" && (first.expiresOn ?? "") >= today;
  if (running) {
    return { expire: [], ready: null };
  }
  const expire = line
    .filter((reservation) => reservation.status === "ready")
    .map((reservation) => reservation.id);
  const next = line.find((reservation) => reservation.status === "waiting");
  return {
    expire,
    ready: next
      ? { expiresOn: holdEndsOn(today), id: next.id, userId: next.userId }
      : null,
  };
}

/** Why an ebook can't be borrowed, queued for or lent by hand. */
export const EBOOK_REFUSAL = "Ebooks aren't lent from the shelf.";

/**
 * The status cached on `library_books` for a derived state. An ebook keeps
 * "available", so the stored status stays within the statuses the previous
 * release knows.
 */
export const cachedStatus = (state: BookState): BookStatus =>
  state.kind === "ebook" ? "available" : state.kind;

/**
 * A book's state on `today`. Offered and withdrawn come from the book; the
 * rest from its open loan and queue. Without a loan, the queue reads as
 * `settleQueue` would leave it, so a hold that ran out shows as the next
 * person's turn even before anyone has written it.
 */
export function bookState(
  book: { format?: string; status: BookStatus },
  openLoan: OpenLoan | null | undefined,
  reservations: readonly ReservationLine[],
  today: string
): BookState {
  if (book.status === "offered" || book.status === "withdrawn") {
    return { kind: book.status };
  }
  if (book.format === "ebook") {
    return { kind: "ebook" };
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
  const settled = settleQueue(line, today);
  const expired = new Set(settled.expire);
  const left = line.filter((reservation) => !expired.has(reservation.id));
  const [first] = left;
  const turn = settled.ready ?? (first?.status === "ready" ? first : null);
  if (!turn?.expiresOn) {
    return { kind: "available", queue: 0 };
  }
  return {
    holdEndsOn: turn.expiresOn,
    kind: "reserved",
    queue: left.length - 1,
    reservedFor: turn.userId,
  };
}

/** The member's place among those still waiting (1 = next), or null. */
export function queuePosition(
  reservations: readonly ReservationLine[],
  userId: string
) {
  const waiting = queueOrder(reservations).filter(
    (reservation) => reservation.status === "waiting"
  );
  const index = waiting.findIndex(
    (reservation) => reservation.userId === userId
  );
  return index === -1 ? null : index + 1;
}

/**
 * Where `userId` stands for a book in its derived `state`: the hold that's
 * theirs, or their place among those still waiting behind it. Reads the
 * queue as `bookState` does, so a run-out hold nobody has written yet
 * already counts as passed on.
 */
export function placeInLine(
  state: BookState,
  reservations: readonly ReservationLine[],
  userId: string
): { holdEndsOn: string | null; position: number | null } {
  const turn = state.kind === "reserved" ? state.reservedFor : null;
  if (turn === userId && state.kind === "reserved") {
    return { holdEndsOn: state.holdEndsOn, position: null };
  }
  const waiting = queueOrder(reservations).filter(
    (reservation) =>
      reservation.status === "waiting" && reservation.userId !== turn
  );
  const index = waiting.findIndex(
    (reservation) => reservation.userId === userId
  );
  return { holdEndsOn: null, position: index === -1 ? null : index + 1 };
}

const ORDINAL_TEENS = new Set([11, 12, 13]);
const ORDINAL_SUFFIXES: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };

/** "1st in line", "2nd in line", "11th in line". */
export function inLineLabel(position: number) {
  const suffix = ORDINAL_TEENS.has(position % 100)
    ? "th"
    : (ORDINAL_SUFFIXES[position % 10] ?? "th");
  return `${position}${suffix} in line`;
}

/**
 * Why a member can't join a book's queue, or null when they can: only a book
 * someone else has or has held for them, once per member.
 */
export function joinRefusal(
  state: BookState,
  viewerId: string,
  queued: boolean
): string | null {
  switch (state.kind) {
    case "borrowed":
      if (state.holderId === viewerId) {
        return "You have this book.";
      }
      break;
    case "reserved":
      if (state.reservedFor === viewerId) {
        return "It's reserved for you. Borrow it at the shelf.";
      }
      break;
    case "available":
      return "It's on the shelf. Borrow it there.";
    case "ebook":
      return EBOOK_REFUSAL;
    case "offered":
      return "This book isn't on the shelf yet.";
    default:
      return "This book has left the library.";
  }
  return queued ? "You're already in line for this book." : null;
}

/**
 * What a member may see of a book's state: never who holds it or whom it's
 * reserved for, only whether that is them.
 */
export interface MemberBookState {
  /**
   * For an ebook only: the account name of the member who shares it, or null
   * when PERKI owns it (ask the librarian). Never set for a physical book, so
   * the member list names no other owner.
   */
  askName: string | null;
  dueOn: string | null;
  holdEndsOn: string | null;
  kind: BookKind;
  mine: boolean;
  overdue: boolean;
  /** The viewer's place in the queue (1 = next), or null when not waiting. */
  position: number | null;
}

export function memberBookState(
  state: BookState,
  viewerId: string,
  position: number | null = null,
  /** The ebook's owner's account name; ignored for any other book. */
  ownerName: string | null = null
): MemberBookState {
  switch (state.kind) {
    case "borrowed": {
      const mine = state.holderId === viewerId;
      return {
        askName: null,
        dueOn: state.dueOn,
        holdEndsOn: null,
        kind: "borrowed",
        mine,
        overdue: mine && state.overdue,
        position,
      };
    }
    case "reserved": {
      const mine = state.reservedFor === viewerId;
      return {
        askName: null,
        dueOn: null,
        holdEndsOn: mine ? state.holdEndsOn : null,
        kind: "reserved",
        mine,
        overdue: false,
        position: mine ? null : position,
      };
    }
    default:
      return {
        askName: state.kind === "ebook" ? ownerName : null,
        dueOn: null,
        holdEndsOn: null,
        kind: state.kind,
        mine: false,
        overdue: false,
        position: null,
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
      if (state.mine) {
        return state.holdEndsOn
          ? `Reserved for you · until ${dayLabel(state.holdEndsOn)}`
          : "Reserved for you";
      }
      return "Reserved";
    case "offered":
      return "Offered";
    case "ebook":
      return `Ebook · ask ${state.askName ?? "the librarian"}`;
    case "withdrawn":
      return "Removed";
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
  if (state.kind === "ebook") {
    return 2;
  }
  if (state.kind === "offered") {
    return 3;
  }
  return state.kind === "withdrawn" ? 4 : 1;
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
  borrowed: "Borrowed",
  offered: "Offered",
  overdue: "Overdue",
  reserved: "Reserved",
  shelf: "In the library",
  withdrawn: "Removed from library",
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

/** The new due date when a loan due on `dueOn` is extended once. */
export const extendedDueOn = (dueOn: string) => addDays(dueOn, LOAN_DAYS);

/**
 * Why a book can't be borrowed now, or null when it can: a book on the shelf
 * with no open loan, or one held for `borrowerId`.
 */
export function borrowRefusal(
  state: BookState,
  borrowerId?: string
): string | null {
  switch (state.kind) {
    case "available":
      return null;
    case "borrowed":
      return "Someone has borrowed this book. Ask the librarian if you have it in hand.";
    case "reserved":
      return state.reservedFor === borrowerId
        ? null
        : "This book is held for the next in line.";
    case "ebook":
      return EBOOK_REFUSAL;
    case "offered":
      return "This book isn't on the shelf yet.";
    default:
      return "This book has left the library.";
  }
}

export interface LoanLine {
  dueOn: string;
  extensions: number;
  userId: string;
}

/**
 * Why the member can't extend this loan themselves, or null when they can:
 * only the holder, not after the due date, only in the last
 * `EXTEND_WINDOW_DAYS` days before it, at most `MAX_EXTENSIONS` times, and
 * not while anyone waits in the queue (`waiting`). Staff can go past it.
 */
export function extendRefusal(
  loan: LoanLine,
  viewerId: string,
  today: string,
  waiting = 0
): string | null {
  if (loan.userId !== viewerId) {
    return "Only the member who has the book can extend it.";
  }
  if (isOverdue(loan.dueOn, today)) {
    return "It's past the due date. Ask the librarian.";
  }
  const opensOn = addDays(loan.dueOn, -EXTEND_WINDOW_DAYS);
  if (today < opensOn) {
    return `You can extend from ${dayLabel(opensOn)}.`;
  }
  if (loan.extensions >= MAX_EXTENSIONS) {
    return `Already extended ${MAX_EXTENSIONS} times. Ask the librarian.`;
  }
  if (waiting > 0) {
    return "Someone is waiting for this book.";
  }
  return null;
}

/** What a member reads under a book they hold: "Due 7 Dec" or "Overdue since 8 Dec". */
export const dueLabel = (dueOn: string, today: string) =>
  isOverdue(dueOn, today)
    ? `Overdue since ${dayLabel(addDays(dueOn, 1))}`
    : `Due ${dayLabel(dueOn)}`;

/** "1 extension left", "No extensions left". */
export function extensionsLeftLabel(extensions: number) {
  const left = Math.max(0, MAX_EXTENSIONS - extensions);
  if (left === 0) {
    return "No extensions left";
  }
  return `${left} ${left === 1 ? "extension" : "extensions"} left`;
}

/** The hint a member sees on a book they offered, until it's accepted. */
export const OFFERED_HINT =
  "Hand it to the librarian; it appears once accepted.";

/** Where a lender's book is: "Borrowed by Budi until 7 Dec", "On the shelf", … */
export function lentLabel(
  book: {
    dueOn: string | null;
    holder: string | null;
    kind: BookKind;
    overdue: boolean;
  },
  today: string
) {
  switch (book.kind) {
    case "borrowed": {
      const holder = book.holder ?? "a member";
      if (!book.dueOn) {
        return `Borrowed by ${holder}`;
      }
      return book.overdue || isOverdue(book.dueOn, today)
        ? `Overdue since ${dayLabel(addDays(book.dueOn, 1))}, borrowed by ${holder}`
        : `Borrowed by ${holder} until ${dayLabel(book.dueOn)}`;
    }
    case "reserved":
      return "Held for the next in line";
    case "offered":
      return `Offered. ${OFFERED_HINT}`;
    case "ebook":
      return "Ebook: members ask you for it";
    case "withdrawn":
      return "Removed from the library";
    default:
      return "On the shelf";
  }
}
