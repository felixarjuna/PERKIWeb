import { describe, expect, it } from "vitest";
import { takeawayDueAt } from "./takeaway-deadline";

describe("takeaway deadlines in Aachen", () => {
  it("uses the following week when the gathering is on the deadline weekday", () => {
    expect(takeawayDueAt(new Date("2026-10-23T13:30:00Z"), 5)).toEqual(
      new Date("2026-10-30T22:59:59.999Z")
    );
  });
  it("uses the local gathering day even when UTC is still the previous day", () => {
    expect(takeawayDueAt(new Date("2026-04-02T22:30:00Z"), 5)).toEqual(
      new Date("2026-04-10T21:59:59.999Z")
    );
  });
  it("crosses spring DST using calendar days rather than 24-hour offsets", () => {
    expect(takeawayDueAt(new Date("2026-03-28T14:30:00Z"), 7)).toEqual(
      new Date("2026-03-29T21:59:59.999Z")
    );
  });
});
