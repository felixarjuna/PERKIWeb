"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GatheringFlags } from "~/components/schedule/gathering-flags";
import { Button } from "~/components/ui/button";
import {
  buildPlan,
  columnLabel,
  hasColumn,
  PLAN_COLUMNS,
  type Plan,
  type PlanColumn,
  type PlanSchedule,
  planColumnLabels,
} from "~/lib/plan-grid";
import { localTime } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { QueryMessage } from "../admin-controls";
import { SlotPicker } from "./slot-picker";

const ZONE = "Europe/Berlin";

const typeLabel = (type: PlanSchedule["type"]) =>
  type === "church_service" ? "Church service" : "Bible study";

/** Saves one cell; `pending` is the cell being saved, as `id column`. */
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
  return {
    pending,
    save: (
      schedule: PlanSchedule,
      column: PlanColumn,
      name: string | null,
      userId?: string
    ) => {
      setPending(`${schedule.id} ${column}`);
      save.mutate({ column, name, scheduleId: schedule.id, userId });
    },
  };
}

type Save = ReturnType<typeof useSaveSlot>;

/** The date, time, type and title of a gathering, linking to its full form. */
function GatheringHeading({ schedule }: { schedule: PlanSchedule }) {
  const date = DateTime.fromJSDate(schedule.date).setZone(ZONE);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="type-caption text-muted-foreground">
        {date.toFormat("ccc d LLL")} · {localTime(schedule.date)} ·{" "}
        {typeLabel(schedule.type)}
      </p>
      <Link
        className={cn(
          "type-body-sm break-words underline-offset-4 hover:underline",
          schedule.cancelled && "text-muted-foreground line-through"
        )}
        href={`/admin/schedules/${schedule.id}/edit`}
      >
        {schedule.title}
      </Link>
      <GatheringFlags cancelled={schedule.cancelled} flags={schedule.flags} />
    </div>
  );
}

function Slot({
  plan,
  schedule,
  column,
  saving,
  showLabel,
}: {
  plan: Plan;
  schedule: PlanSchedule;
  column: PlanColumn;
  saving: Save;
  showLabel?: boolean;
}) {
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
      onPick={(name, userId) => saving.save(schedule, column, name, userId)}
      pending={saving.pending === `${schedule.id} ${column}`}
      plan={plan}
      schedule={schedule}
      showLabel={showLabel}
    />
  );
}

/** Desk view: gatherings down, slots across, the date pinned while scrolling. */
function Grid({
  plan,
  schedules,
  saving,
}: {
  plan: Plan;
  schedules: PlanSchedule[];
  saving: Save;
}) {
  return (
    <div className="@3xl:block hidden overflow-x-auto rounded-xl bg-card">
      <table className="w-full border-separate border-spacing-0">
        <caption className="sr-only">
          Slots for each gathering this month
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
        <tbody>
          {schedules.map((schedule) => (
            <tr className="align-top" key={schedule.id}>
              <th
                className="sticky left-0 z-10 border-background border-t bg-card p-3 text-left font-normal"
                scope="row"
              >
                <GatheringHeading schedule={schedule} />
              </th>
              {PLAN_COLUMNS.map((column) => (
                <td className="border-background border-t p-2" key={column}>
                  <Slot
                    column={column}
                    plan={plan}
                    saving={saving}
                    schedule={schedule}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Phone view: one card per gathering with the same pickers, stacked. */
function List({
  plan,
  schedules,
  saving,
}: {
  plan: Plan;
  schedules: PlanSchedule[];
  saving: Save;
}) {
  return (
    <ul className="flex @3xl:hidden flex-col gap-3">
      {schedules.map((schedule) => (
        <li
          className="flex flex-col gap-4 rounded-xl bg-card p-4 sm:p-6"
          key={schedule.id}
        >
          <GatheringHeading schedule={schedule} />
          <div className="grid @xl:grid-cols-2 gap-4">
            {PLAN_COLUMNS.filter((column) =>
              hasColumn(column, schedule.type)
            ).map((column) => (
              <Slot
                column={column}
                key={column}
                plan={plan}
                saving={saving}
                schedule={schedule}
                showLabel
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * The month's planning grid (#111): every gathering's slots, each filled
 * from the serving pool with the warnings mita should know about. A warning
 * is advice; every change saves on its own, into the same schedule and
 * assignments the form writes.
 */
export default function PlanGrid({
  month: monthKey,
  onMonthChange,
}: {
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const now = DateTime.now().setZone(ZONE);
  const parsed = DateTime.fromFormat(monthKey, "yyyy-MM", { zone: ZONE });
  const month = (parsed.isValid ? parsed : now).startOf("month");
  const key = month.toFormat("yyyy-MM");
  const query = api.schedules.plan.useQuery(
    { month: key },
    { placeholderData: keepPreviousData }
  );
  const plan = useMemo(
    () => (query.data ? buildPlan(query.data) : null),
    [query.data]
  );
  const saving = useSaveSlot();
  const schedules = query.data?.schedules ?? [];
  const warnings = plan
    ? schedules.reduce(
        (sum, schedule) =>
          sum +
          PLAN_COLUMNS.filter((column) => hasColumn(column, schedule.type))
            .map((column) => plan.cell(schedule, column).warnings.length)
            .reduce((a, b) => a + b, 0),
        0
      )
    : 0;
  const go = (months: number) =>
    onMonthChange(month.plus({ months }).toFormat("yyyy-MM"));
  const gatherings =
    schedules.length === 1 ? "1 gathering" : `${schedules.length} gatherings`;

  return (
    <section aria-labelledby="plan-month" className="@container">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="type-subheading" id="plan-month">
            {month.toFormat("LLLL yyyy")}
          </h2>
          <p aria-live="polite" className="type-caption text-muted-foreground">
            {gatherings}
            {warnings > 0
              ? ` · ${warnings} ${warnings === 1 ? "warning" : "warnings"}`
              : ""}{" "}
            · Changes save as you pick
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous month"
            onClick={() => go(-1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <Button
            disabled={month.hasSame(now, "month")}
            onClick={() => onMonthChange(now.toFormat("yyyy-MM"))}
            size="sm"
            type="button"
            variant="secondary"
          >
            Today
          </Button>
          <Button
            aria-label="Next month"
            onClick={() => go(1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
      {query.isLoading ? <QueryMessage>Loading the month…</QueryMessage> : null}
      {query.isError ? (
        <QueryMessage
          error
          onRetry={() => {
            query.refetch();
          }}
        />
      ) : null}
      {plan && schedules.length === 0 ? (
        <QueryMessage>
          No gatherings this month. Add them first, or import them from the
          sheet.
        </QueryMessage>
      ) : null}
      {plan && schedules.length > 0 ? (
        <>
          <Grid plan={plan} saving={saving} schedules={schedules} />
          <List plan={plan} saving={saving} schedules={schedules} />
        </>
      ) : null}
    </section>
  );
}
