"use client";

import { ChevronRight, ListFilter } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { AdminSearch } from "~/components/admin/admin-controls";
import Loader from "~/components/loader";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { type EventTypeEnum, eventTypeEnum } from "~/lib/db/schema/schema";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  contributorNames,
  fellowshipLabel,
  matchesQuery,
  preview,
  serviceDate,
} from "./takeaway-format";

type Takeaway = RouterOutputs["takeaways"]["getTakeaways"][number];

/** The search box's text lives in `?q=`, so a search can be shared or reloaded. */
function useQueryParam() {
  const initial = useSearchParams().get("q") ?? "";
  const [query, setQuery] = React.useState(initial);
  const update = (value: string) => {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("q", value);
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState(null, "", url);
  };
  return [query, update] as const;
}

export default function TakeawayList() {
  const { data } = api.takeaways.getTakeaways.useQuery();
  const [type, setType] = React.useState<
    "church_service" | "bible_study" | "all"
  >("all");
  const [query, setQuery] = useQueryParam();
  const deferredQuery = React.useDeferredValue(query.trim());

  const takeaways = React.useMemo(
    () =>
      data?.filter(
        ({ schedules: schedule, takeaways: takeaway }) =>
          (type === "all" || schedule.type === type) &&
          matchesQuery(
            [
              schedule.title,
              schedule.bibleVerse,
              schedule.preacher,
              takeaway.keypoints,
              contributorNames(takeaway.contributors),
            ],
            deferredQuery
          )
      ),
    [data, type, deferredQuery]
  );

  if (takeaways === undefined) {
    return <Loader className="mt-8" message="Loading takeaways…" />;
  }

  return (
    <div className="space-y-4">
      <search className="flex flex-col gap-3 sm:flex-row">
        <AdminSearch
          className="sm:flex-1"
          id="takeaway-search"
          label="Search takeaways"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles, passages and notes"
          value={query}
        />
        <Select
          onValueChange={(value) => {
            if (
              value === "all" ||
              value === "church_service" ||
              value === "bible_study"
            ) {
              setType(value);
            }
          }}
          value={type}
        >
          <SelectTrigger
            aria-label="Fellowship type"
            className="sm:w-56"
            variant="filter"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ListFilter aria-hidden="true" className="size-3.5 shrink-0" />
              <SelectValue className="truncate" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All fellowships</SelectItem>
              {eventTypeEnum.enumValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {fellowshipLabel(value)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </search>

      {/* Always mounted so screen readers announce when nothing matches. */}
      <div role="status">
        {takeaways.length === 0 ? (
          <EmptyState
            onClearSearch={() => setQuery("")}
            onShowAll={() => setType("all")}
            query={deferredQuery}
            type={type}
          />
        ) : null}
      </div>

      {takeaways.length > 0 ? (
        <ul className="space-y-4">
          {takeaways.map((item) => (
            <li key={item.takeaways.id}>
              <TakeawayCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Says why the list is empty and offers the one action that refills it. */
function EmptyState({
  query,
  type,
  onClearSearch,
  onShowAll,
}: {
  query: string;
  type: EventTypeEnum | "all";
  onClearSearch: () => void;
  onShowAll: () => void;
}) {
  // Mid-sentence, so only "Bible" keeps its capital.
  const kind = {
    all: "",
    bible_study: "Bible study ",
    church_service: "church service ",
  }[type];
  let message =
    "No takeaways yet. Notes from services and Bible studies appear here once they’re written.";
  let action: { label: string; onClick: () => void } | null = null;
  if (query) {
    message = `No ${kind}takeaways match “${query}”.`;
    action = { label: "Clear search", onClick: onClearSearch };
  } else if (type !== "all") {
    message = `No ${kind}takeaways yet.`;
    action = { label: "Show all fellowships", onClick: onShowAll };
  }
  return (
    <div className="rounded-xl bg-card p-4 sm:p-6">
      <p className="type-body text-muted-foreground">{message}</p>
      {action ? (
        <Button
          className="mt-3"
          onClick={action.onClick}
          size="sm"
          type="button"
          variant="secondary"
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

function TakeawayCard({ item }: { item: Takeaway }) {
  const { schedules: schedule, takeaways: takeaway } = item;
  const contributors = contributorNames(takeaway.contributors);
  return (
    <article className="relative rounded-xl bg-card p-4 transition-colors duration-150 hover:bg-accent/40 sm:p-6">
      <p className="type-eyebrow text-muted-foreground">
        {fellowshipLabel(schedule.type)} · {serviceDate(schedule.date)}
      </p>
      <h2 className="type-subheading mt-2 break-words">
        <Link
          className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          href={`/takeaway/${takeaway.id}`}
        >
          {schedule.title}
        </Link>
      </h2>
      <p className="type-body-sm mt-1 text-muted-foreground">
        {[schedule.bibleVerse, schedule.preacher].filter(Boolean).join(" · ")}
      </p>
      <p className="type-body mt-3 line-clamp-3 whitespace-pre-line text-pretty">
        {preview(takeaway.keypoints)}
      </p>
      <div className="type-body-sm mt-4 flex items-center justify-between gap-3 text-muted-foreground">
        <p className="min-w-0">
          {contributors ? `Shared by ${contributors}` : null}
        </p>
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center gap-1 text-foreground"
        >
          Read
          <ChevronRight className="size-4" />
        </span>
      </div>
    </article>
  );
}
