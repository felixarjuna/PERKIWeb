export const REVIEW_TARGETS = ["notes", "tldr"] as const;
export type ReviewTarget = (typeof REVIEW_TARGETS)[number];

export const reviewTargetLabel = (target: ReviewTarget) =>
  target === "tldr" ? "TL;DR" : "Notes";

export const reviewTargetText = (
  text: { keypoints: string; tldr: string | null },
  target: ReviewTarget
) => (target === "tldr" ? (text.tldr ?? "") : text.keypoints);
