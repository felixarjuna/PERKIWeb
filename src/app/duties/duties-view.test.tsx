import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DutiesView from "./duties-view";

const now = new Date("2026-10-21T12:00:00Z");
const day = (id: number, date: string, title: string) => ({
  date: new Date(date),
  id,
  title,
  type: "bible_study" as const,
});

describe("DutiesView", () => {
  it("explains what shows here when the member has no duties", () => {
    render(<DutiesView now={now} past={[]} upcoming={[]} />);
    expect(
      screen.getByText("There are no duties linked to you yet")
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "See the schedule" })
        .getAttribute("href")
    ).toBe("/schedule");
  });

  it("puts this week first and keeps past duties behind a toggle", () => {
    render(
      <DutiesView
        now={now}
        past={[
          {
            ...day(1, "2026-10-03T13:30:00Z", "Recent"),
            duties: [{ role: "musician" }],
          },
        ]}
        upcoming={[
          {
            ...day(2, "2026-10-24T13:30:00Z", "Soon"),
            duties: [
              { role: "leader" },
              { group: "Group 3", role: "cleaning" },
            ],
          },
          {
            ...day(3, "2026-11-07T14:30:00Z", "Later"),
            duties: [{ role: "musician" }],
          },
        ]}
      />
    );

    const week = screen.getByRole("region", { name: "This week" });
    expect(
      within(week).getByRole("link", { name: "Soon" }).getAttribute("href")
    ).toBe("/schedule/2");
    expect(within(week).getByText("Leader")).toBeTruthy();
    expect(within(week).getByText("Cleaning · Group 3")).toBeTruthy();
    const later = screen.getByRole("region", { name: "Coming up" });
    expect(within(later).getByRole("link", { name: "Later" })).toBeTruthy();

    expect(screen.queryByRole("link", { name: "Recent" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Past duties (1)" }));
    expect(screen.getByRole("link", { name: "Recent" })).toBeTruthy();
  });

  it("says so when only past duties are left", () => {
    render(
      <DutiesView
        now={now}
        past={[
          {
            ...day(1, "2026-10-03T13:30:00Z", "Recent"),
            duties: [{ role: "musician" }],
          },
        ]}
        upcoming={[]}
      />
    );
    expect(
      screen.getByText("There's nothing coming up for you on the schedule yet.")
    ).toBeTruthy();
  });
});
