import type { ReviewTarget } from "./review-target";

export type ReviewKind = "comment" | "suggest";
export interface ReviewDraft {
  quote: string;
  text: string;
}
export type ReviewDrafts = Record<
  ReviewTarget,
  Record<ReviewKind, ReviewDraft | null>
>;

export const emptyReviewDrafts = (): ReviewDrafts => ({
  notes: { comment: null, suggest: null },
  tldr: { comment: null, suggest: null },
});

export const hasReviewDraft = (kind: ReviewKind, draft: ReviewDraft | null) =>
  Boolean(
    draft?.text && (kind === "comment" || draft.text.trim() !== draft.quote)
  );

export const beginReviewDraft = (
  drafts: ReviewDrafts,
  target: ReviewTarget,
  kind: ReviewKind,
  quote: string
): ReviewDrafts =>
  hasReviewDraft(kind, drafts[target][kind])
    ? drafts
    : {
        ...drafts,
        [target]: {
          ...drafts[target],
          [kind]: { quote, text: kind === "suggest" ? quote : "" },
        },
      };
