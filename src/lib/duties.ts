import { type ServingRole, servingRoleLabels } from "./serving-roles";

/** One thing a member does at a gathering: a serving slot or a group duty. */
export type Duty =
  | { role: ServingRole }
  | { group: string; role: "cleaning" | "cooking" };

/** "Musician", or "Cooking · Group 3" for a group duty. */
export function dutyLabel(duty: Duty) {
  if ("group" in duty) {
    return `${duty.role === "cooking" ? "Cooking" : "Cleaning"} · ${duty.group}`;
  }
  return servingRoleLabels[duty.role];
}

/**
 * The member's part on a gathering card: "Musician", or "Your group cooks",
 * since the card already names the group on its cooking or cleaning button.
 */
export function yourPartLabel(duty: Duty) {
  if ("group" in duty) {
    return duty.role === "cooking" ? "Your group cooks" : "Your group cleans";
  }
  return servingRoleLabels[duty.role];
}
