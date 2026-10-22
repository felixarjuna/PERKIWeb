import {
  and,
  asc,
  type Column,
  desc,
  eq,
  gt,
  gte,
  like,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

export type Order = "asc" | "desc";

export interface Cursor {
  date: Date;
  id: number;
}

const WORDS = /\s+/;
const LIKE_SPECIAL = /[\\%_]/g;
const DIACRITICS = /\p{Diacritic}/gu;

/** Accented letters and their plain forms, for `translate()` in SQL. */
const ACCENTED = "áàâäãåāéèêëēíìîïīóòôöõōúùûüūçñý";
const PLAIN = "aaaaaaaeeeeeiiiiioooooouuuuucny";

/** Lowercase without accents, as `folded` does in SQL. */
const fold = (text: string) =>
  text.normalize("NFD").replace(DIACRITICS, "").toLowerCase();

/** `text` lowercased with common accents removed, matching `fold`. */
const folded = (text: SQL) =>
  sql`translate(lower(${text}), ${ACCENTED}, ${PLAIN})`;

/**
 * Keyset pagination on `(date, id)`: rows strictly after `cursor` in `order`,
 * so gatherings on the same date are never skipped or repeated.
 */
export function afterCursor(
  date: Column,
  id: Column,
  cursor: Cursor | null | undefined,
  order: Order
): SQL | undefined {
  if (!cursor) {
    return;
  }
  const past = order === "asc" ? gt : lt;
  return or(
    past(date, cursor.date),
    and(eq(date, cursor.date), past(id, cursor.id))
  );
}

/** `date` from `from` (inclusive) and before `before`, when given. */
export const inWindow = (
  date: Column,
  window: { before?: Date; from?: Date }
): SQL | undefined =>
  and(
    window.from ? gte(date, window.from) : undefined,
    window.before ? lt(date, window.before) : undefined
  );

/** `ORDER BY date, id` in `order`, the order `afterCursor` pages through. */
export const byCursor = (date: Column, id: Column, order: Order) =>
  order === "asc" ? [asc(date), asc(id)] : [desc(date), desc(id)];

/**
 * Every word of `query` appears somewhere in `fields`, ignoring case and
 * accents, so "pelayanan" finds "Pélayanan".
 */
export function matchesWords(
  fields: (Column | SQL)[],
  query: string
): SQL | undefined {
  const words = fold(query).split(WORDS).filter(Boolean);
  if (words.length === 0) {
    return;
  }
  const haystack = folded(sql`concat_ws(' ', ${sql.join(fields, sql`, `)})`);
  return and(
    ...words.map((word) =>
      like(haystack, `%${word.replace(LIKE_SPECIAL, "\\$&")}%`)
    )
  );
}

/**
 * Turns `limit + 1` fetched rows into a page: the first `limit` items and the
 * cursor of the last one when more follow.
 */
export function toPage<T>(
  rows: T[],
  limit: number,
  cursorOf: (item: T) => Cursor
): { items: T[]; nextCursor: Cursor | null } {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return {
    items,
    nextCursor: rows.length > limit && last ? cursorOf(last) : null,
  };
}
