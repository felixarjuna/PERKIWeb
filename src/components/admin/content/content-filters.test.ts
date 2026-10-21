import { expect, it } from "vitest";
import { scheduleQuery, takeawayQuery } from "./content-filters";

const now = new Date("2026-10-20T12:00:00Z");

it("turns the schedule toolbar into a server query", () => {
  expect(
    scheduleQuery(
      { order: "asc", period: "upcoming", q: " JOHN ", type: "bible_study" },
      now
    )
  ).toEqual({ from: now, order: "asc", q: "JOHN", type: "bible_study" });
  expect(
    scheduleQuery({ order: "desc", period: "past", q: "", type: "all" }, now)
  ).toEqual({ before: now, order: "desc", q: "", type: "all" });
  expect(
    scheduleQuery({ order: "asc", period: "all", q: "", type: "all" }, now)
  ).toEqual({ order: "asc", q: "", type: "all" });
});

it("falls back to safe values for anything the server doesn't know", () => {
  expect(takeawayQuery({ order: "", q: "grace", type: "concert" })).toEqual({
    order: "desc",
    q: "grace",
    type: "all",
  });
});
