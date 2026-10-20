import { expect, it } from "vitest";
import { filterSchedules, filterTakeaways } from "./content-filters";

const records = [
  {
    date: new Date("2026-10-22"),
    description: "Weekly study",
    id: 1,
    preacher: "John",
    title: "Faith",
    type: "bible_study",
  },
  {
    date: new Date("2026-09-22"),
    description: "Church",
    id: 2,
    preacher: "Anna",
    title: "Hope",
    type: "church_service",
  },
];
it("combines schedule search, type, time and direction without hiding filters", () => {
  expect(
    filterSchedules(
      records,
      { order: "asc", period: "upcoming", q: " JOHN ", type: "bible_study" },
      new Date("2026-10-20")
    ).map((row) => row.id)
  ).toEqual([1]);
  expect(
    filterSchedules(
      records,
      { order: "asc", period: "all", q: "", type: "all" },
      new Date("2026-10-20")
    ).map((row) => row.id)
  ).toEqual([2, 1]);
  expect(
    filterSchedules(
      records,
      { order: "asc", period: "all", q: "none", type: "all" },
      new Date("2026-10-20")
    )
  ).toEqual([]);
});
it("searches takeaway content and sorts by the associated event date", () => {
  const notes = records.map((schedule) => ({
    schedules: schedule,
    takeaways: { id: schedule.id, keypoints: "Growing in grace" },
  }));
  expect(
    filterTakeaways(notes, { order: "desc", q: "GRACE", type: "bible_study" })
  ).toHaveLength(1);
  expect(
    filterTakeaways(notes, { order: "desc", q: "", type: "all" }).map(
      (row) => row.takeaways.id
    )
  ).toEqual([1, 2]);
});

it("finds a Bible study by the leader displayed as its speaker", () => {
  const study = {
    date: new Date("2026-10-22"),
    description: "Study",
    id: 3,
    leader: "Maria",
    preacher: null,
    title: "Weekly study",
    type: "bible_study",
  };
  expect(
    filterSchedules(
      [study],
      { order: "asc", period: "all", q: "maria", type: "all" },
      new Date("2026-10-20")
    )
  ).toHaveLength(1);
});
