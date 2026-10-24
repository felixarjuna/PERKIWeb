"use client";

import { DateTime } from "luxon";
import React from "react";
import {
  type CalendarItem,
  CalendarStatus,
  gatheringLine,
  MonthCalendar,
} from "~/components/admin/content/month-calendar";
import { monthOf } from "~/lib/months";
import { startOn } from "~/lib/schedule-team";
import type { TextChange } from "~/lib/takeaway-import";
import type { RouterOutputs } from "~/trpc/react";

type Entry = RouterOutputs["takeawayImport"]["preview"]["entries"][number];

const OPEN_LIST = new Intl.ListFormat("en", { type: "conjunction" });

/** The gathering's start, or the entry's day at the usual start. */
function entryDate(entry: Entry) {
  if (entry.gathering) {
    return entry.gathering.date;
  }
  const day = DateTime.fromISO(entry.day);
  return startOn({ day: day.day, month: day.month, year: day.year });
}

function entryItem(
  entry: Entry,
  label: (field: TextChange["field"]) => string
): CalendarItem {
  const item = {
    date: entryDate(entry),
    eyebrow: entry.gathering
      ? gatheringLine(entry.gathering.date, entry.gathering.type)
      : "Not imported",
    key: entry.day,
    title: entry.heading,
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
          Changes {OPEN_LIST.format(fields)}
        </CalendarStatus>
      ),
      statusText: `Changes: ${fields.join(", ")}`,
    };
  }
  if (entry.status === "published") {
    return {
      ...item,
      compactStatus: <CalendarStatus tone="quiet">Published</CalendarStatus>,
      dimmed: true,
      status: (
        <CalendarStatus tone="quiet">Published, left alone</CalendarStatus>
      ),
    };
  }
  if (entry.status === "skipped") {
    return {
      ...item,
      compactStatus: <CalendarStatus tone="quiet">Skipped</CalendarStatus>,
      dimmed: true,
      status: <CalendarStatus tone="quiet">Skipped</CalendarStatus>,
      statusText: entry.reason ?? undefined,
    };
  }
  const status = <CalendarStatus tone="done">Up to date</CalendarStatus>;
  return { ...item, compactStatus: status, dimmed: true, status };
}

/**
 * The first month with something to import; with nothing to import, this
 * month if the documents have it, else their latest month.
 */
function openingMonth(entries: Entry[]) {
  const pending = entries.find(
    (entry) => entry.status === "new" || entry.status === "changed"
  );
  if (pending) {
    return monthOf(entryDate(pending));
  }
  const now = monthOf(new Date());
  const months = entries.map((entry) => monthOf(entryDate(entry)));
  return months.includes(now) ? now : (months.at(-1) ?? now);
}

/**
 * The import preview as a month calendar: what each dated entry of the
 * documents would add or change, opening on the first month with something
 * to import.
 */
export default function DocsImportCalendar({
  entries,
  label,
}: {
  entries: Entry[];
  label: (field: TextChange["field"]) => string;
}) {
  const [month, setMonth] = React.useState(() => openingMonth(entries));
  const statusOf = new Map(entries.map((entry) => [entry.day, entry.status]));
  return (
    <MonthCalendar
      items={entries.map((entry) => entryItem(entry, label))}
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
