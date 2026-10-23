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
