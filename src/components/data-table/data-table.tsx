"use client";

import {
  type Cell,
  type Column,
  FlexRender,
  type Header,
  type ReactTable,
  type Row,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { type CSSProperties, memo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import type { DataTableFeatures } from "./data-table-features";

export type DataTable<TData extends RowData> = ReactTable<
  DataTableFeatures,
  TData
>;

/**
 * Pinned cells stay opaque so scrolled content never shows through; their
 * hover tint mirrors the row's `hover:bg-accent/40` over the card surface.
 */
const PINNED_CELL =
  "sticky z-10 bg-card shadow-[inset_-1px_0_0_var(--border)] transition-colors group-hover/row:bg-[color-mix(in_oklab,var(--accent)_40%,var(--card))]";

function columnStyle<TData extends RowData>(
  column: Column<DataTableFeatures, TData>
): CSSProperties {
  const pinned = column.getIsPinned();
  const size = column.getSize();
  return {
    insetInlineEnd: pinned === "end" ? column.getAfter("end") : undefined,
    insetInlineStart: pinned === "start" ? column.getStart("start") : undefined,
    // Pinned columns keep an exact width so their sticky offsets line up;
    // the rest start at their size and grow to fit their content.
    maxWidth: pinned ? size : undefined,
    minWidth: size,
    width: pinned ? size : undefined,
  };
}

function ariaSort(sorting: SortingState, columnId: string) {
  const [sort] = sorting;
  if (sort?.id !== columnId) {
    return;
  }
  return sort.desc ? "descending" : "ascending";
}

function HeadCell<TData extends RowData>({
  header,
  sorting,
}: {
  header: Header<DataTableFeatures, TData>;
  sorting: SortingState;
}) {
  const { column } = header;
  return (
    <TableHead
      aria-sort={ariaSort(sorting, column.id)}
      className={cn(
        "type-caption h-11 whitespace-nowrap px-3 text-muted-foreground",
        column.getIsPinned() && PINNED_CELL,
        column.getIsPinned() && "z-20",
        column.columnDef.meta?.className
      )}
      colSpan={header.colSpan}
      scope="col"
      style={columnStyle(column)}
    >
      {header.isPlaceholder ? null : <FlexRender header={header} />}
    </TableHead>
  );
}

function BodyCell<TData extends RowData>({
  cell,
}: {
  cell: Cell<DataTableFeatures, TData>;
}) {
  const { column } = cell;
  return (
    <TableCell
      className={cn(
        "type-body-sm whitespace-nowrap px-3 py-3",
        column.getIsPinned() && PINNED_CELL,
        column.columnDef.meta?.className
      )}
      style={columnStyle(column)}
    >
      <FlexRender cell={cell} />
    </TableCell>
  );
}

function DataTableRowImpl<TData extends RowData>({
  row,
}: {
  row: Row<DataTableFeatures, TData>;
  /** Changes whenever pinning or visibility changes, re-rendering the row. */
  layout: string;
}) {
  return (
    <TableRow className="group/row border-border/40 hover:bg-accent/40">
      {row.getVisibleCells().map((cell) => (
        <BodyCell cell={cell} key={cell.id} />
      ))}
    </TableRow>
  );
}

/** Rows only re-render when their data or the column layout changes. */
const DataTableRow = memo(DataTableRowImpl) as typeof DataTableRowImpl;

/**
 * tablecn-style data table: horizontally scrollable, with pinned columns that
 * stay in place while the rest of the row scrolls underneath.
 */
export function DataTable<TData extends RowData>({
  table,
  label,
  empty,
  children,
  footer,
  className,
}: {
  table: DataTable<TData>;
  label: string;
  /** Shown in place of rows when nothing matches. */
  empty: ReactNode;
  /** Toolbar rendered above the table. */
  children?: ReactNode;
  /** Pagination rendered below the table. */
  footer?: ReactNode;
  className?: string;
}) {
  const { sorting, columnPinning, columnVisibility } = table.state;
  const layout = JSON.stringify([columnPinning, columnVisibility]);
  const { rows } = table.getRowModel();
  const columnCount = table.getVisibleLeafColumns().length || 1;
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {children}
      <div className="min-w-0 overflow-hidden rounded-xl bg-card">
        <Table aria-label={label} className="w-max min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                className="group/row border-border/40 hover:bg-transparent"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <HeadCell header={header} key={header.id} sorting={sorting} />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <DataTableRow key={row.id} layout={layout} row={row} />
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  className="type-body-sm h-28 px-4 text-center text-muted-foreground"
                  colSpan={columnCount}
                >
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {footer}
    </div>
  );
}
