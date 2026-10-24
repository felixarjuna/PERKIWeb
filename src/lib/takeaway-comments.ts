import { canWriteTakeaways, isStaffRole } from "./roles";
import type { TakeawaySubject, TakeawayViewer } from "./takeaway-status";

/** The longest comment and quoted passage the review thread accepts. */
export const COMMENT_MAX_LENGTH = 2000;
export const QUOTE_MAX_LENGTH = 1000;

const ownsTakeaway = (takeaway: TakeawaySubject, viewer: TakeawayViewer) =>
  takeaway.authorId === viewer.id && canWriteTakeaways(viewer.role);

/**
 * Who may comment on a takeaway (#36, #75): every writer while it is a draft
 * (the shared working copy), its writer also while it is submitted, mita and
 * the dev always. Resolving and reopening comments follows the same rule.
 */
export const mayCommentOn = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) => {
  if (isStaffRole(viewer.role)) {
    return true;
  }
  if (takeaway.status === "draft") {
    return canWriteTakeaways(viewer.role);
  }
  return takeaway.status === "in_review" && ownsTakeaway(takeaway, viewer);
};

/**
 * Who may read a takeaway's review thread: every writer until it is
 * published, and its writer at any status, so they keep the feedback after it
 * is published. Readers of the public site never see comments.
 */
export const mayReadComments = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) =>
  mayCommentOn(takeaway, viewer) ||
  ownsTakeaway(takeaway, viewer) ||
  (takeaway.status !== "published" && canWriteTakeaways(viewer.role));
