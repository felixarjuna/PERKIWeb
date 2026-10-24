import type { TakeawayStatus } from "./db/schema/schema";
import { canWriteTakeaways, isStaffRole, type Role } from "./roles";

export const statusLabels: Record<TakeawayStatus, string> = {
  draft: "Draft",
  in_review: "Submitted",
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
  /** Mita's request for changes: the writer gets a note saying what to fix. */
  requiresNote?: boolean;
  /** Submitting waits until reviewers' comments are resolved (`submitBlockers`). */
  requiresResolvedComments?: boolean;
  to: TakeawayStatus;
}

const SUBMIT: StatusAction = {
  done: "Takeaway submitted to mita. The text is locked while mita checks it.",
  label: "Submit to mita",
  primary: true,
  requiresResolvedComments: true,
  to: "in_review",
};
const WITHDRAW: StatusAction = {
  done: "Takeaway withdrawn. It is a draft again.",
  label: "Withdraw",
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
  done: "Changes requested. The takeaway is back with its writer, with your note.",
  label: "Request changes",
  primary: false,
  requiresNote: true,
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
 * Who may change the text: its author and staff, while it is a draft (#75).
 * Once submitted the text is locked for everyone until mita publishes it or
 * sends it back. A published takeaway changes through a correction
 * (`mayChangeText` in `takeaway-revisions.ts`) that mita or the dev publish,
 * so they stay the one gate to the public site.
 */
export const mayEditTakeaway = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) =>
  takeaway.status === "draft" &&
  (isStaffRole(viewer.role) || actsAsAuthor(takeaway, viewer));

/** Who may delete a takeaway: its author and staff, until it is published. */
export const mayDeleteTakeaway = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) =>
  takeaway.status !== "published" &&
  (isStaffRole(viewer.role) || actsAsAuthor(takeaway, viewer));

/**
 * The status moves a viewer may make, in button order. The server allows
 * exactly these (`takeaways.setStatus`):
 * - Draft (the shared working copy): the author submits it to mita, once
 *   reviewers' comments are resolved.
 * - Submitted (`in_review`): mita or the dev publishes it or requests changes
 *   with a note; the author withdraws it.
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
    return author ? [SUBMIT] : [];
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
 * The read rule: published is public; every writer and staff read every
 * draft and submitted takeaway, since the draft is the team's shared working
 * copy (#75).
 */
export const mayReadTakeaway = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) => takeaway.status === "published" || canWriteTakeaways(viewer.role);

/**
 * The open comments that keep a draft from being submitted: unresolved ones
 * from anyone but its writer (for a takeaway without one, the submitter).
 * A writer's notes to themselves never block them.
 */
export const submitBlockers = <
  T extends { authorId: string | null; resolvedAt: Date | null },
>(
  comments: T[],
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) => {
  const writer = takeaway.authorId ?? viewer.id;
  return comments.filter(
    (comment) => comment.resolvedAt === null && comment.authorId !== writer
  );
};
