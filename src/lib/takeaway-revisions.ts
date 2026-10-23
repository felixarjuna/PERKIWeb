import type { RevisionStatus } from "./db/schema/schema";
import { isStaffRole } from "./roles";
import {
  actsAsAuthor,
  mayEditTakeaway,
  type StatusAction,
  type TakeawaySubject,
  type TakeawayViewer,
} from "./takeaway-status";

/** The statuses a correction is worked on in; at most one per takeaway. */
export type OpenRevisionStatus = Extract<RevisionStatus, "draft" | "in_review">;

export const revisionLabels: Record<OpenRevisionStatus, string> = {
  draft: "Changes in draft",
  in_review: "Changes in review",
};

/** A move of a takeaway's open correction (`takeawayRevisions.setStatus`). */
export interface RevisionAction extends Omit<StatusAction, "to"> {
  revision: true;
  to: RevisionStatus;
}

const SEND_TO_REVIEW: RevisionAction = {
  done: "Changes sent to review. The website keeps the published text until they are published.",
  label: "Send changes to review",
  primary: true,
  revision: true,
  to: "in_review",
};
const WITHDRAW: RevisionAction = {
  done: "Changes withdrawn from review.",
  label: "Withdraw changes from review",
  primary: false,
  revision: true,
  to: "draft",
};
const PUBLISH: RevisionAction = {
  done: "Changes published. The website shows the new text.",
  label: "Publish changes",
  primary: true,
  revision: true,
  to: "published",
};
const REQUEST_CHANGES: RevisionAction = {
  done: "Changes requested. The website keeps the published text.",
  label: "Request changes",
  primary: false,
  revision: true,
  to: "draft",
};
const DISCARD: RevisionAction = {
  confirm: {
    action: "Discard changes",
    description:
      "The website keeps the published text. The changes stay in the takeaway's history but can't be edited again.",
    title: "Discard these changes?",
  },
  done: "Changes discarded. The published text stays as it is.",
  label: "Discard changes",
  primary: false,
  revision: true,
  to: "discarded",
};

/**
 * What the review rules apply to: the open correction of a published
 * takeaway while there is one (its text is what reviewers read, comment on
 * and suggest edits to), otherwise the takeaway itself. A correction belongs
 * to the takeaway's writer, whoever started it.
 */
export const workingSubject = (
  takeaway: TakeawaySubject,
  revision: OpenRevisionStatus | null
): TakeawaySubject =>
  revision ? { authorId: takeaway.authorId, status: revision } : takeaway;

/**
 * Who may start a correction of a published takeaway (#74): its writer and
 * staff. The website keeps the published text until staff publish it.
 */
export const mayReviseTakeaway = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) =>
  takeaway.status === "published" &&
  (isStaffRole(viewer.role) || actsAsAuthor(takeaway, viewer));

/**
 * Who may change a takeaway's text: directly until it is published, then
 * through its correction (started on the first save).
 */
export const mayChangeText = (
  takeaway: TakeawaySubject,
  revision: OpenRevisionStatus | null,
  viewer: TakeawayViewer
) =>
  revision
    ? mayEditTakeaway(workingSubject(takeaway, revision), viewer)
    : mayEditTakeaway(takeaway, viewer) || mayReviseTakeaway(takeaway, viewer);

/**
 * The moves of an open correction a viewer may make, in button order; the
 * server allows exactly these. They mirror a takeaway's own review: the
 * writer sends it to review or withdraws it, staff publish it or request
 * changes. The writer and staff may also discard it.
 */
export const revisionActions = (
  takeaway: TakeawaySubject,
  revision: OpenRevisionStatus,
  viewer: TakeawayViewer
): RevisionAction[] => {
  const author = actsAsAuthor(takeaway, viewer);
  const gate = isStaffRole(viewer.role);
  const actions: RevisionAction[] = [];
  if (revision === "draft") {
    if (author) {
      actions.push(SEND_TO_REVIEW);
    }
  } else {
    if (gate) {
      actions.push(PUBLISH);
    }
    if (author) {
      actions.push(WITHDRAW);
    } else if (gate) {
      actions.push(REQUEST_CHANGES);
    }
  }
  if (author || gate) {
    actions.push(DISCARD);
  }
  return actions;
};
