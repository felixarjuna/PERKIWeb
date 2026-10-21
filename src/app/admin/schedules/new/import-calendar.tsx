"use client";

import { DateTime } from "luxon";
import React from "react";
import {
  type CalendarItem,
  CalendarStatus,
  gatheringLine,
  MonthCalendar,
  monthOf,
} from "~/components/admin/content/month-calendar";
import type { FieldChange } from "~/lib/schedule-import";
import { startOn } from "~/lib/schedule-team";
import type { RouterOutputs } from "~/trpc/react";

type Preview = RouterOutputs["scheduleImport"]["preview"];
type Entry = Preview["entries"][number];

const OPEN_LIST = new Intl.ListFormat("en", { type: "conjunction" });

function entryItem(
  entry: Entry,
  label: (field: FieldChange["field"]) => string
): CalendarItem {
  const item = {
    date: entry.schedule.date,
    eyebrow: gatheringLine(entry.schedule.date, entry.schedule.type),
    key: `row-${entry.row}`,
    title: entry.schedule.title,
  };
  if (entry.status === "new") {
    const status = <CalendarStatus tone="attention">New</CalendarStatus>;
    return { ...item, compactStatus: status, status };
  }
  if (entry.status === "changed") {
    const fields = entry.changes.map((change) => label(change.field));
    return {
      ...item,
      compactStatus: (
        <CalendarStatus tone="attention">
          {fields.length === 1 ? "1 change" : `${fields.length} changes`}
        </CalendarStatus>
      ),
      status: (
        <CalendarStatus tone="attention">
          Changes {OPEN_LIST.format(fields.map((field) => field.toLowerCase()))}
        </CalendarStatus>
      ),
      statusText: `Changes: ${fields.join(", ")}`,
    };
  }
  const status = <CalendarStatus tone="done">Up to date</CalendarStatus>;
  return { ...item, compactStatus: status, dimmed: true, status };
}

/** A skipped row on its day, when the day can be read. */
function skippedItem(row: Preview["skipped"][number]): CalendarItem[] {
  const day = DateTime.fromISO(row.day);
  if (!day.isValid) {
    return [];
  }
  return [
    {
      compactStatus: <CalendarStatus tone="quiet">Skipped</CalendarStatus>,
      date: startOn({ day: day.day, month: day.month, year: day.year }),
      dimmed: true,
      eyebrow: "Not imported",
      key: `skipped-${row.row}`,
      status: <CalendarStatus tone="quiet">Skipped</CalendarStatus>,
      statusText: row.reason,
      title: row.reason,
    },
  ];
}

/**
 * The first month with something to import; with nothing to import, this
 * month if the tab has it, else the tab's first month.
 */
function openingMonth(preview: Preview) {
  const pending = preview.entries.find((entry) => entry.status !== "unchanged");
  if (pending) {
    return monthOf(pending.schedule.date);
  }
  const now = monthOf(new Date());
  const first = preview.entries.at(0);
  const hasNow = preview.entries.some(
    (entry) => monthOf(entry.schedule.date) === now
  );
  return hasNow || !first ? now : monthOf(first.schedule.date);
}

/**
 * The import preview as a month calendar: what each date of the tab would
 * add or change, opening on the first month with something to import.
 */
export default function ImportCalendar({
  preview,
  label,
}: {
  preview: Preview;
  label: (field: FieldChange["field"]) => string;
}) {
  const [month, setMonth] = React.useState(() => openingMonth(preview));
  const items = [
    ...preview.entries.map((entry) => entryItem(entry, label)),
    ...preview.skipped.flatMap(skippedItem),
  ];
  const statusOf = new Map(
    preview.entries.map((entry) => [`row-${entry.row}`, entry.status])
  );
  return (
    <MonthCalendar
      items={items}
      month={month}
      onMonthChange={setMonth}
      summary={(shown) => {
        const count = (status: Entry["status"]) =>
          shown.filter((item) => statusOf.get(item.key) === status).length;
        const parts = [
          `${count("new")} new`,
          `${count("changed")} changed`,
          `${count("unchanged")} up to date`,
        ];
        return `This month: ${parts.join(" · ")}`;
      }}
    />
  );
}
