import { DateTime } from "luxon";
import { ROLES, type Role, roleLabels } from "./roles";

const ZONE = "Europe/Berlin";

/** How a role reads in a sentence: "a writer", "the Dev". */
const asNoun = (role: Role) =>
  role === "owner" ? `the ${roleLabels.owner}` : `a ${role}`;

/**
 * One role change as the member reads it on their account page. A step down
 * is told plainly rather than as "became".
 */
export function roleChangeLine(change: {
  fromRole: Role;
  source: "invite" | "request" | null;
  toRole: Role;
}): { detail: string | null; title: string } {
  // ROLES runs from owner down to member.
  const stepUp = ROLES.indexOf(change.toRole) < ROLES.indexOf(change.fromRole);
  const title = stepUp
    ? `You became ${asNoun(change.toRole)}`
    : `Your role changed to ${change.toRole === "owner" ? roleLabels.owner : change.toRole}`;
  const details = {
    invite: "You were invited",
    request: "Your request was approved",
  } as const;
  return { detail: change.source ? details[change.source] : null, title };
}

/** The first entry of the history; a backfilled date only says by when. */
export function joinedLine(joined: { at: Date; exact: boolean }) {
  const day = DateTime.fromJSDate(joined.at, { zone: ZONE });
  return {
    date: joined.exact
      ? day.toFormat("d LLLL yyyy")
      : `By ${day.toFormat("LLLL yyyy")}`,
    title: "You joined PERKI",
  };
}

/** A role change's date, in Aachen time. */
export const historyDate = (date: Date) =>
  DateTime.fromJSDate(date, { zone: ZONE }).toFormat("d LLLL yyyy");
