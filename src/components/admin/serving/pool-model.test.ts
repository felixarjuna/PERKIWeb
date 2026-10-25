import { describe, expect, it } from "vitest";
import { matchesPool, readPoolFilters } from "./pool-model";

const entry = {
  role: "musician" as const,
  status: "paused" as const,
  user: { email: "ana@example.com", name: "Ana Putri" },
};

describe("serving pool filters", () => {
  it("reads one role and one status from the URL, ignoring unknown values", () => {
    expect(
      readPoolFilters(new URLSearchParams("q=ana&role=musician&status=paused"))
    ).toEqual({ q: "ana", role: "musician", status: "paused" });
    expect(
      readPoolFilters(new URLSearchParams("role=preacher&status=gone"))
    ).toEqual({ q: "", role: "", status: "" });
  });

  it("matches name or email, ignoring case and accents, plus role and status", () => {
    expect(matchesPool(entry, { q: "PUTRÍ", role: "", status: "" })).toBe(true);
    expect(matchesPool(entry, { q: "example", role: "", status: "" })).toBe(
      true
    );
    expect(
      matchesPool(entry, { q: "", role: "musician", status: "paused" })
    ).toBe(true);
    expect(matchesPool(entry, { q: "", role: "leader", status: "" })).toBe(
      false
    );
    expect(matchesPool(entry, { q: "", role: "", status: "active" })).toBe(
      false
    );
  });
});
