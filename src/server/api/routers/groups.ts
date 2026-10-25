import { TRPCError } from "@trpc/server";
import { asc, desc, eq, inArray, max } from "drizzle-orm";
import { z } from "zod";
import {
  groupMembers,
  groups,
  groupTerms,
  users,
} from "~/lib/db/schema/schema";
import {
  DEFAULT_GROUP_NAMES,
  mayStartTermOn,
  termStatus,
} from "~/lib/group-terms";
import { nameKey, type Person } from "~/lib/people";
import { localDay, termOn } from "~/lib/schedule-team";
import { db } from "~/server";
import { resolveAccounts } from "~/server/people";
import type { Transaction } from "~/server/schedule-assignments";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../trpc";

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

/** Every term for staff, newest first, with ids to edit by (never account ids). */
async function loadManagedTerms() {
  const [terms, groupRows, memberRows] = await Promise.all([
    db.select().from(groupTerms).orderBy(desc(groupTerms.startsOn)),
    db.select().from(groups).orderBy(asc(groups.name)),
    db
      .select({
        groupId: groupMembers.groupId,
        id: groupMembers.id,
        image: users.image,
        linked: users.id,
        name: groupMembers.name,
      })
      .from(groupMembers)
      .leftJoin(users, eq(users.id, groupMembers.userId))
      .orderBy(asc(groupMembers.position), asc(groupMembers.id)),
  ]);
  const today = localDay(new Date());
  return {
    terms: terms.map((term) => ({
      groups: groupRows
        .filter((group) => group.termId === term.id)
        .map((group) => ({
          id: group.id,
          members: memberRows
            .filter((member) => member.groupId === group.id)
            .map((member) => ({
              id: member.id,
              image: member.image,
              linked: member.linked !== null,
              name: member.name,
            })),
          name: group.name,
        })),
      id: term.id,
      startsOn: term.startsOn,
      status: termStatus(terms, term, today),
    })),
    today,
  };
}

const refuse = (message: string) =>
  new TRPCError({ code: "BAD_REQUEST", message });

/**
 * The term a group belongs to, locked so two staff editing it don't race;
 * refuses past terms, which are read-only.
 */
async function editableTerm(tx: Transaction, termId: number) {
  const terms = await tx.select().from(groupTerms).for("update");
  const term = terms.find((candidate) => candidate.id === termId);
  if (!term) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Term not found." });
  }
  if (termStatus(terms, term, localDay(new Date())) === "past") {
    throw refuse("Past terms can't be changed.");
  }
  return term;
}

async function groupOf(tx: Transaction, groupId: number) {
  const [group] = await tx.select().from(groups).where(eq(groups.id, groupId));
  if (!group) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Group not found." });
  }
  return group;
}

async function memberOf(tx: Transaction, memberId: number) {
  const [member] = await tx
    .select({
      groupId: groupMembers.groupId,
      id: groupMembers.id,
      termId: groups.termId,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.id, memberId));
  if (!member) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
  }
  return member;
}

/** The next free position at the end of a group. */
async function endOf(tx: Transaction, groupId: number) {
  const [last] = await tx
    .select({ position: max(groupMembers.position) })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));
  return (last?.position ?? -1) + 1;
}

/** Copies the groups in force before `startsOn` (or six empty ones) to a new term. */
async function startTerm(tx: Transaction, startsOn: string) {
  const terms = await tx.select().from(groupTerms).for("update");
  const refusal = mayStartTermOn(terms, startsOn, localDay(new Date()));
  if (refusal) {
    throw refuse(refusal);
  }
  const source = termOn(terms, startsOn);
  const sourceGroups = source
    ? await tx
        .select()
        .from(groups)
        .where(eq(groups.termId, source.id))
        .orderBy(asc(groups.name))
    : [];
  const sourceMembers =
    sourceGroups.length > 0
      ? await tx
          .select()
          .from(groupMembers)
          .where(
            inArray(
              groupMembers.groupId,
              sourceGroups.map((group) => group.id)
            )
          )
          .orderBy(asc(groupMembers.position), asc(groupMembers.id))
      : [];
  const [term] = await tx.insert(groupTerms).values({ startsOn }).returning();
  if (!term) {
    throw new Error("Failed to insert group term");
  }
  const names =
    sourceGroups.length > 0
      ? sourceGroups.map((group) => group.name)
      : DEFAULT_GROUP_NAMES;
  const created = await tx
    .insert(groups)
    .values(names.map((name) => ({ name, termId: term.id })))
    .returning();
  // Re-resolved rather than copied, so links saved since the last term apply.
  const accountFor = await resolveAccounts(
    tx,
    sourceMembers.map((member) => member.name)
  );
  const copies = sourceMembers.flatMap((member) => {
    const from = sourceGroups.find((group) => group.id === member.groupId);
    const to = created.find((group) => group.name === from?.name);
    return to
      ? [
          {
            groupId: to.id,
            name: member.name,
            position: member.position,
            userId: accountFor(member.name) ?? null,
          },
        ]
      : [];
  });
  if (copies.length > 0) {
    await tx.insert(groupMembers).values(copies);
  }
  return { id: term.id };
}

/** Adds by account (linked to it) or, for a guest, by name. */
async function addMember(
  tx: Transaction,
  groupId: number,
  added: { name: string } | { userId: string }
) {
  const account = "userId" in added ? await accountOf(tx, added.userId) : null;
  const name = account?.name ?? ("name" in added ? added.name : "");
  const group = await groupOf(tx, groupId);
  await editableTerm(tx, group.termId);
  const termGroups = await tx
    .select()
    .from(groups)
    .where(eq(groups.termId, group.termId));
  const existing = await tx
    .select({ groupId: groupMembers.groupId, name: groupMembers.name })
    .from(groupMembers)
    .where(
      inArray(
        groupMembers.groupId,
        termGroups.map((candidate) => candidate.id)
      )
    );
  const taken = existing.find(
    (member) => nameKey(member.name) === nameKey(name)
  );
  if (taken) {
    const where = termGroups.find(
      (candidate) => candidate.id === taken.groupId
    );
    throw new TRPCError({
      code: "CONFLICT",
      message: `${taken.name} is already in ${where?.name ?? "a group"} this term. Move them instead.`,
    });
  }
  const accountFor = await resolveAccounts(tx, [name]);
  await tx.insert(groupMembers).values({
    groupId,
    name,
    position: await endOf(tx, groupId),
    userId: account?.id ?? accountFor(name) ?? null,
  });
}

/** A named account, picked from the member directory. */
async function accountOf(tx: Transaction, userId: string) {
  const [account] = await tx
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, userId));
  if (!account?.name) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
  }
  return { id: account.id, name: account.name };
}

async function moveMember(tx: Transaction, memberId: number, groupId: number) {
  const member = await memberOf(tx, memberId);
  const target = await groupOf(tx, groupId);
  if (target.termId !== member.termId) {
    throw refuse("Members can only move between groups of the same term.");
  }
  await editableTerm(tx, member.termId);
  if (member.groupId === groupId) {
    return;
  }
  await tx
    .update(groupMembers)
    .set({ groupId, position: await endOf(tx, groupId) })
    .where(eq(groupMembers.id, memberId));
}

const id = z.number().int().positive();

export const groupRouter = createTRPCRouter({
  /**
   * Adds a person to a group of a current or upcoming term: a picked account,
   * or a guest by name (linked through name links when one matches).
   */
  addMember: adminProcedure
    .input(
      z.union([
        z.object({ groupId: id, userId: z.string().min(1) }),
        z.object({ groupId: id, name: z.string().trim().min(1).max(100) }),
      ])
    )
    .mutation(({ input }) =>
      db.transaction((tx) => addMember(tx, input.groupId, input))
    ),
  /** Removes a term that hasn't started yet. */
  deleteTerm: adminProcedure
    .input(z.object({ termId: id }))
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const term = await editableTerm(tx, input.termId);
        if (term.startsOn <= localDay(new Date())) {
          throw refuse("Only a term that hasn't started can be deleted.");
        }
        await tx.delete(groupTerms).where(eq(groupTerms.id, term.id));
      })
    ),
  /** The cooking and cleaning groups in force today; null before the first term. */
  getCurrent: publicProcedure.query(
    async ({ ctx }) =>
      termOn(
        await loadGroupTerms(Boolean(ctx.session?.user)),
        localDay(new Date())
      ) ?? null
  ),
  /** Moves a person to another group of the same current or upcoming term. */
  moveMember: adminProcedure
    .input(z.object({ groupId: id, memberId: id }))
    .mutation(({ input }) =>
      db.transaction((tx) => moveMember(tx, input.memberId, input.groupId))
    ),
  removeMember: adminProcedure
    .input(z.object({ memberId: id }))
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const member = await memberOf(tx, input.memberId);
        await editableTerm(tx, member.termId);
        await tx.delete(groupMembers).where(eq(groupMembers.id, member.id));
      })
    ),
  /** Starts a new term from the groups in force before it, to reshuffle. */
  startTerm: adminProcedure
    .input(z.object({ startsOn: z.iso.date() }))
    .mutation(({ input }) =>
      db.transaction((tx) => startTerm(tx, input.startsOn))
    ),
  /** Every term with its groups and members, for the admin Groups page. */
  terms: adminProcedure.query(loadManagedTerms),
});
