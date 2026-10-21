import { typeOf } from "~/lib/gathering-filters";

/** The admin toolbar's values, as its selects report them. */
export interface ContentFilters {
  order: string;
  period?: string;
  q: string;
  type: string;
}

const orderOf = (order: string): "asc" | "desc" =>
  order === "asc" ? "asc" : "desc";

/** The toolbar as a `takeaways.getManageable` input; the server filters. */
export const takeawayQuery = (filters: ContentFilters) => ({
  order: orderOf(filters.order),
  q: filters.q.trim(),
  type: typeOf(filters.type),
});

/**
 * The toolbar as a `schedules.list` input: "upcoming" is from `now` on,
 * "past" before it.
 */
export const scheduleQuery = (filters: ContentFilters, now: Date) => ({
  ...takeawayQuery(filters),
  ...(filters.period === "upcoming" ? { from: now } : {}),
  ...(filters.period === "past" ? { before: now } : {}),
});
