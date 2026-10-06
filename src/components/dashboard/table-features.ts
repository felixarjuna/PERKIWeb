import {
  columnFilteringFeature,
  columnSizingFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from "@tanstack/react-table";

/** TanStack Table v9 features used by the admin dashboard table. */
export const dashboardFeatures = tableFeatures({
  columnFilteringFeature,
  columnSizingFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns,
  paginatedRowModel: createPaginatedRowModel(),
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
});

export type DashboardFeatures = typeof dashboardFeatures;
