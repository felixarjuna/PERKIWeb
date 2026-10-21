/** Slots a member can fill on a schedule, in the order a team is listed. */
export const SERVING_ROLES = [
  "preacher",
  "leader",
  "liturgist",
  "musician",
  "multimedia",
  "accommodation",
  "note_writer",
  "publication",
] as const;
export type ServingRole = (typeof SERVING_ROLES)[number];

export const servingRoleLabels: Record<ServingRole, string> = {
  accommodation: "Accommodation",
  leader: "Leader",
  liturgist: "Liturgist",
  multimedia: "Multimedia",
  musician: "Musician",
  note_writer: "Note writer",
  preacher: "Preacher",
  publication: "Publication",
};
