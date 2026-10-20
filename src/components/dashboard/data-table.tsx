import {
  type ColumnDef,
  FlexRender,
  type RowData,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { Cake } from "lucide-react";
import React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { countBirthdaysThisMonth } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import { Badge } from "../ui/badge";
import DataTablePagination from "./data-table-pagination";
import { type DashboardFeatures, dashboardFeatures } from "./table-features";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DashboardFeatures, TData>[];
  data: TData[];
}

export default function DataTable<TData extends RowData>({
  columns,
  data,
}: DataTableProps<TData>) {
  /** local state to handle sorting. */
  const [sorting, setSorting] = React.useState<SortingState>([
    { desc: false, id: "name" },
  ]);

  const table = useTable({
    columns,
    data,
    features: dashboardFeatures,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const count = React.useMemo(
    () =>
      countBirthdaysThisMonth(
        data as RouterOutputs["profiles"]["getUserProfiles"]
      ),
    [data]
  );

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 text-foreground sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="rounded-xl bg-card p-4 sm:p-6">
          <h2 className="type-subheading">
            Birthday this month <Cake className="inline size-4" />
          </h2>
          <p className="type-heading mt-2 tabular-nums">{count}</p>
        </div>

        <Badge className="type-caption h-fit" variant="secondary">
          {data.length} members
        </Badge>
      </div>

      <p className="type-caption text-muted-foreground md:hidden">
        Scroll across the table to see all member details.
      </p>
      <div className="min-w-0 overflow-hidden rounded-xl border">
        <Table aria-label="Fellowship members" className="min-w-[56rem]">
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    colSpan={header.colSpan}
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {header.isPlaceholder ? null : (
                      <FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
