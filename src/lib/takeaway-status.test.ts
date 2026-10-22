import { describe, expect, it } from "vitest";
import type { TakeawayStatus } from "./db/schema/schema";
import type { Role } from "./roles";
import {
  mayEditTakeaway,
  statusActions,
  statusLabels,
} from "./takeaway-status";

const AUTHOR = "author";

const viewer = (role: Role, id = "someone") => ({ id, role });
const takeaway = (
  status: TakeawayStatus,
  authorId: string | null = AUTHOR
) => ({
  authorId,
  status,
});
const moves = (...args: Parameters<typeof statusActions>) =>
  statusActions(...args).map(({ label, to }) => `${label} > ${to}`);

describe("statusLabels", () => {
  it("names every status for readers", () => {
    expect(statusLabels).toEqual({
      draft: "Draft",
      in_review: "In review",
      published: "Published",
    });
  });
});

describe("statusActions", () => {
  const author = viewer("writer", AUTHOR);

  it("lets only the author send a draft to review", () => {
    expect(moves(takeaway("draft"), author)).toEqual([
      "Send to review > in_review",
    ]);
    for (const role of ["owner", "mita", "writer"] as const) {
      expect(moves(takeaway("draft"), viewer(role))).toEqual([]);
    }
  });

  it("lets the author withdraw from review and mita publish or request changes", () => {
    expect(moves(takeaway("in_review"), author)).toEqual([
      "Withdraw from review > draft",
    ]);
    for (const role of ["mita", "owner"] as const) {
      expect(moves(takeaway("in_review"), viewer(role))).toEqual([
        "Publish > published",
        "Request changes > draft",
      ]);
    }
    expect(moves(takeaway("in_review"), viewer("writer"))).toEqual([]);
  });

  it("lets a mita author publish their own takeaway or withdraw it", () => {
    expect(moves(takeaway("in_review"), viewer("mita", AUTHOR))).toEqual([
      "Publish > published",
      "Withdraw from review > draft",
    ]);
  });

  it("lets only mita and the dev unpublish, after confirming", () => {
    for (const role of ["mita", "owner"] as const) {
      expect(moves(takeaway("published"), viewer(role))).toEqual([
        "Unpublish > draft",
      ]);
    }
    const [unpublish] = statusActions(takeaway("published"), viewer("mita"));
    expect(unpublish?.confirm).toBeDefined();
    for (const who of [author, viewer("writer")]) {
      expect(moves(takeaway("published"), who)).toEqual([]);
    }
  });

  it("lets staff send an authorless draft to review", () => {
    expect(moves(takeaway("draft", null), viewer("owner"))).toEqual([
      "Send to review > in_review",
    ]);
    expect(moves(takeaway("draft", null), viewer("writer"))).toEqual([]);
  });

  it("never offers a member anything", () => {
    for (const status of ["draft", "in_review", "published"] as const) {
      expect(
        moves(takeaway(status, "member"), viewer("member", "member"))
      ).toEqual([]);
    }
  });

  it("marks sending to review and publishing as the primary action", () => {
    expect(
      statusActions(takeaway("in_review"), viewer("mita")).map((a) => a.primary)
    ).toEqual([true, false]);
    expect(statusActions(takeaway("draft"), author)[0]?.primary).toBe(true);
  });
});

describe("mayEditTakeaway", () => {
  it("lets the author and staff edit until it is published, then nobody", () => {
    for (const status of ["draft", "in_review"] as const) {
      expect(mayEditTakeaway(takeaway(status), viewer("writer", AUTHOR))).toBe(
        true
      );
      expect(mayEditTakeaway(takeaway(status), viewer("owner"))).toBe(true);
      expect(mayEditTakeaway(takeaway(status), viewer("mita"))).toBe(true);
      expect(mayEditTakeaway(takeaway(status), viewer("writer"))).toBe(false);
    }
    for (const role of ["owner", "mita", "writer"] as const) {
      expect(mayEditTakeaway(takeaway("published"), viewer(role, AUTHOR))).toBe(
        false
      );
    }
  });
});
