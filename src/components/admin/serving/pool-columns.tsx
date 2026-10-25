"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { useRef } from "react";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import type { DataTableFeatures } from "~/components/data-table/data-table-features";
import { PersonAvatar } from "~/components/person-avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { scopeLabels, statusLabels } from "~/lib/serving-pool";
import { servingRoleLabels } from "~/lib/serving-roles";
import type { RouterOutputs } from "~/trpc/react";

export type PoolEntry = RouterOutputs["servingPool"]["list"]["entries"][number];
export type PoolAction = "edit" | "pause" | "resume" | "remove";
type PoolColumn = ColumnDef<DataTableFeatures, PoolEntry>;

const STATUS_VARIANT = {
  active: "published",
  backup: "review",
  paused: "draft",
} as const;

export const entryName = (entry: PoolEntry) =>
  entry.user.name ?? "Unnamed account";

/** A `yyyy-MM-dd` day as written for people, e.g. "30 Nov 2026". */
const shownDay = (day: string) =>
  format(new Date(`${day}T12:00:00`), "d MMM yyyy");

function Actions({
  entry,
  onAction,
}: {
  entry: PoolEntry;
  onAction: (action: PoolAction, entry: PoolEntry, origin: HTMLElement) => void;
}) {
  const name = `${entryName(entry)}, ${servingRoleLabels[entry.role]}`;
  const trigger = useRef<HTMLButtonElement>(null);
  const act = (action: PoolAction) => () => {
    if (trigger.current) {
      onAction(action, entry, trigger.current);
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Actions for ${name}`}
          ref={trigger}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={act("edit")}>
          <Pencil aria-hidden="true" />
          Edit status and scope
        </DropdownMenuItem>
        {entry.status === "paused" ? (
          <DropdownMenuItem onSelect={act("resume")}>
            <Play aria-hidden="true" />
            End pause
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={act("pause")}>
            <Pause aria-hidden="true" />
            Pause
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive-text focus:text-destructive-text"
          onSelect={act("remove")}
        >
          <Trash2 aria-hidden="true" />
          Remove from pool
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Columns of the serving pool table; `onAction` opens a row's dialogs. */
export function createPoolColumns(
  onAction: (action: PoolAction, entry: PoolEntry, origin: HTMLElement) => void
): PoolColumn[] {
  return [
    {
      accessorFn: entryName,
      cell: ({ row }) => (
        // w-36 = column size 160 minus the cell's horizontal padding.
        <div className="flex w-36 min-w-0 items-center gap-2">
          <PersonAvatar
            person={{
              image: row.original.user.image,
              name: entryName(row.original),
            }}
            size="sm"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate" title={entryName(row.original)}>
              {entryName(row.original)}
            </span>
            <span className="type-caption truncate text-muted-foreground">
              {servingRoleLabels[row.original.role]}
            </span>
          </div>
        </div>
      ),
      enableHiding: false,
      header: ({ column }) => (
        <DataTableColumnHeader
          ascLabel="A–Z"
          column={column}
          descLabel="Z–A"
          label="Member"
        />
      ),
      id: "name",
      meta: { label: "Member" },
      size: 160,
      sortFn: "text",
    },
    {
      accessorFn: (entry) => entry.status,
      cell: ({ row }) => {
        const { pausedUntil, status } = row.original;
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge size="status" variant={STATUS_VARIANT[status]}>
              {statusLabels[status]}
            </Badge>
            {status === "paused" && pausedUntil ? (
              <span className="type-caption text-muted-foreground">
                Until {shownDay(pausedUntil)}
              </span>
            ) : null}
          </div>
        );
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      id: "status",
      meta: { label: "Status" },
      size: 140,
      sortFn: "text",
    },
    {
      accessorFn: (entry) => entry.servedThisTerm,
      header: ({ column }) => (
        <DataTableColumnHeader
          ascLabel="Least first"
          column={column}
          descLabel="Most first"
          label="This term"
        />
      ),
      id: "served",
      meta: { className: "tabular-nums", label: "Served this term" },
      size: 110,
      sortFn: "basic",
    },
    {
      accessorFn: (entry) => entry.lastServed?.getTime(),
      cell: ({ row }) =>
        row.original.lastServed ? (
          format(row.original.lastServed, "d MMM yyyy")
        ) : (
          <span className="text-muted-foreground">Not yet</span>
        ),
      header: ({ column }) => (
        <DataTableColumnHeader
          ascLabel="Longest ago first"
          column={column}
          descLabel="Most recent first"
          label="Last served"
        />
      ),
      id: "lastServed",
      meta: { className: "tabular-nums", label: "Last served" },
      size: 130,
      sortFn: "basic",
      sortUndefined: -1,
    },
    {
      accessorFn: (entry) => entry.scope,
      cell: ({ row }) => scopeLabels[row.original.scope],
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Serves at" />
      ),
      id: "scope",
      meta: { label: "Serves at" },
      size: 120,
      sortFn: "text",
    },
    {
      accessorFn: (entry) => entry.pauseNote ?? undefined,
      cell: ({ getValue }) => {
        const note = getValue<string | undefined>();
        return note ? (
          <span className="block max-w-56 truncate" title={note}>
            {note}
          </span>
        ) : (
          <span className="text-muted-foreground">None</span>
        );
      },
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Pause note" />
      ),
      id: "note",
      meta: { label: "Pause note" },
      size: 200,
    },
    {
      cell: ({ row }) => <Actions entry={row.original} onAction={onAction} />,
      enableHiding: false,
      enableSorting: false,
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
      size: 56,
    },
  ];
}
