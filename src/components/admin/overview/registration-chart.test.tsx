import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RegistrationChart, { axisTicks } from "./registration-chart";

const bucket = (
  key: string,
  label: string,
  fullLabel: string,
  count: number,
  cumulative: number
) => ({
  count,
  cumulative,
  end: new Date(),
  fullLabel,
  key,
  label,
  members: [],
  shortLabel: label.slice(0, 1),
  start: new Date(),
});
const months = [
  bucket("2026-09", "Sep", "September 2026", 2, 5),
  bucket("2026-10", "Oct", "October 2026", 1, 6),
];

describe("registration chart", () => {
  it("rounds the axis to clean ticks", () => {
    expect(axisTicks(0)).toEqual([0, 1]);
    expect(axisTicks(4)).toEqual([0, 2, 4]);
    expect(axisTicks(7)).toEqual([0, 5, 10]);
    expect(axisTicks(44)).toEqual([0, 20, 40, 60]);
  });

  it("opens a period's registrations and switches ranges", async () => {
    const onSelectBucket = vi.fn();
    const onRangeChange = vi.fn();
    render(
      <RegistrationChart
        buckets={months}
        missingDates={0}
        onRangeChange={onRangeChange}
        onSelectBucket={onSelectBucket}
        range="6m"
        unit="month"
      />
    );
    await userEvent.click(
      screen.getByRole("button", {
        name: "September 2026: 2 registrations. See who registered",
      })
    );
    expect(onSelectBucket).toHaveBeenCalledWith("2026-09");
    await userEvent.click(screen.getByRole("radio", { name: "Total" }));
    expect(
      screen.getByRole("button", {
        name: "October 2026: 6 members in total. See who registered",
      })
    ).toBeTruthy();
    for (const label of ["1Y", "2Y", "5Y"]) {
      // biome-ignore lint/performance/noAwaitInLoops: clicks run in order.
      await userEvent.click(screen.getByRole("radio", { name: label }));
    }
    expect(onRangeChange.mock.calls.map(([range]) => range)).toEqual([
      "1y",
      "2y",
      "5y",
    ]);
  });
});
