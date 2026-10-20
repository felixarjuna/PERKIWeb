"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { AdminSelect, QueryMessage } from "../admin-controls";
import { getMemberLocations } from "../members/member-model";
import BirthdayList from "./birthday-list";
import { getCommunityOverview } from "./overview-model";
import RegistrationChart from "./registration-chart";

const MONTH_FORMAT = "yyyy-MM";

function MonthStepper({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  const value = DateTime.fromFormat(month, MONTH_FORMAT);
  const step = (months: number) =>
    onChange(value.plus({ months }).toFormat(MONTH_FORMAT));
  return (
    <fieldset className="flex h-10 w-full items-center gap-1 rounded-md bg-secondary p-1 sm:w-auto">
      <legend className="sr-only">Month</legend>
      <Button
        aria-label="Previous month"
        className="size-8"
        onClick={() => step(-1)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <output
        aria-live="polite"
        className="type-body-sm min-w-32 flex-1 text-center tabular-nums"
      >
        {value.toFormat("LLLL yyyy")}
      </output>
      <Button
        aria-label="Next month"
        className="size-8"
        onClick={() => step(1)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </fieldset>
  );
}

export default function CommunityOverview() {
  const query = api.profiles.getUserProfiles.useQuery();
  const currentMonth = DateTime.now()
    .setZone("Europe/Berlin")
    .toFormat(MONTH_FORMAT);
  const [month, setMonth] = useState(currentMonth);
  const [location, setLocation] = useState("");
  const [range, setRange] = useState<6 | 12>(6);
  const records = query.data ?? [];
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <MonthStepper month={month} onChange={setMonth} />
      <AdminSelect
        className="w-full sm:w-48"
        hideLabel
        id="overview-location"
        label="Location"
        onChange={setLocation}
        options={[
          { label: "All locations", value: "" },
          ...getMemberLocations(records),
        ]}
        value={location}
      />
      {month === currentMonth ? null : (
        <Button
          onClick={() => setMonth(currentMonth)}
          size="sm"
          type="button"
          variant="ghost"
        >
          This month
        </Button>
      )}
    </div>
  );
  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {controls}
        <QueryMessage>Gathering your community overview…</QueryMessage>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="flex flex-col gap-6">
        {controls}
        <QueryMessage
          error
          onRetry={() => {
            query.refetch();
          }}
        />
      </div>
    );
  }
  const data = getCommunityOverview(records, {
    location,
    month,
    now: new Date(),
    range,
  });
  const difference = data.current - data.previous;
  const change = difference >= 0 ? `+${difference}` : String(difference);
  const tiles = [
    {
      detail: "registered",
      label: "Members",
      value: data.total,
    },
    {
      detail: `${change} vs ${data.previousLabel}`,
      label: `New in ${data.shortMonthLabel}`,
      value: data.current,
    },
    {
      detail: `in ${data.shortMonthLabel}`,
      label: "Birthdays",
      value: data.birthdays.length,
    },
  ];
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {controls}
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {tiles.map((tile) => (
          <div
            className="flex min-w-0 flex-col gap-1 rounded-xl bg-card p-3 sm:p-4"
            key={tile.label}
          >
            <dt className="type-caption truncate text-muted-foreground">
              {tile.label}
            </dt>
            <dd className="type-figure">{tile.value}</dd>
            <dd className="type-caption truncate text-muted-foreground">
              {tile.detail}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-4 lg:h-96 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <RegistrationChart
          missingDates={data.missingDates}
          months={data.months}
          onRangeChange={setRange}
          onSelectMonth={setMonth}
          range={range}
        />
        <BirthdayList members={data.birthdays} month={data.monthLabel} />
      </div>
    </div>
  );
}
