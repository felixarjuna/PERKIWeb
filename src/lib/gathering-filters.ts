import { isMonth, monthRange } from "./months";

export type GatheringType = "all" | "bible_study" | "church_service";

/** A gathering type the server knows, or "all" for anything else. */
export const typeOf = (type: string | null | undefined): GatheringType =>
  type === "church_service" || type === "bible_study" ? type : "all";

/** What a member searches /schedule and /takeaway by; kept in the URL. */
export interface GatheringFilters {
  /** `yyyy-MM`, or "" for any month. */
  month: string;
  q: string;
  type: GatheringType;
}

export const NO_FILTERS: GatheringFilters = { month: "", q: "", type: "all" };

/** Reads `?q=`, `?type=` and `?month=`, ignoring values that don't fit. */
export const filtersFrom = (params: URLSearchParams): GatheringFilters => {
  const month = params.get("month");
  return {
    month: isMonth(month) ? month : "",
    q: params.get("q") ?? "",
    type: typeOf(params.get("type")),
  };
};

export const isFiltered = (filters: GatheringFilters) =>
  filters.q.trim() !== "" || filters.type !== "all" || filters.month !== "";

/** The filters as a list query input: words, type and the month's window. */
export const filterQuery = (filters: GatheringFilters) => ({
  q: filters.q.trim(),
  type: filters.type,
  ...(filters.month ? monthRange(filters.month) : {}),
});
