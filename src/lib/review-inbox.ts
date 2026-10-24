import type { TakeawayStatus } from "./db/schema/schema";
import { canWriteTakeaways, isStaffRole } from "./roles";
import type { OpenRevisionStatus } from "./takeaway-revisions";
import type { TakeawayViewer } from "./takeaway-status";

/** The takeaway fields the inbox (#59) sorts by. */
export interface InboxTakeaway {
  authorId: string | null;
  id: number;
  /** Unresolved comments from anyone but the takeaway's writer. */
  openComments: number;
  openSuggestions: number;
  /** The open correction of a published takeaway (#74), if any. */
  revision?: OpenRevisionStatus | null;
  status: TakeawayStatus;
}

/** The status the review flow is at: the correction's, while there is one. */
const reviewStatus = (takeaway: InboxTakeaway) =>
  takeaway.revision ?? takeaway.status;

export const hasOpenFeedback = (takeaway: InboxTakeaway) =>
  takeaway.openComments + takeaway.openSuggestions > 0;

/**
 * What waits for the viewer, read from statuses, comments and suggestions:
 * - Open feedback: their own unpublished takeaways with unresolved comments or
 *   open suggestions.
 * - Ready to publish (mita and the dev): every submitted takeaway.
 * - Needs review: other writers' drafts, the shared working copy (#75); for
 *   staff, only those that still have open feedback.
 * A published takeaway's correction counts as the takeaway at the
 * correction's status, with the feedback on that correction.
 */
export const reviewInbox = <T extends InboxTakeaway>(
  takeaways: T[],
  viewer: TakeawayViewer
) => {
  if (!canWriteTakeaways(viewer.role)) {
    return { needsReview: [], openFeedback: [], readyToPublish: [] };
  }
  const staff = isStaffRole(viewer.role);
  const inStatus = (status: OpenRevisionStatus) =>
    takeaways.filter((takeaway) => reviewStatus(takeaway) === status);
  return {
    needsReview: inStatus("draft").filter(
      (takeaway) =>
        takeaway.authorId !== viewer.id && (!staff || hasOpenFeedback(takeaway))
    ),
    openFeedback: takeaways.filter(
      (takeaway) =>
        takeaway.authorId === viewer.id &&
        reviewStatus(takeaway) !== "published" &&
        hasOpenFeedback(takeaway)
    ),
    readyToPublish: staff ? inStatus("in_review") : [],
  };
};
