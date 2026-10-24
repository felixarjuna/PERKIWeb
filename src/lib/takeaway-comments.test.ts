import { describe, expect, it } from "vitest";
import type { TakeawayStatus } from "./db/schema/schema";
import type { Role } from "./roles";
import { mayCommentOn, mayReadComments } from "./takeaway-comments";

const AUTHOR = "author";

const viewer = (role: Role, id = "someone") => ({ id, role });
const takeaway = (
  status: TakeawayStatus,
  authorId: string | null = AUTHOR
) => ({ authorId, status });

describe("mayCommentOn", () => {
  it("lets the writer comment on their own draft and submitted takeaway", () => {
    const author = viewer("writer", AUTHOR);
    expect(mayCommentOn(takeaway("draft"), author)).toBe(true);
    expect(mayCommentOn(takeaway("in_review"), author)).toBe(true);
    expect(mayCommentOn(takeaway("published"), author)).toBe(false);
  });

  it("lets other writers comment only while it is a draft", () => {
    const other = viewer("writer");
    expect(mayCommentOn(takeaway("draft"), other)).toBe(true);
    expect(mayCommentOn(takeaway("in_review"), other)).toBe(false);
    expect(mayCommentOn(takeaway("published"), other)).toBe(false);
  });

  it("lets mita and the dev comment at any status", () => {
    for (const role of ["mita", "owner"] as const) {
      for (const status of ["draft", "in_review", "published"] as const) {
        expect(mayCommentOn(takeaway(status), viewer(role))).toBe(true);
        expect(mayCommentOn(takeaway(status, null), viewer(role))).toBe(true);
      }
    }
  });

  it("never lets members comment, even on their own takeaway", () => {
    for (const status of ["draft", "in_review", "published"] as const) {
      expect(mayCommentOn(takeaway(status), viewer("member", AUTHOR))).toBe(
        false
      );
    }
  });
});

describe("mayReadComments", () => {
  it("lets the writer read the thread on their own takeaway at any status", () => {
    expect(
      mayReadComments(takeaway("published"), viewer("writer", AUTHOR))
    ).toBe(true);
  });

  it("shows writers the threads of unpublished takeaways only", () => {
    expect(mayReadComments(takeaway("draft"), viewer("writer"))).toBe(true);
    expect(mayReadComments(takeaway("in_review"), viewer("writer"))).toBe(true);
    expect(mayReadComments(takeaway("published"), viewer("writer"))).toBe(
      false
    );
  });

  it("hides every thread from members", () => {
    expect(mayReadComments(takeaway("in_review"), viewer("member"))).toBe(
      false
    );
  });
});
