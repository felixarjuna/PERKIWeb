import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RegistrationChart, { axisTicks } from "./registration-chart";

const months = [
  {
    count: 2,
    cumulative: 5,
    fullLabel: "September 2026",
    key: "2026-09",
    label: "Sep",
  },
  {
    count: 1,
    cumulative: 6,
    fullLabel: "October 2026",
    key: "2026-10",
    label: "Oct",
  },
];

describe("registration chart", () => {
  it("rounds the axis to clean ticks", () => {
    expect(axisTicks(0)).toEqual([0, 1]);
    expect(axisTicks(4)).toEqual([0, 2, 4]);
    expect(axisTicks(7)).toEqual([0, 5, 10]);
    expect(axisTicks(44)).toEqual([0, 20, 40, 60]);
  });

  it("marks the selected month and selects another on click", async () => {
    const onSelectMonth = vi.fn();
    render(
      <RegistrationChart
        missingDates={0}
        months={months}
        onRangeChange={vi.fn()}
        onSelectMonth={onSelectMonth}
        range={6}
      />
    );
    expect(
      screen
        .getByRole("button", {
          name: "October 2026: 1 registration. Show this month",
        })
        .getAttribute("aria-pressed")
    ).toBe("true");
    await userEvent.click(
      screen.getByRole("button", {
        name: "September 2026: 2 registrations. Show this month",
      })
    );
    expect(onSelectMonth).toHaveBeenCalledWith("2026-09");
    await userEvent.click(screen.getByRole("radio", { name: "Total" }));
    expect(
      screen.getByRole("button", {
        name: "October 2026: 6 members in total. Show this month",
      })
    ).toBeTruthy();
  });
});
