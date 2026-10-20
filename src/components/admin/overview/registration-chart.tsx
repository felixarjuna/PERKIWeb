"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import { AdminSegmented } from "../admin-controls";
import type { getCommunityOverview } from "./overview-model";

type Month = ReturnType<typeof getCommunityOverview>["months"][number];

const METRICS = [
  { label: "Monthly", value: "count" },
  { label: "Total", value: "cumulative" },
] as const;
const RANGES = [
  { label: "6M", value: "6" },
  { label: "12M", value: "12" },
] as const;
const NICE_STEPS = [1, 2, 5] as const;
const TARGET_TICKS = 3;
const DECADE = 10;

/** Clean whole-number axis ticks (0, 2, 4 … / 0, 5, 10 …) covering `maximum`. */
export function axisTicks(maximum: number) {
  const rough = Math.max(1, maximum / TARGET_TICKS);
  const magnitude = DECADE ** Math.floor(Math.log10(rough));
  const step =
    (NICE_STEPS.find((nice) => nice * magnitude >= rough) ?? DECADE) *
    magnitude;
  const top = Math.max(step, Math.ceil(maximum / step) * step);
  return Array.from({ length: top / step + 1 }, (_, index) => index * step);
}

const percent = (value: number, top: number) => `${(value / top) * 100}%`;

export default function RegistrationChart({
  months,
  range,
  missingDates,
  onRangeChange,
  onSelectMonth,
}: {
  months: Month[];
  range: 6 | 12;
  missingDates: number;
  onRangeChange: (range: 6 | 12) => void;
  onSelectMonth: (month: string) => void;
}) {
  const [metric, setMetric] = useState("count");
  const cumulative = metric === "cumulative";
  const unitOf = (value: number) => {
    if (cumulative) {
      return "members in total";
    }
    return value === 1 ? "registration" : "registrations";
  };
  const metricValue = (month: Month) =>
    cumulative ? month.cumulative : month.count;
  const ticks = axisTicks(Math.max(...months.map(metricValue)));
  const top = ticks.at(-1) ?? 1;
  const selected = months.at(-1);
  const points = months
    .map(
      (month, index) =>
        `${((index + 0.5) / months.length) * 100},${100 - (metricValue(month) / top) * 100}`
    )
    .join(" ");
  return (
    <section className="flex min-h-80 min-w-0 flex-col gap-3 rounded-xl bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="type-subheading">Registrations</h2>
          <p className="type-caption text-muted-foreground">
            {cumulative
              ? "Member profiles in total, by month"
              : "New member profiles per month"}
          </p>
        </div>
        <div className="flex gap-2">
          <AdminSegmented
            label="Chart values"
            onChange={setMetric}
            options={METRICS}
            value={metric}
          />
          <AdminSegmented
            label="Chart range"
            onChange={(value) => onRangeChange(value === "12" ? 12 : 6)}
            options={RANGES}
            value={String(range)}
          />
        </div>
      </div>
      <div className="flex min-h-40 flex-1 gap-2 pt-6">
        <div aria-hidden="true" className="relative w-6 shrink-0">
          {ticks.map((tick) => (
            <span
              className="type-caption absolute right-0 translate-y-1/2 text-muted-foreground tabular-nums"
              key={tick}
              style={{ bottom: percent(tick, top) }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {ticks.map((tick) => (
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 border-t",
                tick ? "border-border/30" : "border-border/70"
              )}
              key={tick}
              style={{ bottom: percent(tick, top) }}
            />
          ))}
          {cumulative ? (
            <svg
              aria-hidden="true"
              className="absolute inset-0 size-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <polygon
                className="fill-primary/10"
                points={`${(0.5 / months.length) * 100},100 ${points} ${((months.length - 0.5) / months.length) * 100},100`}
              />
              <polyline
                className="fill-none stroke-primary"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : null}
          <ul
            aria-label="Registration history"
            className="absolute inset-0 flex"
          >
            {months.map((month) => {
              const value = metricValue(month);
              const isSelected = month.key === selected?.key;
              const height = percent(value, top);
              return (
                <li className="flex min-w-0 flex-1" key={month.key}>
                  <button
                    aria-label={`${month.fullLabel}: ${value} ${unitOf(value)}. Show this month`}
                    aria-pressed={isSelected}
                    className="group relative flex h-full w-full justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onSelectMonth(month.key)}
                    type="button"
                  >
                    {cumulative ? (
                      <span
                        className={cn(
                          "absolute size-2.5 translate-y-1/2 rounded-full ring-2 ring-card",
                          isSelected
                            ? "bg-primary"
                            : "bg-primary/50 group-hover:bg-primary"
                        )}
                        style={{ bottom: height }}
                      />
                    ) : (
                      <span
                        className={cn(
                          "absolute bottom-0 w-[min(60%,1.5rem)] rounded-t-[4px] transition-colors",
                          isSelected
                            ? "bg-primary"
                            : "bg-primary/30 group-hover:bg-primary/60"
                        )}
                        style={{ height, minHeight: value ? 2 : 0 }}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "type-caption pointer-events-none absolute z-10 mb-2 whitespace-nowrap tabular-nums",
                        isSelected
                          ? "text-foreground"
                          : "rounded-md bg-popover px-2 py-1 opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                      )}
                      style={{ bottom: height }}
                    >
                      {isSelected ? value : `${month.label} · ${value}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div aria-hidden="true" className="ml-8 flex">
        {months.map((month) => (
          <span
            className={cn(
              "type-caption flex-1 text-center",
              month.key === selected?.key
                ? "text-foreground"
                : "text-muted-foreground"
            )}
            key={month.key}
          >
            <span className={cn(months.length > 6 && "max-sm:hidden")}>
              {month.label}
            </span>
            {months.length > 6 ? (
              <span className="sm:hidden">{month.label.slice(0, 1)}</span>
            ) : null}
          </span>
        ))}
      </div>
      <p className="type-caption text-muted-foreground">
        Retained profiles only, not attendance.
        {missingDates
          ? ` ${missingDates} without a registration date are left out.`
          : ""}
      </p>
    </section>
  );
}
