import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RouterOutputs } from "~/trpc/react";
import ScheduleCard from "./schedule-card";

type Schedule = RouterOutputs["schedules"]["inRange"][number];

const schedule = (overrides: Partial<Schedule>): Schedule => ({
  accommodation: null,
  bibleVerse: "Efesus 5:1-21",
  cancelled: false,
  cleaningGroup: "Group 3",
  cookingGroup: null,
  createdAt: null,
  date: new Date("2026-10-31T14:30:00Z"),
  description: "",
  flags: [],
  generated: {},
  groupMembers: { cleaning: null, cooking: null },
  id: 1,
  leader: "Ana Putri",
  multimedia: null,
  musician: "Toni Setiawan",
  noteWriter: "Kezia Singgih",
  preacher: null,
  published: true,
  takeawayIds: [],
  team: [
    { image: null, name: "Ana Putri", role: "leader" },
    { image: null, name: "Toni Setiawan", role: "musician" },
  ],
  title: "Heroes of Faith",
  type: "bible_study",
  updatedAt: null,
  ...overrides,
});

describe("ScheduleCard", () => {
  it("shows the gathering's flags as chips", () => {
    render(
      <ScheduleCard schedule={schedule({ flags: ["online", "communion"] })} />
    );
    const chips = screen.getByRole("list", { name: "About this gathering" });
    expect(
      within(chips)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual(["Holy Communion", "Online"]);
    expect(screen.getByText("Ana Putri")).toBeTruthy();
  });

  it("crosses out a cancelled gathering and leaves out its team and duties", () => {
    render(
      <ScheduleCard
        schedule={schedule({ cancelled: true, takeawayIds: [4] })}
      />
    );
    expect(screen.getByText("Cancelled")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Heroes of Faith" }).className
    ).toContain("line-through");
    expect(screen.queryByText("Ana Putri")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Cleaning · Group 3" })
    ).toBeNull();
    // Its takeaways stay.
    expect(screen.getByRole("link", { name: "Read takeaway" })).toBeTruthy();
  });
});
