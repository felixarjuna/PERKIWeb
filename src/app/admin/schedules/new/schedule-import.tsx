"use client";

import { ArrowRight, CalendarDays, List, RefreshCw } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import {
  AdminSegmented,
  AdminSelect,
  QueryMessage,
} from "~/components/admin/admin-controls";
import { GatheringFlags } from "~/components/schedule/gathering-flags";
import { TeamList } from "~/components/schedule/team";
import { Button } from "~/components/ui/button";
import type { FieldChange } from "~/lib/schedule-import";
import { localTime } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import ImportCalendar from "./import-calendar";

const VIEWS = [
  { icon: List, label: "List", value: "list" },
  { icon: CalendarDays, label: "Calendar", value: "calendar" },
] as const;

type Preview = RouterOutputs["scheduleImport"]["preview"];
type Entry = Preview["entries"][number];

const FIELD_LABELS: Record<FieldChange["field"], string> = {
  accommodation: "Accommodation",
  bibleVerse: "Bible verse",
  cancelled: "Status",
  cleaningGroup: "Cleaning",
  cookingGroup: "Cooking",
  description: "Description",
  flags: "Flags",
  leader: "Leader",
  multimedia: "Multimedia",
  musician: "Musician",
  noteWriter: "Note writer",
  preacher: "Preacher",
  time: "Time",
  type: "Type",
};

const TYPE_LABELS = {
  bible_study: "Bible study",
  church_service: "Church service",
} as const;

/** The sheet's own event names; a title equal to one adds nothing to the type. */
const EVENT_NAMES = new Set(["kebaktian", "penelaahan alkitab"]);

const entryTitle = ({ title, type }: Entry["schedule"]) =>
  EVENT_NAMES.has(title.toLowerCase())
    ? TYPE_LABELS[type]
    : `${TYPE_LABELS[type]} · ${title}`;

const formatDay = (day: string) =>
  DateTime.fromISO(day).toFormat("ccc d LLL yyyy");

function Row({
  day,
  time,
  title,
  verse,
  children,
}: {
  day: string;
  time?: string;
  title: string;
  verse?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="rounded-xl bg-card p-4">
      <p className="type-caption text-muted-foreground tabular-nums">
        {time ? `${formatDay(day)} · ${time}` : formatDay(day)}
      </p>
      <p className="type-body mt-0.5 break-words">{title}</p>
      {verse === undefined ? null : (
        <p className="type-body-sm mt-0.5 break-words text-muted-foreground">
          {verse || "No Bible verse"}
        </p>
      )}
      {children}
    </li>
  );
}

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) {
    return null;
  }
  return (
    <section className="space-y-3">
      <h2 className="type-subheading">
        {title} <span className="text-muted-foreground">{count}</span>
      </h2>
      <ul className="grid @2xl:grid-cols-2 gap-2">{children}</ul>
    </section>
  );
}

const importLabel = (count: number) => {
  if (count === 0) {
    return "Everything is up to date";
  }
  return `Import ${count} ${count === 1 ? "schedule" : "schedules"}`;
};

/** The preview as lists: new dates with their team, changes field by field, skipped rows. */
function ImportList({
  added,
  changed,
  skipped,
}: {
  added: Entry[];
  changed: Entry[];
  skipped: Preview["skipped"];
}) {
  return (
    <>
      <Group count={added.length} title="New">
        {added.map((entry) => (
          <Row
            day={entry.day}
            key={entry.row}
            time={localTime(entry.schedule.date)}
            title={entryTitle(entry.schedule)}
            verse={entry.schedule.bibleVerse}
          >
            <GatheringFlags
              cancelled={entry.schedule.cancelled}
              className="mt-2"
              flags={entry.schedule.flags}
            />
            {entry.team.length > 0 ? (
              <div className="mt-3 border-t pt-3">
                <p className="type-eyebrow text-muted-foreground">Team</p>
                <TeamList className="mt-2" team={entry.team} withPreacher />
              </div>
            ) : null}
          </Row>
        ))}
      </Group>

      <Group count={changed.length} title="Changed">
        {changed.map((entry) => (
          <Row
            day={entry.day}
            key={entry.row}
            title={entryTitle(entry.schedule)}
          >
            <dl className="type-body-sm mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              {entry.changes.map((change) => (
                <div className="contents" key={change.field}>
                  <dt className="text-muted-foreground">
                    {FIELD_LABELS[change.field]}
                  </dt>
                  <dd className="flex flex-wrap items-center gap-1.5 break-words">
                    <span className="text-muted-foreground line-through">
                      {change.from || "empty"}
                    </span>
                    <ArrowRight
                      aria-label="becomes"
                      className="size-3.5 shrink-0"
                    />
                    <span>{change.to || "empty"}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Row>
        ))}
      </Group>

      <Group count={skipped.length} title="Skipped">
        {skipped.map((row) => (
          <Row day={row.day} key={row.row} title={row.reason} />
        ))}
      </Group>
    </>
  );
}

/**
 * Imports a year tab of the schedule sheet. The preview shows what would be
 * added and changed; nothing is written until the import is confirmed.
 */
export default function ScheduleImport() {
  const router = useRouter();
  const utils = api.useUtils();
  const status = api.scheduleImport.status.useQuery();
  const [tab, setTab] = React.useState("");
  const [view, setView] = React.useState("list");
  const selectedTab = tab || status.data?.tabs[0] || "";
  const preview = api.scheduleImport.preview.useQuery(
    { tab: selectedTab },
    { enabled: selectedTab !== "" }
  );
  const run = api.scheduleImport.run.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      await Promise.all([
        utils.schedules.invalidate(),
        utils.scheduleImport.preview.invalidate(),
      ]);
      toast.success("Schedules imported", {
        description: `${result.added} added, ${result.updated} updated.`,
      });
      router.push("/admin/schedules");
    },
  });

  if (status.isError) {
    return <QueryMessage error onRetry={() => status.refetch()} />;
  }
  if (status.data && !status.data.configured) {
    return (
      <QueryMessage>
        No schedule sheet is set yet. Add its link on the{" "}
        <Link className="underline underline-offset-4" href="/admin/settings">
          Settings
        </Link>{" "}
        page.
      </QueryMessage>
    );
  }

  const entries = preview.data?.entries ?? [];
  const added = entries.filter((entry) => entry.status === "new");
  const changed = entries.filter((entry) => entry.status === "changed");
  const unchanged = entries.length - added.length - changed.length;
  const skipped = preview.data?.skipped ?? [];
  const toImport = added.length + changed.length;

  return (
    <div className="@container space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <AdminSelect
          className="w-40"
          id="schedule-import-tab"
          label="Year"
          onChange={setTab}
          options={(status.data?.tabs ?? []).map((name) => ({
            label: name,
            value: name,
          }))}
          value={selectedTab}
        />
        <Button
          disabled={preview.isFetching}
          onClick={() => preview.refetch()}
          type="button"
          variant="ghost"
        >
          <RefreshCw
            aria-hidden="true"
            className={cn(
              "size-4",
              preview.isFetching && "animate-spin motion-reduce:animate-none"
            )}
          />
          Read again
        </Button>
        <AdminSegmented
          className="ml-auto"
          label="Preview as"
          onChange={setView}
          options={VIEWS}
          value={view}
        />
      </div>

      {preview.isError ? (
        <QueryMessage error onRetry={() => preview.refetch()} />
      ) : null}
      {preview.isPending && selectedTab ? (
        <QueryMessage>Reading the {selectedTab} tab…</QueryMessage>
      ) : null}

      {preview.data ? (
        <>
          <p className="type-body-sm text-muted-foreground" role="status">
            {added.length} new · {changed.length} changed · {unchanged} already
            up to date · {skipped.length} skipped
          </p>

          {view === "calendar" ? (
            <ImportCalendar
              label={(field) => FIELD_LABELS[field]}
              preview={preview.data}
            />
          ) : (
            <ImportList added={added} changed={changed} skipped={skipped} />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={toImport === 0 || run.isPending}
              onClick={() => run.mutate({ tab: selectedTab })}
              type="button"
            >
              {importLabel(toImport)}
            </Button>
            <p className="type-caption text-muted-foreground">
              Titles and descriptions edited on the site are kept.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
