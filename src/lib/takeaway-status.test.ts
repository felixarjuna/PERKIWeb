import { describe, expect, it } from "vitest";
import type { TakeawayStatus } from "./db/schema/schema";
import type { Role } from "./roles";
import {
  mayDeleteTakeaway,
  mayEditTakeaway,
  mayReadTakeaway,
  statusActions,
  statusLabels,
  submitBlockers,
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
      in_review: "Submitted",
      published: "Published",
    });
  });
});

describe("statusActions", () => {
  const author = viewer("writer", AUTHOR);

  it("lets only the author submit a draft to mita", () => {
    expect(moves(takeaway("draft"), author)).toEqual([
      "Submit to mita > in_review",
    ]);
    for (const role of ["owner", "mita", "writer"] as const) {
      expect(moves(takeaway("draft"), viewer(role))).toEqual([]);
    }
  });

  it("lets the author withdraw a submitted takeaway and mita publish or request changes", () => {
    expect(moves(takeaway("in_review"), author)).toEqual([
      "Withdraw > draft",
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
      "Withdraw > draft",
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

  it("lets staff submit an authorless draft", () => {
    expect(moves(takeaway("draft", null), viewer("owner"))).toEqual([
      "Submit to mita > in_review",
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

  it("marks submitting and publishing as the primary action", () => {
    expect(
      statusActions(takeaway("in_review"), viewer("mita")).map((a) => a.primary)
    ).toEqual([true, false]);
    expect(statusActions(takeaway("draft"), author)[0]?.primary).toBe(true);
  });

  it("asks for a note when mita requests changes, and for resolved comments on submit", () => {
    const [publish, requestChanges] = statusActions(
      takeaway("in_review"),
      viewer("mita")
    );
    expect(publish?.requiresNote).toBeFalsy();
    expect(requestChanges?.requiresNote).toBe(true);
    const [withdraw] = statusActions(takeaway("in_review"), author);
    expect(withdraw?.requiresNote).toBeFalsy();
    const [submit] = statusActions(takeaway("draft"), author);
    expect(submit?.requiresResolvedComments).toBe(true);
  });
});

describe("mayEditTakeaway", () => {
  it("lets the author and staff change the text of a draft only", () => {
    expect(mayEditTakeaway(takeaway("draft"), viewer("writer", AUTHOR))).toBe(
      true
    );
    expect(mayEditTakeaway(takeaway("draft"), viewer("owner"))).toBe(true);
    expect(mayEditTakeaway(takeaway("draft"), viewer("mita"))).toBe(true);
    expect(mayEditTakeaway(takeaway("draft"), viewer("writer"))).toBe(false);
  });

  it("locks the text for everyone once submitted or published", () => {
    for (const status of ["in_review", "published"] as const) {
      for (const role of ["owner", "mita", "writer"] as const) {
        expect(mayEditTakeaway(takeaway(status), viewer(role, AUTHOR))).toBe(
          false
        );
        expect(mayEditTakeaway(takeaway(status), viewer(role))).toBe(false);
      }
    }
  });
});

describe("mayDeleteTakeaway", () => {
  it("lets the author and staff delete until it is published", () => {
    for (const status of ["draft", "in_review"] as const) {
      expect(
        mayDeleteTakeaway(takeaway(status), viewer("writer", AUTHOR))
      ).toBe(true);
      expect(mayDeleteTakeaway(takeaway(status), viewer("mita"))).toBe(true);
      expect(mayDeleteTakeaway(takeaway(status), viewer("writer"))).toBe(
        false
      );
    }
    expect(mayDeleteTakeaway(takeaway("published"), viewer("owner"))).toBe(
      false
    );
  });
});

describe("mayReadTakeaway", () => {
  it("lets every writer read every draft and submitted takeaway", () => {
    for (const status of ["draft", "in_review", "published"] as const) {
      expect(mayReadTakeaway(takeaway(status), viewer("writer"))).toBe(true);
    }
  });

  it("shows members only published takeaways", () => {
    expect(mayReadTakeaway(takeaway("draft"), viewer("member"))).toBe(false);
    expect(mayReadTakeaway(takeaway("in_review"), viewer("member"))).toBe(
      false
    );
    expect(mayReadTakeaway(takeaway("published"), viewer("member"))).toBe(
      true
    );
  });
});

describe("submitBlockers", () => {
  const comment = (authorId: string | null, resolved = false) => ({
    authorId,
    resolvedAt: resolved ? new Date() : null,
  });

  it("is every open comment from someone other than the writer", () => {
    const open = comment("reviewer");
    expect(
      submitBlockers(
        [open, comment("reviewer", true), comment(AUTHOR)],
        takeaway("draft"),
        viewer("writer", AUTHOR)
      )
    ).toEqual([open]);
  });

  it("counts comments from deleted accounts", () => {
    const orphan = comment(null);
    expect(
      submitBlockers([orphan], takeaway("draft"), viewer("writer", AUTHOR))
    ).toEqual([orphan]);
  });

  it("leaves out the submitter's own notes on an authorless takeaway", () => {
    const own = comment("staff");
    const other = comment("reviewer");
    expect(
      submitBlockers(
        [own, other],
        takeaway("draft", null),
        viewer("mita", "staff")
      )
    ).toEqual([other]);
  });
});
