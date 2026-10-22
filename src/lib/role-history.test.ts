import { describe, expect, it } from "vitest";
import { joinedLine, roleChangeLine } from "./role-history";

describe("roleChangeLine", () => {
  it.each([
    [
      { fromRole: "member", source: null, toRole: "writer" },
      "You became a writer",
      null,
    ],
    [
      { fromRole: "writer", source: null, toRole: "mita" },
      "You became a mita",
      null,
    ],
    [
      { fromRole: "member", source: "request", toRole: "writer" },
      "You became a writer",
      "Your request was approved",
    ],
    [
      { fromRole: "member", source: "invite", toRole: "mita" },
      "You became a mita",
      "You were invited",
    ],
    [
      { fromRole: "mita", source: null, toRole: "member" },
      "Your role changed to member",
      null,
    ],
    [
      { fromRole: "member", source: null, toRole: "owner" },
      "You became the Dev",
      null,
    ],
  ] as const)("reads %o from the member's side", (change, title, detail) => {
    expect(roleChangeLine(change)).toEqual({ detail, title });
  });
});

describe("joinedLine", () => {
  it("dates a known join day in Aachen time", () => {
    expect(
      joinedLine({ at: new Date("2025-03-04T23:30:00.000Z"), exact: true })
    ).toEqual({ date: "5 March 2025", title: "You joined PERKI" });
  });

  it("only says by when for a backfilled date", () => {
    expect(
      joinedLine({ at: new Date("2025-01-10T12:00:00.000Z"), exact: false })
    ).toEqual({ date: "By January 2025", title: "You joined PERKI" });
  });
});
