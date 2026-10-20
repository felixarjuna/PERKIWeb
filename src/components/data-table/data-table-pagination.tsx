"use client";

import type { RowData } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useId } from "react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { DataTable } from "./data-table";

/** Rows-per-page select, page status and icon-only page buttons (tablecn). */
export function DataTablePagination<TData extends RowData>({
  table,
  pageSizeOptions,
  summary,
}: {
  table: DataTable<TData>;
  pageSizeOptions: readonly number[];
  /** Left-aligned status, e.g. "12 of 44 members". */
  summary?: string;
}) {
  const labelId = useId();
  const { pageIndex, pageSize } = table.state.pagination;
  const pageCount = Math.max(1, table.getPageCount());
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <p aria-live="polite" className="type-caption text-muted-foreground">
        {summary}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span
            className="type-caption whitespace-nowrap text-muted-foreground"
            id={labelId}
          >
            Rows per page
          </span>
          <Select
            onValueChange={(value) => table.setPageSize(Number(value))}
            value={String(pageSize)}
          >
            <SelectTrigger
              aria-labelledby={labelId}
              className="h-9 w-20"
              variant="filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="type-caption mr-1 whitespace-nowrap tabular-nums">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            aria-label="Go to first page"
            className="hidden size-9 sm:inline-flex"
            disabled={!canPrevious}
            onClick={() => table.setPageIndex(0)}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            aria-label="Go to previous page"
            className="size-9"
            disabled={!canPrevious}
            onClick={() => table.previousPage()}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            aria-label="Go to next page"
            className="size-9"
            disabled={!canNext}
            onClick={() => table.nextPage()}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            aria-label="Go to last page"
            className="hidden size-9 sm:inline-flex"
            disabled={!canNext}
            onClick={() => table.setPageIndex(pageCount - 1)}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
