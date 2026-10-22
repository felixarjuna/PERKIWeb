"use client";

import { keepPreviousData } from "@tanstack/react-query";
import React from "react";
import GatheringFiltersBar, {
  NoMatches,
  useGatheringFilters,
} from "~/components/gathering-filters";
import LoadMore from "~/components/load-more";
import Loader from "~/components/loader";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { filterQuery, isFiltered, NO_FILTERS } from "~/lib/gathering-filters";
import { weekOf } from "~/lib/schedule-team";
import { api, type RouterOutputs } from "~/trpc/react";
import ScheduleCard from "./schedule-card";

type Schedule = RouterOutputs["schedules"]["inRange"][number];

/** Upcoming and past gatherings start short; members load more on request. */
const PAGE_SIZE = 3;
/** Search results get a few more per page. */
const RESULTS_PAGE_SIZE = 5;

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-body rounded-xl bg-card p-4 text-muted-foreground sm:p-6">
      {children}
    </p>
  );
}

function ScheduleCollection({
  list,
  loadingMessage,
  empty,
}: {
  list: Schedule[] | undefined;
  loadingMessage: string;
  empty: React.ReactNode;
}) {
  if (!list) {
    return <Loader message={loadingMessage} />;
  }
  if (list.length === 0) {
    return empty;
  }
  return list.map((schedule) => (
    <ScheduleCard key={schedule.id} schedule={schedule} />
  ));
}

type ListInput = Parameters<typeof api.schedules.list.useInfiniteQuery>[0];

/** A section of gatherings loaded a page at a time. */
function PagedSection({
  title,
  input,
  noun,
  loadingMessage,
  empty,
}: {
  title: string;
  input: ListInput;
  noun: string;
  loadingMessage: string;
  empty: React.ReactNode;
}) {
  const query = api.schedules.list.useInfiniteQuery(input, {
    getNextPageParam: (page) => page.nextCursor,
    // Keep the current results on screen while a new search loads.
    placeholderData: keepPreviousData,
  });
  const list = query.data?.pages.flatMap((page) => page.items);
  return (
    <div className="space-y-4">
      <h2 className="type-heading">{title}</h2>
      {/* Always mounted so screen readers announce when nothing matches. */}
      <div
        aria-busy={query.isPlaceholderData}
        className="space-y-4"
        role="status"
      >
        <ScheduleCollection
          empty={empty}
          list={list}
          loadingMessage={loadingMessage}
        />
      </div>
      {list ? (
        <LoadMore
          count={list.length}
          hasNextPage={query.hasNextPage && !query.isPlaceholderData}
          key={JSON.stringify(input)}
          loading={query.isFetching}
          noun={noun}
          onLoadMore={() => {
            query.fetchNextPage();
          }}
        />
      ) : null}
    </div>
  );
}

export default function ScheduleList() {
  const [filters, setFilters] = useGatheringFilters();
  const q = useDebouncedValue(filters.q);
  const months = api.schedules.months.useQuery();
  const searched = { ...filters, q };
  return (
    <section className="mt-8 space-y-8">
      <GatheringFiltersBar
        filters={filters}
        label="Search schedules"
        months={months.data}
        onChange={setFilters}
        placeholder="Search titles, passages and names"
      />
      {isFiltered(searched) ? (
        <PagedSection
          empty={
            <NoMatches
              filters={searched}
              noun="gatherings"
              onClear={() => setFilters(NO_FILTERS)}
            />
          }
          input={{
            ...filterQuery(searched),
            limit: RESULTS_PAGE_SIZE,
            order: "desc",
          }}
          loadingMessage="Searching gatherings…"
          noun="results"
          title="Results"
        />
      ) : (
        <Sections />
      )}
    </section>
  );
}

/** This week in full, then upcoming and past gatherings a page at a time. */
function Sections() {
  // Fixed per visit, so the query inputs (and their cache keys) stay stable.
  const [week] = React.useState(() => weekOf(new Date()));
  // This week holds a gathering or two, so it loads in full.
  const { data: thisWeek } = api.schedules.inRange.useQuery(week);

  return (
    <>
      <div className="space-y-4">
        <h2 className="type-heading">This week</h2>
        <ScheduleCollection
          empty={
            <EmptyMessage>Nothing is scheduled for this week.</EmptyMessage>
          }
          list={thisWeek}
          loadingMessage="Loading this week…"
        />
      </div>
      <PagedSection
        empty={
          <EmptyMessage>
            Nothing is scheduled after this week yet. New gatherings appear here
            once they’re planned.
          </EmptyMessage>
        }
        input={{ from: week.before, limit: PAGE_SIZE, order: "asc" }}
        loadingMessage="Loading upcoming gatherings…"
        noun="upcoming gatherings"
        title="Upcoming"
      />
      <PagedSection
        empty={<EmptyMessage>Past gatherings will appear here.</EmptyMessage>}
        input={{ before: week.from, limit: PAGE_SIZE, order: "desc" }}
        loadingMessage="Loading previous gatherings…"
        noun="past gatherings"
        title="Previous"
      />
    </>
  );
}
