import { asc, eq } from "drizzle-orm";
import {
  groupMembers,
  groups,
  groupTerms,
  users,
} from "~/lib/db/schema/schema";
import type { Person } from "~/lib/people";
import { localDay, termOn } from "~/lib/schedule-team";
import { db } from "~/server";
import { createTRPCRouter, publicProcedure } from "../trpc";

export interface GroupTerm {
  groups: { members: Person[]; name: string }[];
  startsOn: string;
}

/**
 * Every group term with its groups and members (never account ids). Photos
 * of linked members are included only for signed-in viewers.
 */
export async function loadGroupTerms(
  withPhotos: boolean
): Promise<GroupTerm[]> {
  const [terms, groupRows, memberRows] = await Promise.all([
    db.select().from(groupTerms),
    db.select().from(groups).orderBy(asc(groups.name)),
    db
      .select({
        groupId: groupMembers.groupId,
        image: users.image,
        name: groupMembers.name,
      })
      .from(groupMembers)
      .leftJoin(users, eq(users.id, groupMembers.userId))
      .orderBy(asc(groupMembers.position), asc(groupMembers.id)),
  ]);
  return terms.map((term) => ({
    groups: groupRows
      .filter((group) => group.termId === term.id)
      .map((group) => ({
        members: memberRows
          .filter((member) => member.groupId === group.id)
          .map((member) => ({
            image: withPhotos ? member.image : null,
            name: member.name,
          })),
        name: group.name,
      })),
    startsOn: term.startsOn,
  }));
}

export const groupRouter = createTRPCRouter({
  /** The cooking and cleaning groups in force today; null before the first term. */
  getCurrent: publicProcedure.query(
    async ({ ctx }) =>
      termOn(
        await loadGroupTerms(Boolean(ctx.session?.user)),
        localDay(new Date())
      ) ?? null
  ),
});
