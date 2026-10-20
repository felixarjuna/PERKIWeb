import type { ReactTable, RowData } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { DashboardFeatures } from "./table-features";

interface DataTablePaginationProps<TData extends RowData> {
  table: ReactTable<DashboardFeatures, TData>;
}

export default function DataTablePagination<TData extends RowData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="type-body-sm flex-1 text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="type-body-sm" htmlFor="dashboard-page-size">
            Rows per page
          </label>
          <Select
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
            value={`${table.state.pagination.pageSize}`}
          >
            <SelectTrigger className="w-20" id="dashboard-page-size">
              <SelectValue placeholder={table.state.pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="type-body-sm flex items-center justify-center tabular-nums">
          Page {table.state.pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            className="hidden h-8 w-8 p-0 lg:flex"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            variant="outline"
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            className="h-8 w-8 p-0"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            variant="outline"
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            className="h-8 w-8 p-0"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            variant="outline"
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            className="hidden h-8 w-8 p-0 lg:flex"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            variant="outline"
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
