import type { TakeawayStatus } from "./db/schema/schema";
import { canWriteTakeaways, isStaffRole, type Role } from "./roles";

export const statusLabels: Record<TakeawayStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
};

/** The takeaway fields the rules below depend on. */
export interface TakeawaySubject {
  authorId: string | null;
  status: TakeawayStatus;
}

/** Who is asking, with their role read from the database. */
export interface TakeawayViewer {
  id: string;
  role: Role;
}

export interface StatusAction {
  /** Shown before the move runs; for moves that change the public site. */
  confirm?: {
    action: string;
    /** The dialog's cancel button: what keeping things as they are means. */
    cancel: string;
    description: string;
    /** The confirm button while the move runs. */
    pending: string;
    title: string;
  };
  /** What the success toast says. */
  done: string;
  label: string;
  /** The row's main next step, shown as its button; the rest sit in the menu. */
  primary: boolean;
  to: TakeawayStatus;
}

const SEND_TO_REVIEW: StatusAction = {
  done: "Takeaway sent to review.",
  label: "Send to review",
  primary: true,
  to: "in_review",
};
const WITHDRAW: StatusAction = {
  done: "Takeaway withdrawn from review.",
  label: "Withdraw from review",
  primary: false,
  to: "draft",
};
const PUBLISH: StatusAction = {
  done: "Takeaway published. It is now on the website.",
  label: "Publish",
  primary: true,
  to: "published",
};
const REQUEST_CHANGES: StatusAction = {
  done: "Changes requested. The takeaway is back with its writer.",
  label: "Request changes",
  primary: false,
  to: "draft",
};
const UNPUBLISH: StatusAction = {
  confirm: {
    action: "Unpublish",
    cancel: "Keep it published",
    description:
      "It disappears from the website and goes back to draft, with any changes waiting for review. It has to be reviewed and published again.",
    pending: "Unpublishing…",
    title: "Unpublish this takeaway?",
  },
  done: "Takeaway unpublished. It is no longer on the website.",
  label: "Unpublish",
  primary: false,
  to: "draft",
};

/**
 * The author owns the text, while they still may write takeaways.
 * Takeaways written before authorship have no author, so staff act for them.
 */
export const actsAsAuthor = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) => {
  if (takeaway.authorId === null) {
    return isStaffRole(viewer.role);
  }
  return takeaway.authorId === viewer.id && canWriteTakeaways(viewer.role);
};

/**
 * Who may change the text or delete the takeaway: its author and staff,
 * until it is published. A published takeaway changes through a correction
 * (`mayChangeText` in `takeaway-revisions.ts`) that mita or the dev publish,
 * so they stay the one gate to the public site.
 */
export const mayEditTakeaway = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) =>
  takeaway.status !== "published" &&
  (isStaffRole(viewer.role) || actsAsAuthor(takeaway, viewer));

/**
 * The status moves a viewer may make, in button order. The server allows
 * exactly these (`takeaways.setStatus`):
 * - Draft: the author sends it to review.
 * - In review: mita or the dev publishes or requests changes; the author
 *   withdraws it.
 * - Published: mita or the dev unpublishes it.
 */
export const statusActions = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
): StatusAction[] => {
  const author = actsAsAuthor(takeaway, viewer);
  // Mita and the dev (`owner`) are the gate to the public site.
  const gate = isStaffRole(viewer.role);
  if (takeaway.status === "draft") {
    return author ? [SEND_TO_REVIEW] : [];
  }
  if (takeaway.status === "in_review") {
    const actions = gate ? [PUBLISH] : [];
    if (author) {
      actions.push(WITHDRAW);
    } else if (gate) {
      actions.push(REQUEST_CHANGES);
    }
    return actions;
  }
  return gate ? [UNPUBLISH] : [];
};

/**
 * The read rule from #36: published is public, staff and the author read
 * every status, other writers read takeaways that are in review.
 */
export const mayReadTakeaway = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) =>
  takeaway.status === "published" ||
  isStaffRole(viewer.role) ||
  (canWriteTakeaways(viewer.role) &&
    (takeaway.authorId === viewer.id || takeaway.status === "in_review"));
