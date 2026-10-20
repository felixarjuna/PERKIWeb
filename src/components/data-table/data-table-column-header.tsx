"use client";

import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import type { DataTableFeatures } from "./data-table-features";

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") {
    return <ArrowUp aria-hidden="true" />;
  }
  if (direction === "desc") {
    return <ArrowDown aria-hidden="true" />;
  }
  return <ChevronsUpDown aria-hidden="true" />;
}

/** Header button with a sort / hide menu, as in tablecn. */
export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  label,
  ascLabel = "Ascending",
  descLabel = "Descending",
  className,
}: {
  column: Column<DataTableFeatures, TData, TValue>;
  label: string;
  /** Plain-language sort names, e.g. "A–Z" or "Oldest first". */
  ascLabel?: string;
  descLabel?: string;
  className?: string;
}) {
  const canSort = column.getCanSort();
  const canHide = column.getCanHide();
  if (!(canSort || canHide)) {
    return <span className={className}>{label}</span>;
  }
  const direction = column.getIsSorted();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${label} column options`}
        className={cn(
          "-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent [&_svg]:size-3.5 [&_svg]:shrink-0",
          direction && "text-foreground",
          className
        )}
      >
        {label}
        {canSort ? <SortIcon direction={direction} /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 border-0 bg-popover">
        {canSort ? (
          <>
            <DropdownMenuItem
              className={cn(direction === "asc" && "bg-secondary")}
              onSelect={() => column.toggleSorting(false)}
            >
              <ArrowUp aria-hidden="true" className="text-muted-foreground" />
              {ascLabel}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(direction === "desc" && "bg-secondary")}
              onSelect={() => column.toggleSorting(true)}
            >
              <ArrowDown aria-hidden="true" className="text-muted-foreground" />
              {descLabel}
            </DropdownMenuItem>
          </>
        ) : null}
        {canSort && canHide ? <DropdownMenuSeparator /> : null}
        {canHide ? (
          <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
            <EyeOff aria-hidden="true" className="text-muted-foreground" />
            Hide column
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
