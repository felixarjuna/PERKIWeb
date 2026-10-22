import type { TakeawayStatus } from "./db/schema/schema";

export const statusLabels: Record<TakeawayStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
};

/** What the viewer may do with a takeaway, as `takeaways.getManageable` reports it. */
export interface StatusRights {
  /** May edit the text; for a writer, only their own unpublished takeaways. */
  canManage: boolean;
  /** Mita or owner: may publish and send back. */
  canPublish: boolean;
}

export interface StatusAction {
  label: string;
  /** The primary action of the row (publishing), shown as the main button. */
  primary: boolean;
  to: TakeawayStatus;
}

const PUBLISH: StatusAction = {
  label: "Publish",
  primary: true,
  to: "published",
};
const TO_REVIEW: StatusAction = {
  label: "Send to review",
  primary: false,
  to: "in_review",
};
const SEND_BACK: StatusAction = {
  label: "Send back",
  primary: false,
  to: "draft",
};
const BACK_TO_DRAFT: StatusAction = {
  label: "Back to draft",
  primary: false,
  to: "draft",
};

/**
 * The status changes a viewer may make, in the order the buttons appear.
 * Mirrors the server's rule (`setStatus`): staff move a takeaway anywhere,
 * an author only between draft and review while it is unpublished.
 */
export const statusActions = (
  status: TakeawayStatus,
  rights: StatusRights
): StatusAction[] => {
  if (rights.canPublish) {
    if (status === "draft") {
      return [PUBLISH, TO_REVIEW];
    }
    if (status === "in_review") {
      return [PUBLISH, SEND_BACK];
    }
    return [SEND_BACK];
  }
  if (!rights.canManage) {
    return [];
  }
  if (status === "draft") {
    return [TO_REVIEW];
  }
  if (status === "in_review") {
    return [BACK_TO_DRAFT];
  }
  return [];
};
