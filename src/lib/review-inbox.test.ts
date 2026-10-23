import { describe, expect, it } from "vitest";
import type { TakeawayStatus } from "./db/schema/schema";
import { type InboxTakeaway, reviewInbox } from "./review-inbox";
import type { Role } from "./roles";

const ME = "me";
const OTHER = "other";

const viewer = (role: Role) => ({ id: ME, role });
const takeaway = (
  id: number,
  status: TakeawayStatus,
  authorId: string | null,
  open: { comments?: number; suggestions?: number } = {}
): InboxTakeaway => ({
  authorId,
  id,
  openComments: open.comments ?? 0,
  openSuggestions: open.suggestions ?? 0,
  status,
});
const ids = (rows: InboxTakeaway[]) => rows.map((row) => row.id);

describe("reviewInbox", () => {
  it("shows a writer other writers' takeaways in review, never drafts or their own", () => {
    const inbox = reviewInbox(
      [
        takeaway(1, "in_review", OTHER),
        takeaway(2, "in_review", OTHER, { comments: 1 }),
        takeaway(3, "draft", OTHER),
        takeaway(4, "in_review", ME),
        takeaway(5, "published", OTHER),
      ],
      viewer("writer")
    );
    expect(ids(inbox.needsReview)).toEqual([1, 2]);
    expect(inbox.readyToPublish).toEqual([]);
  });

  it("gives a writer their own unpublished takeaways with open comments or suggestions", () => {
    const inbox = reviewInbox(
      [
        takeaway(1, "draft", ME, { comments: 2 }),
        takeaway(2, "in_review", ME, { suggestions: 1 }),
        takeaway(3, "in_review", ME),
        takeaway(4, "published", ME, { comments: 1 }),
        takeaway(5, "in_review", OTHER, { comments: 1 }),
      ],
      viewer("writer")
    );
    expect(ids(inbox.openFeedback)).toEqual([1, 2]);
  });

  it("gives staff in-review takeaways without open feedback as ready to publish", () => {
    for (const role of ["mita", "owner"] as const) {
      const inbox = reviewInbox(
        [
          takeaway(1, "in_review", OTHER),
          takeaway(2, "in_review", OTHER, { comments: 1 }),
          takeaway(3, "in_review", OTHER, { suggestions: 1 }),
          takeaway(4, "in_review", ME),
          takeaway(5, "in_review", null),
          takeaway(6, "draft", OTHER),
        ],
        viewer(role)
      );
      expect(ids(inbox.readyToPublish)).toEqual([1, 4, 5]);
      expect(ids(inbox.needsReview)).toEqual([2, 3]);
    }
  });

  it("shows members nothing", () => {
    const inbox = reviewInbox(
      [takeaway(1, "in_review", OTHER), takeaway(2, "draft", ME)],
      viewer("member")
    );
    expect(inbox).toEqual({
      needsReview: [],
      openFeedback: [],
      readyToPublish: [],
    });
  });
});
