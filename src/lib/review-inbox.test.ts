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
  it("shows a writer other writers' drafts, never submitted ones or their own", () => {
    const inbox = reviewInbox(
      [
        takeaway(1, "draft", OTHER),
        takeaway(2, "draft", OTHER, { comments: 1 }),
        takeaway(3, "in_review", OTHER),
        takeaway(4, "draft", ME),
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

  it("gives staff every submitted takeaway as ready to publish, and drafts with open feedback to review", () => {
    for (const role of ["mita", "owner"] as const) {
      const inbox = reviewInbox(
        [
          takeaway(1, "in_review", OTHER),
          takeaway(2, "draft", OTHER, { comments: 1 }),
          takeaway(3, "draft", OTHER, { suggestions: 1 }),
          takeaway(4, "in_review", ME),
          takeaway(5, "in_review", null, { comments: 1 }),
          takeaway(6, "draft", OTHER),
          takeaway(7, "draft", ME, { comments: 1 }),
        ],
        viewer(role)
      );
      expect(ids(inbox.readyToPublish)).toEqual([1, 4, 5]);
      expect(ids(inbox.needsReview)).toEqual([2, 3]);
    }
  });

  it("treats a published takeaway's correction like a takeaway in its status", () => {
    const correction = (
      id: number,
      status: "draft" | "in_review",
      authorId: string,
      open: { comments?: number } = {}
    ): InboxTakeaway => ({
      ...takeaway(id, "published", authorId, open),
      revision: status,
    });
    const writer = reviewInbox(
      [
        correction(1, "in_review", OTHER),
        correction(2, "draft", OTHER),
        correction(3, "in_review", ME, { comments: 1 }),
        correction(4, "draft", ME, { comments: 1 }),
      ],
      viewer("writer")
    );
    expect(ids(writer.needsReview)).toEqual([2]);
    expect(ids(writer.openFeedback)).toEqual([3, 4]);

    const mita = reviewInbox(
      [
        correction(1, "in_review", OTHER),
        correction(2, "draft", OTHER, { comments: 1 }),
        correction(3, "draft", OTHER),
      ],
      { id: ME, role: "mita" }
    );
    expect(ids(mita.readyToPublish)).toEqual([1]);
    expect(ids(mita.needsReview)).toEqual([2]);
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
