"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GatheringFlags } from "~/components/schedule/gathering-flags";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { isMonth, monthLabel, monthOf } from "~/lib/months";
import {
  buildPlan,
  columnLabel,
  hasColumn,
  PLAN_COLUMNS,
  type Plan,
  type PlanColumn,
  type PlanRow,
  planColumnLabels,
  planRows,
  regularGatherings,
} from "~/lib/plan-grid";
import { localDay, localTime } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { AdminSegmented, QueryMessage } from "../admin-controls";
import { GenerateButton, PublishButton } from "./plan-actions";
import { SlotPicker } from "./slot-picker";

const ZONE = "Europe/Berlin";

const LENGTHS = [
  { label: "3 months", value: "3" },
  { label: "6 months", value: "6" },
  { label: "12 months", value: "12" },
] as const;
const DEFAULT_MONTHS = 6;

const typeLabel = (type: PlanRow["schedule"]["type"]) =>
  type === "church_service" ? "Church service" : "Bible study";

/** Keeps the range in the URL, so back and reload land on the same months. */
function updateUrl(values: Record<string, string>) {
  const next = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(values)) {
    next.set(key, value);
  }
  window.history.pushState(null, "", `/admin/schedules/plan?${next}`);
}

/** Saves one cell; a suggested row is added with its first slot. */
function useSaveSlot() {
  const utils = api.useUtils();
  const [pending, setPending] = useState<string | null>(null);
  const save = api.schedules.setPlanSlot.useMutation({
    onError: (error) => toast.error(error.message),
    onSettled: async () => {
      await utils.schedules.invalidate();
      setPending(null);
    },
  });
  const lock = api.schedules.lockPlanSlot.useMutation({
    onError: (error) => toast.error(error.message),
    onSettled: async () => {
      await utils.schedules.invalidate();
      setPending(null);
    },
  });
  return {
    /** Keeps a generated pick, so "Regenerate" leaves it alone. */
    lock: (row: PlanRow, column: PlanColumn) => {
      setPending(row.key);
      lock.mutate({ column, scheduleId: row.schedule.id });
    },
    /** The row being saved (`row.key`), so a new row isn't added twice. */
    pending,
    save: (
      row: PlanRow,
      column: PlanColumn,
      name: string | null,
      userId?: string
    ) => {
      setPending(row.key);
      save.mutate(
        row.suggested
          ? {
              column,
              name,
              newGathering: {
                day: localDay(row.schedule.date),
                type: row.schedule.type,
              },
              userId,
            }
          : { column, name, scheduleId: row.schedule.id, userId },
        {
          onSuccess: () => {
            if (row.suggested) {
              toast.success(
                `Added ${row.schedule.title} on ${DateTime.fromJSDate(
                  row.schedule.date
                )
                  .setZone(ZONE)
                  .toFormat("ccc d LLL")}.`
              );
            }
          },
        }
      );
    },
  };
}

type Save = ReturnType<typeof useSaveSlot>;

/** The date, time, type and title of a row; stored ones link to their form. */
function RowHeading({ row }: { row: PlanRow }) {
  const { schedule } = row;
  const date = DateTime.fromJSDate(schedule.date).setZone(ZONE);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="type-caption text-muted-foreground">
        {date.toFormat("ccc d LLL")} · {localTime(schedule.date)} ·{" "}
        {typeLabel(schedule.type)}
      </p>
      {row.suggested ? (
        <>
          <p className="type-body-sm text-muted-foreground">{schedule.title}</p>
          <Badge className="w-fit" size="status" variant="draft">
            Not added yet
          </Badge>
        </>
      ) : (
        <>
          <Link
            className={cn(
              "type-body-sm break-words underline-offset-4 hover:underline",
              schedule.cancelled && "text-muted-foreground line-through"
            )}
            href={`/admin/schedules/${schedule.id}/edit`}
          >
            {schedule.title}
          </Link>
          <div className="flex flex-wrap gap-1">
            {schedule.published ? null : (
              <Badge className="w-fit" size="status" variant="draft">
                Draft
              </Badge>
            )}
            <GatheringFlags
              cancelled={schedule.cancelled}
              flags={schedule.flags}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Slot({
  plan,
  row,
  column,
  position,
  saving,
  showLabel,
}: {
  plan: Plan;
  row: PlanRow;
  column: PlanColumn;
  /** The cell's place in the grid, for moving between cells with arrow keys. */
  position?: { column: number; row: number };
  saving: Save;
  showLabel?: boolean;
}) {
  const { schedule } = row;
  if (!hasColumn(column, schedule.type)) {
    return showLabel ? null : (
      <span className="type-caption text-muted-foreground">—</span>
    );
  }
  if (schedule.cancelled) {
    // Nobody serves at a cancelled gathering; the stored team stays as it was.
    const { value } = plan.cell(schedule, column);
    return (
      <div className="flex flex-col gap-1">
        {showLabel ? (
          <span className="type-caption text-muted-foreground">
            {columnLabel(column, schedule.type)}
          </span>
        ) : null}
        <span className="type-body-sm text-muted-foreground line-through">
          {value ?? "—"}
        </span>
      </div>
    );
  }
  return (
    <SlotPicker
      column={column}
      onLock={
        row.schedule.published ? undefined : () => saving.lock(row, column)
      }
      onPick={(name, userId) => saving.save(row, column, name, userId)}
      pending={saving.pending === row.key}
      plan={plan}
      position={position}
      schedule={schedule}
      showLabel={showLabel}
    />
  );
}

/** The rows of each month, in order. */
function byMonth(rows: PlanRow[]) {
  const months = new Map<string, PlanRow[]>();
  for (const row of rows) {
    const key = monthOf(row.schedule.date);
    months.set(key, [...(months.get(key) ?? []), row]);
  }
  return [...months];
}

/** Desk view: dates down, slots across, months as dividers, like the sheet. */
function Grid({
  plan,
  rows,
  saving,
}: {
  plan: Plan;
  rows: PlanRow[];
  saving: Save;
}) {
  const index = new Map(rows.map((row, position) => [row.key, position]));
  return (
    <div
      className="@3xl:block hidden overflow-x-auto rounded-xl bg-card"
      data-plan-grid=""
    >
      <table className="w-full border-separate border-spacing-0">
        <caption className="sr-only">
          Slots for each gathering. Arrow keys move between cells; typing opens
          a cell's list.
        </caption>
        <thead>
          <tr>
            <th
              className="type-caption sticky left-0 z-10 min-w-48 bg-card p-3 text-left font-medium text-muted-foreground"
              scope="col"
            >
              Gathering
            </th>
            {PLAN_COLUMNS.map((column) => (
              <th
                className="type-caption min-w-40 p-3 text-left font-medium text-muted-foreground"
                key={column}
                scope="col"
              >
                {planColumnLabels[column]}
              </th>
            ))}
          </tr>
        </thead>
        {byMonth(rows).map(([month, monthRows]) => (
          <tbody key={month}>
            <tr>
              <th
                className="sticky left-0 z-10 border-background border-t bg-card px-3 pt-5 pb-2 text-left font-normal"
                colSpan={1}
                scope="colgroup"
              >
                <span className="type-subheading">{monthLabel(month)}</span>
              </th>
              <td
                className="border-background border-t"
                colSpan={PLAN_COLUMNS.length}
              />
            </tr>
            {monthRows.map((row) => (
              <tr
                className={cn("align-top", row.suggested && "bg-background/40")}
                key={row.key}
              >
                <th
                  className={cn(
                    "sticky left-0 z-10 border-background border-t p-3 text-left font-normal",
                    row.suggested ? "bg-muted" : "bg-card"
                  )}
                  scope="row"
                >
                  <RowHeading row={row} />
                </th>
                {PLAN_COLUMNS.map((column, columnIndex) => (
                  <td className="border-background border-t p-2" key={column}>
                    <Slot
                      column={column}
                      plan={plan}
                      position={{
                        column: columnIndex,
                        row: index.get(row.key) ?? 0,
                      }}
                      row={row}
                      saving={saving}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/** Phone view: a card per date with the same pickers, under month headings. */
function List({
  plan,
  rows,
  saving,
}: {
  plan: Plan;
  rows: PlanRow[];
  saving: Save;
}) {
  return (
    <div className="flex @3xl:hidden flex-col gap-6">
      {byMonth(rows).map(([month, monthRows]) => (
        <section aria-label={monthLabel(month)} key={month}>
          <h3 className="type-subheading mb-3">{monthLabel(month)}</h3>
          <ul className="flex flex-col gap-3">
            {monthRows.map((row) => (
              <li
                className={cn(
                  "flex flex-col gap-4 rounded-xl p-4 sm:p-6",
                  row.suggested ? "bg-muted" : "bg-card"
                )}
                key={row.key}
              >
                <RowHeading row={row} />
                <div className="grid @xl:grid-cols-2 gap-4">
                  {PLAN_COLUMNS.filter((column) =>
                    hasColumn(column, row.schedule.type)
                  ).map((column) => (
                    <Slot
                      column={column}
                      key={column}
                      plan={plan}
                      row={row}
                      saving={saving}
                      showLabel
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

/**
 * Planning months (#111): every regular Saturday in the range (PA Besar on
 * the 1st, 3rd and 5th, a service on the 2nd and 4th) and every stored
 * gathering, with a picker per slot. Filling a slot of a day not added yet
 * adds that gathering. Warnings are advice; every pick saves on its own into
 * the same schedule and assignments the form writes.
 */
export default function PlanGrid() {
  const params = useSearchParams();
  const now = DateTime.now().setZone(ZONE);
  const fromParam = params.get("from");
  const from = isMonth(fromParam) ? fromParam : now.toFormat("yyyy-MM");
  const lengthParam = params.get("months");
  const months =
    LENGTHS.find((option) => option.value === lengthParam)?.value ??
    String(DEFAULT_MONTHS);
  const count = Number(months);
  const query = api.schedules.plan.useQuery(
    { month: from, months: count },
    { placeholderData: keepPreviousData }
  );
  const plan = useMemo(
    () => (query.data ? buildPlan(query.data) : null),
    [query.data]
  );
  const rows = useMemo(
    () =>
      query.data
        ? planRows(query.data.schedules, regularGatherings(from, count))
        : [],
    [query.data, from, count]
  );
  const saving = useSaveSlot();
  const start = DateTime.fromFormat(from, "yyyy-MM", { zone: ZONE });
  const end = start.plus({ months: count - 1 });
  const toAdd = rows.filter((row) => row.suggested).length;
  const drafts = rows.filter(
    (row) => !(row.suggested || row.schedule.published)
  ).length;
  const warnings = plan
    ? rows.reduce(
        (sum, row) =>
          sum +
          PLAN_COLUMNS.filter((column) =>
            hasColumn(column, row.schedule.type)
          ).reduce(
            (cells, column) =>
              cells + plan.cell(row.schedule, column).warnings.length,
            0
          ),
        0
      )
    : 0;
  const shift = (by: number) =>
    updateUrl({ from: start.plus({ months: by }).toFormat("yyyy-MM") });

  return (
    <section aria-labelledby="plan-range" className="@container">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="type-subheading" id="plan-range">
            {start.toFormat("LLL yyyy")} – {end.toFormat("LLL yyyy")}
          </h2>
          <p aria-live="polite" className="type-caption text-muted-foreground">
            {plural(rows.length - toAdd, "gathering")}
            {drafts > 0 ? ` · ${plural(drafts, "draft")}` : ""}
            {toAdd > 0 ? ` · ${toAdd} not added yet` : ""}
            {warnings > 0 ? ` · ${plural(warnings, "warning")}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {plan ? (
            <>
              <GenerateButton count={count} from={from} rows={rows} />
              <PublishButton count={count} from={from} rows={rows} />
            </>
          ) : null}
          <AdminSegmented
            label="How many months"
            onChange={(next) => updateUrl({ months: next })}
            options={LENGTHS}
            value={months}
          />
          <div className="flex items-center gap-1">
            <Button
              aria-label="Start a month earlier"
              onClick={() => shift(-1)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
            <Button
              disabled={start.hasSame(now, "month")}
              onClick={() => updateUrl({ from: now.toFormat("yyyy-MM") })}
              size="sm"
              type="button"
              variant="secondary"
            >
              This month
            </Button>
            <Button
              aria-label="Start a month later"
              onClick={() => shift(1)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      {query.isLoading ? (
        <QueryMessage>Loading the months…</QueryMessage>
      ) : null}
      {query.isError ? (
        <QueryMessage
          error
          onRetry={() => {
            query.refetch();
          }}
        />
      ) : null}
      {plan && rows.length > 0 ? (
        <>
          <Grid plan={plan} rows={rows} saving={saving} />
          <List plan={plan} rows={rows} saving={saving} />
        </>
      ) : null}
    </section>
  );
}
