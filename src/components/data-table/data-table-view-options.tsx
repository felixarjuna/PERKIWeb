"use client";

import type { RowData } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { DataTable } from "./data-table";

/** Column visibility menu (tablecn "View"). */
export function DataTableViewOptions<TData extends RowData>({
  table,
}: {
  table: DataTable<TData>;
}) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.accessorFn && column.getCanHide());
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-10 px-3"
          size="sm"
          type="button"
          variant="secondary"
        >
          <Settings2 aria-hidden="true" className="text-muted-foreground" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 border-0">
        <DropdownMenuLabel className="type-caption text-muted-foreground">
          Show columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            checked={column.getIsVisible()}
            key={column.id}
            onCheckedChange={(value) => column.toggleVisibility(value)}
            onSelect={(event) => event.preventDefault()}
          >
            {column.columnDef.meta?.label ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
