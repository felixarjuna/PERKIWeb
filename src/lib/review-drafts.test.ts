import { describe, expect, it } from "vitest";
import { beginReviewDraft, emptyReviewDrafts } from "./review-drafts";

describe("review drafts", () => {
  it("reopens an unfinished comment with its original quote after another selection", () => {
    const drafts = emptyReviewDrafts();
    drafts.notes.comment = {
      quote: "First passage",
      text: "Keep this feedback",
    };
    const next = beginReviewDraft(
      drafts,
      "notes",
      "comment",
      "Different passage"
    );
    expect(next.notes.comment).toEqual({
      quote: "First passage",
      text: "Keep this feedback",
    });
  });

  it("keeps targets and feedback kinds independent across context switches", () => {
    const drafts = emptyReviewDrafts();
    drafts.notes.comment = { quote: "Same passage", text: "Notes feedback" };
    drafts.tldr.suggest = { quote: "Same passage", text: "Shorter wording" };
    const next = beginReviewDraft(drafts, "tldr", "comment", "Summary quote");
    expect(next.tldr.comment).toEqual({ quote: "Summary quote", text: "" });
    expect(next.notes.comment?.text).toBe("Notes feedback");
    expect(next.tldr.suggest).toEqual({
      quote: "Same passage",
      text: "Shorter wording",
    });
  });

  it("uses a new selection when a suggestion has not been changed", () => {
    const drafts = emptyReviewDrafts();
    drafts.notes.suggest = { quote: "First", text: "First" };
    expect(
      beginReviewDraft(drafts, "notes", "suggest", "Next").notes.suggest
    ).toEqual({ quote: "Next", text: "Next" });
  });
});
