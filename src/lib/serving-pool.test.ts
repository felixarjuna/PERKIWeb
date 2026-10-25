import { describe, expect, it } from "vitest";
import {
  POOL_GROUPS,
  POOL_ROLES,
  poolStatus,
  scopesFor,
  termWindow,
} from "./serving-pool";

describe("serving pool rules", () => {
  it("leaves preachers out: they are guest speakers", () => {
    expect(POOL_ROLES).not.toContain("preacher");
    expect(POOL_GROUPS.flatMap((group) => group.entries)).not.toContainEqual(
      expect.objectContaining({ role: "preacher" })
    );
  });

  it("enters Litur/PA Besar as both Bible-study leader and service liturgist", () => {
    expect(POOL_GROUPS.find((group) => group.value === "litur_pa")).toEqual({
      entries: [
        { role: "leader", scope: "bible_study" },
        { role: "liturgist", scope: "church_service" },
      ],
      label: "Litur/PA Besar",
      value: "litur_pa",
    });
  });

  it("offers only the scopes a role is scheduled for", () => {
    expect(scopesFor("leader")).toEqual(["bible_study"]);
    expect(scopesFor("liturgist")).toEqual(["church_service"]);
    expect(scopesFor("multimedia")).toEqual(["church_service"]);
    expect(scopesFor("musician")).toEqual([
      "both",
      "church_service",
      "bible_study",
    ]);
  });

  it("shows a pause until its last day, then the stored status again", () => {
    const entry = { pausedUntil: "2026-11-30", status: "backup" as const };
    expect(poolStatus(entry, "2026-11-30")).toBe("paused");
    expect(poolStatus(entry, "2026-12-01")).toBe("backup");
    expect(
      poolStatus({ pausedUntil: null, status: "active" }, "2026-11-30")
    ).toBe("active");
  });

  it("finds the group term around a day", () => {
    const terms = [{ startsOn: "2026-04-01" }, { startsOn: "2026-10-01" }];
    expect(termWindow(terms, "2026-06-15")).toEqual({
      before: "2026-10-01",
      from: "2026-04-01",
    });
    expect(termWindow(terms, "2026-10-25")).toEqual({
      before: null,
      from: "2026-10-01",
    });
    expect(termWindow(terms, "2026-01-01")).toEqual({
      before: "2026-04-01",
      from: null,
    });
  });
});
