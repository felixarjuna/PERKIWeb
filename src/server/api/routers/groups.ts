import { asc } from "drizzle-orm";
import { groupMembers, groups, groupTerms } from "~/lib/db/schema/schema";
import { localDay, termOn } from "~/lib/schedule-team";
import { db } from "~/server";
import { createTRPCRouter, publicProcedure } from "../trpc";

export interface GroupTerm {
  groups: { members: string[]; name: string }[];
  startsOn: string;
}

/** Every group term with its groups and member names (never account ids). */
export async function loadGroupTerms(): Promise<GroupTerm[]> {
  const [terms, groupRows, memberRows] = await Promise.all([
    db.select().from(groupTerms),
    db.select().from(groups).orderBy(asc(groups.name)),
    db
      .select({ groupId: groupMembers.groupId, name: groupMembers.name })
      .from(groupMembers)
      .orderBy(asc(groupMembers.position), asc(groupMembers.id)),
  ]);
  return terms.map((term) => ({
    groups: groupRows
      .filter((group) => group.termId === term.id)
      .map((group) => ({
        members: memberRows
          .filter((member) => member.groupId === group.id)
          .map((member) => member.name),
        name: group.name,
      })),
    startsOn: term.startsOn,
  }));
}

export const groupRouter = createTRPCRouter({
  /** The cooking and cleaning groups in force today; null before the first term. */
  getCurrent: publicProcedure.query(
    async () => termOn(await loadGroupTerms(), localDay(new Date())) ?? null
  ),
});
