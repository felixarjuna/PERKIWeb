import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Duty } from "~/lib/duties";
import DutiesView, { type DutyGathering } from "./duties-view";

const now = new Date("2026-10-21T12:00:00Z");

const gathering = (
  id: number,
  date: string,
  title: string,
  duties: Duty[]
): DutyGathering => ({
  accommodation: null,
  bibleVerse: "Efesus 5:1-21",
  cancelled: false,
  cleaningGroup: "Group 3",
  cookingGroup: null,
  createdAt: null,
  date: new Date(date),
  description: "",
  duties,
  flags: [],
  groupMembers: { cleaning: null, cooking: null },
  id,
  leader: "Ana Putri",
  multimedia: null,
  musician: "Toni Setiawan",
  noteWriter: "Kezia Singgih",
  preacher: null,
  takeawayIds: [],
  team: [
    { image: null, name: "Ana Putri", role: "leader" },
    { image: null, name: "Toni Setiawan", role: "musician" },
  ],
  title,
  type: "bible_study",
  updatedAt: null,
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

  it("shows each gathering like the schedule, with the member's part marked", () => {
    render(
      <DutiesView
        now={now}
        past={[
          gathering(1, "2026-10-03T13:30:00Z", "Recent", [
            { role: "musician" },
          ]),
        ]}
        upcoming={[
          gathering(2, "2026-10-24T13:30:00Z", "Soon", [
            { role: "leader" },
            { group: "Group 3", role: "cleaning" },
          ]),
          gathering(3, "2026-11-07T14:30:00Z", "Later", [{ role: "musician" }]),
        ]}
      />
    );

    const week = screen.getByRole("region", { name: "This week" });
    expect(
      within(week).getByRole("link", { name: "Soon" }).getAttribute("href")
    ).toBe("/schedule/2");
    const part = within(week).getByRole("list", { name: "Your part" });
    expect(within(part).getByText("Leader")).toBeTruthy();
    expect(within(part).getByText("Your group cleans")).toBeTruthy();
    // The rest of the team, as on the schedule.
    expect(within(week).getByText("Toni Setiawan")).toBeTruthy();

    const upcoming = screen.getByRole("region", { name: "Upcoming" });
    expect(within(upcoming).getByRole("link", { name: "Later" })).toBeTruthy();

    expect(screen.queryByRole("link", { name: "Recent" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show 1 past duty" }));
    expect(screen.getByRole("link", { name: "Recent" })).toBeTruthy();
  });

  it("says so when only past duties are left", () => {
    render(
      <DutiesView
        now={now}
        past={[
          gathering(1, "2026-10-03T13:30:00Z", "Recent", [
            { role: "musician" },
          ]),
        ]}
        upcoming={[]}
      />
    );
    expect(
      screen.getByText("There's nothing coming up for you on the schedule yet.")
    ).toBeTruthy();
  });
});
