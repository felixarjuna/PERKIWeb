"use client";

import {
  type ColumnPinningState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "~/components/data-table/data-table";
import { dataTableFeatures } from "~/components/data-table/data-table-features";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button, buttonVariants } from "~/components/ui/button";
import { POOL_ROLES, statusLabels } from "~/lib/serving-pool";
import { servingRoleLabels } from "~/lib/serving-roles";
import { api } from "~/trpc/react";
import {
  AdminSearch,
  AdminSegmented,
  AdminSelect,
  QueryMessage,
} from "../admin-controls";
import {
  createPoolColumns,
  entryName,
  type PoolAction,
  type PoolEntry,
} from "./pool-columns";
import { AddDialog, EditDialog, PauseDialog } from "./pool-dialogs";
import { matchesPool, type PoolFilters, readPoolFilters } from "./pool-model";

const EMPTY: PoolEntry[] = [];
const PINNING: ColumnPinningState = { end: ["actions"], start: ["name"] };
const roleOptions = [
  { label: "All roles", value: "" },
  ...POOL_ROLES.map((role) => ({
    label: servingRoleLabels[role],
    value: role,
  })),
];
/** Toggle items can't hold "", so "every status" is `all` here. */
const ALL = "all";
const statusOptions = [
  { label: "All", value: ALL },
  ...Object.entries(statusLabels).map(([value, label]) => ({ label, value })),
];

/** Writes filters to the URL; Next.js syncs `history` into `useSearchParams`. */
function setFilters(filters: Partial<PoolFilters>, replace = false) {
  const next = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  const query = next.toString();
  const url = query ? `/admin/serving?${query}` : "/admin/serving";
  if (replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}

const day = (value: string) =>
  format(new Date(`${value}T12:00:00`), "d MMM yyyy");

/** Who can serve in which role, and how often they have this group term. */
export default function ServingPool() {
  const query = api.servingPool.list.useQuery();
  const utils = api.useUtils();
  const params = useSearchParams();
  const paramString = params.toString();
  const filters = useMemo(
    () => readPoolFilters(new URLSearchParams(paramString)),
    [paramString]
  );
  const [sorting, setSorting] = useState<SortingState>([
    { desc: false, id: "name" },
  ]);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<{
    action: PoolAction;
    entry: PoolEntry;
  } | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const entries = query.data?.entries ?? EMPTY;
  const shown = useMemo(
    () => entries.filter((entry) => matchesPool(entry, filters)),
    [entries, filters]
  );
  const refresh = () => utils.servingPool.list.invalidate();
  const resume = api.servingPool.resume.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("Pause ended.");
      await refresh();
    },
  });
  const remove = api.servingPool.remove.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("Removed from the pool.");
      await refresh();
      setOpen(null);
    },
  });

  const { mutate: resumeEntries } = resume;
  const columns = useMemo(
    () =>
      createPoolColumns((action, entry, origin) => {
        returnFocus.current = origin;
        if (action === "resume") {
          resumeEntries({ ids: [entry.id] });
        } else {
          setOpen({ action, entry });
        }
      }),
    [resumeEntries]
  );

  const table = useTable({
    columns,
    data: shown,
    features: dataTableFeatures,
    getRowId: (entry) => String(entry.id),
    onSortingChange: setSorting,
    state: { columnPinning: PINNING, sorting },
  });

  const close = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(null);
      returnFocus.current?.focus();
    }
  };
  const isFiltered = Boolean(filters.q || filters.role || filters.status);
  const dialogFor = (action: PoolAction) =>
    open && open.action === action ? open.entry : undefined;
  const editing = dialogFor("edit");
  const pausing = dialogFor("pause");
  const removing = dialogFor("remove");
  const term = query.data?.term;

  if (query.isError) {
    return <QueryMessage error onRetry={() => query.refetch()} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <AdminSearch
          className="w-full sm:w-64"
          id="pool-search"
          label="Search the serving pool"
          onChange={(event) => setFilters({ q: event.target.value }, true)}
          placeholder="Search name or email"
          value={filters.q}
        />
        <AdminSelect
          className="w-full min-[25rem]:w-44"
          hideLabel
          id="pool-role"
          label="Role"
          onChange={(role) => setFilters({ role: role as PoolFilters["role"] })}
          options={roleOptions}
          value={filters.role}
        />
        <AdminSegmented
          className="w-full min-[25rem]:w-auto"
          label="Status"
          onChange={(status) =>
            setFilters({
              status: (status === ALL ? "" : status) as PoolFilters["status"],
            })
          }
          options={statusOptions}
          value={filters.status || ALL}
        />
        {isFiltered ? (
          <Button
            className="h-10"
            onClick={() => setFilters({ q: "", role: "", status: "" })}
            size="sm"
            type="button"
            variant="ghost"
          >
            Reset
            <X aria-hidden="true" />
          </Button>
        ) : null}
        <Button
          className="sm:ml-auto"
          onClick={() => setAdding(true)}
          type="button"
        >
          <Plus aria-hidden="true" />
          Add member
        </Button>
      </div>
      {query.isPending ? (
        <QueryMessage>Loading the serving pool…</QueryMessage>
      ) : (
        <DataTable
          empty={
            entries.length
              ? "Nobody matches these filters. Try another search or reset the filters."
              : "Nobody is in the pool yet. Add members to the roles they can serve in."
          }
          footer={
            <p className="type-caption text-muted-foreground">
              {isFiltered
                ? `${shown.length} of ${entries.length} entries`
                : `${entries.length} entries`}
              {" · "}
              {term?.from
                ? `This term counts gatherings since ${day(term.from)}.`
                : "No group term yet, so every past gathering counts."}
            </p>
          }
          label="Serving pool"
          table={table}
        />
      )}

      <AddDialog onOpenChange={setAdding} open={adding} />
      <EditDialog entry={editing} onOpenChange={close} />
      <PauseDialog
        entry={pausing}
        onOpenChange={close}
        others={
          pausing
            ? entries.filter(
                (entry) =>
                  entry.user.id === pausing.user.id &&
                  entry.id !== pausing.id &&
                  entry.status !== "paused"
              )
            : EMPTY
        }
      />
      <AlertDialog onOpenChange={close} open={Boolean(removing)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removing ? entryName(removing) : ""} as{" "}
              {removing ? servingRoleLabels[removing.role] : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They stay on past schedules; only their place in the pool goes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Keep
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (removing) {
                  remove.mutate({ id: removing.id });
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
