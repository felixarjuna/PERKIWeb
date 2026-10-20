"use client";

import { useState } from "react";
import { AdminSelect } from "../admin-controls";
import type { getCommunityOverview } from "./overview-model";

export default function RegistrationChart({
  months,
}: {
  months: ReturnType<typeof getCommunityOverview>["months"];
}) {
  const [metric, setMetric] = useState("count");
  const maximum = Math.max(
    1,
    ...months.map((month) =>
      metric === "count" ? month.count : month.cumulative
    )
  );
  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-xl bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="type-subheading">A growing fellowship</h2>
          <p className="type-caption mt-1 text-muted-foreground">
            Member profiles registered over time
          </p>
        </div>
        <AdminSelect
          id="chart-metric"
          label="Show"
          onChange={setMetric}
          value={metric}
        >
          <option value="count">Monthly registrations</option>
          <option value="cumulative">Cumulative registrations</option>
        </AdminSelect>
      </div>
      <ul
        aria-label="Registration history"
        className="flex h-56 items-end gap-2 sm:gap-4"
      >
        {months.map((month) => {
          const count = metric === "count" ? month.count : month.cumulative;
          return (
            <li
              aria-label={`${month.fullLabel}: ${count} registrations`}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              key={month.key}
            >
              <span className="type-caption tabular-nums">{count}</span>
              <div
                className="w-full rounded-t-md bg-primary/70 transition-[height] duration-300 motion-reduce:transition-none"
                style={{
                  height: `${(count / maximum) * 70}%`,
                  minHeight: count ? "4px" : "1px",
                }}
              />
              <span className="type-caption text-muted-foreground">
                {month.label.slice(0, months.length > 6 ? 1 : 3)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="type-caption text-muted-foreground">
        Based on retained member profiles, not attendance or net membership
        change.
      </p>
    </section>
  );
}
