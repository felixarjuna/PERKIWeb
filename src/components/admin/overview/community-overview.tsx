"use client";

import { DateTime } from "luxon";
import Link from "next/link";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { AdminSelect, QueryMessage } from "../admin-controls";
import { getMemberLocations } from "../members/member-model";
import BirthdayList from "./birthday-list";
import { getCommunityOverview } from "./overview-model";
import RegistrationChart from "./registration-chart";

export default function CommunityOverview() {
  const query = api.profiles.getUserProfiles.useQuery();
  const [month, setMonth] = useState(() =>
    DateTime.now().setZone("Europe/Berlin").toFormat("yyyy-MM")
  );
  const [location, setLocation] = useState("");
  const [range, setRange] = useState<6 | 12>(6);
  const records = query.data ?? [];
  const controls = (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label
          className="type-caption text-muted-foreground"
          htmlFor="overview-month"
        >
          Month
        </Label>
        <Input
          className="h-11"
          id="overview-month"
          onChange={(event) => {
            if (event.target.value) {
              setMonth(event.target.value);
            }
          }}
          type="month"
          value={month}
        />
      </div>
      <AdminSelect
        id="overview-location"
        label="Location"
        onChange={setLocation}
        value={location}
      >
        <option value="">All locations</option>
        {getMemberLocations(records).map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </AdminSelect>
      <AdminSelect
        id="overview-range"
        label="Chart range"
        onChange={(value) => setRange(value === "12" ? 12 : 6)}
        value={String(range)}
      >
        <option value="6">Last 6 months</option>
        <option value="12">Last 12 months</option>
      </AdminSelect>
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
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {controls}
      <div className="grid gap-3 sm:grid-cols-3">
        <section className="flex flex-col gap-3 rounded-xl bg-primary p-5 text-primary-foreground sm:p-6">
          <p className="type-body-sm">Registered members</p>
          <p className="type-title tabular-nums">{data.total}</p>
          <p className="type-caption">People in your community directory</p>
        </section>
        <section className="flex flex-col gap-3 rounded-xl bg-card p-5 sm:p-6">
          <p className="type-body-sm text-muted-foreground">
            New registrations
          </p>
          <p className="type-title tabular-nums">{data.current}</p>
          <p className="type-caption text-muted-foreground">
            {change} compared with the previous month
          </p>
        </section>
        <section className="flex flex-col gap-3 rounded-xl bg-card p-5 sm:p-6">
          <p className="type-body-sm text-muted-foreground">
            Birthdays this month
          </p>
          <p className="type-title tabular-nums">{data.birthdays.length}</p>
          <p className="type-caption text-muted-foreground">
            {data.monthLabel} · A reason to reach out
          </p>
        </section>
      </div>
      {data.missingDates ? (
        <p className="type-caption text-muted-foreground">
          {data.missingDates} profiles have no valid registration date and are
          excluded from the chart.
        </p>
      ) : null}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <RegistrationChart months={data.months} />
        <BirthdayList members={data.birthdays} month={data.monthLabel} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-5">
        <div>
          <h2 className="type-subheading">Keep the community in the loop</h2>
          <p className="type-body-sm mt-1 text-muted-foreground">
            Prepare the next gathering and share what you learned.
          </p>
        </div>
        <div className="type-body-sm flex flex-wrap gap-5">
          <Link
            className="underline underline-offset-4"
            href="/admin/schedules"
          >
            Manage schedules
          </Link>
          <Link
            className="underline underline-offset-4"
            href="/admin/takeaways"
          >
            Manage takeaways
          </Link>
        </div>
      </div>
    </div>
  );
}
