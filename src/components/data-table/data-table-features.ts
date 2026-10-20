import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrHas,
  filterFn_includesString,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";

/** Column metadata read by the toolbar, header menus and view options. */
export interface DataTableColumnMeta {
  /** Extra classes for this column's header and body cells. */
  className?: string;
  /** Human-readable column name for menus and accessible labels. */
  label?: string;
}

/**
 * Client-side TanStack Table v9 feature set modelled on tablecn's data table:
 * faceted filters, sorting, pinning, visibility and pagination. Row models are
 * memoised by TanStack, so filtering or paging never rebuilds unchanged rows.
 */
export const dataTableFeatures = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    arrHas: filterFn_arrHas,
    includesString: filterFn_includesString,
  },
  paginatedRowModel: createPaginatedRowModel(),
  rowPaginationFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    text: sortFn_text,
  },
});

export type DataTableFeatures = typeof dataTableFeatures;
