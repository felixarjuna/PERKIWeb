"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";
import GatheringFiltersBar, {
  NoMatches,
  useGatheringFilters,
} from "~/components/gathering-filters";
import LoadMore from "~/components/load-more";
import Loader from "~/components/loader";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import {
  filterQuery,
  type GatheringFilters,
  isFiltered,
  NO_FILTERS,
} from "~/lib/gathering-filters";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  contributorNames,
  fellowshipLabel,
  preview,
  serviceDate,
} from "./takeaway-format";

type Takeaway = RouterOutputs["takeaways"]["getTakeaways"]["items"][number];

const PAGE_SIZE = 5;

export default function TakeawayList() {
  const [filters, setFilters] = useGatheringFilters();
  // Search runs on the server, across every takeaway, once typing pauses.
  const q = useDebouncedValue(filters.q);
  const input = filterQuery({ ...filters, q });
  const months = api.takeaways.months.useQuery();
  const pages = api.takeaways.getTakeaways.useInfiniteQuery(
    { ...input, limit: PAGE_SIZE },
    {
      getNextPageParam: (page) => page.nextCursor,
      // Keep the current results on screen while a new search loads.
      placeholderData: keepPreviousData,
    }
  );

  const takeaways = React.useMemo(
    () => pages.data?.pages.flatMap((page) => page.items),
    [pages.data]
  );

  if (takeaways === undefined) {
    return <Loader className="mt-8" message="Loading takeaways…" />;
  }

  return (
    <div className="space-y-4">
      <GatheringFiltersBar
        filters={filters}
        label="Search takeaways"
        months={months.data}
        onChange={setFilters}
        placeholder="Search titles, passages and notes"
      />

      {/* Always mounted so screen readers announce when nothing matches. */}
      <div role="status">
        {takeaways.length === 0 ? (
          <Empty
            filters={{ ...filters, q }}
            onClear={() => setFilters(NO_FILTERS)}
          />
        ) : null}
      </div>

      {takeaways.length > 0 ? (
        <ul aria-busy={pages.isPlaceholderData} className="space-y-4">
          {takeaways.map((item) => (
            <li key={item.takeaways.id}>
              <TakeawayCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}

      <LoadMore
        count={takeaways.length}
        hasNextPage={pages.hasNextPage && !pages.isPlaceholderData}
        key={JSON.stringify(input)}
        loading={pages.isFetching}
        noun="takeaways"
        onLoadMore={() => {
          pages.fetchNextPage();
        }}
      />
    </div>
  );
}

/** Says why the list is empty: nothing written yet, or nothing matches. */
function Empty({
  filters,
  onClear,
}: {
  filters: GatheringFilters;
  onClear: () => void;
}) {
  if (isFiltered(filters)) {
    return <NoMatches filters={filters} noun="takeaways" onClear={onClear} />;
  }
  return (
    <p className="type-body rounded-xl bg-card p-4 text-muted-foreground sm:p-6">
      No takeaways yet. Notes from services and Bible studies appear here once
      they’re written.
    </p>
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
