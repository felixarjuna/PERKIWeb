import { TRPCError } from "@trpc/server";
import { asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  groupMembers,
  groups,
  nameLinks,
  scheduleAssignments,
  users,
} from "~/lib/db/schema/schema";
import { nameKey, suggestAccount } from "~/lib/people";
import { type ServingRole, servingRoleLabels } from "~/lib/serving-roles";
import { db } from "~/server";
import { linkName, unlinkName } from "~/server/people";
import { isPgError, PG_FOREIGN_KEY_VIOLATION } from "../errors";
import { adminProcedure, createTRPCRouter } from "../trpc";

const nameInput = z.object({ name: z.string().trim().min(1).max(100) });

/** Every account, for suggestions and the picker (never credentials). */
const loadAccounts = () =>
  db
    .select({ id: users.id, image: users.image, name: users.name })
    .from(users)
    .orderBy(asc(users.name));

interface Unlinked {
  key: string;
  /** The most common spelling, for display. */
  name: string;
  /** Only ever written as preacher: usually a guest pastor. */
  preacherOnly: boolean;
  spellings: Map<string, number>;
  total: number;
  uses: Map<string, number>;
}

export const peopleRouter = createTRPCRouter({
  accounts: adminProcedure.query(loadAccounts),
  /** Links a spelling to an account everywhere it's used, now and on later imports. */
  link: adminProcedure
    .input(nameInput.extend({ userId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      db
        .transaction((tx) =>
          linkName(tx, input.name, input.userId, ctx.session.user.id)
        )
        .catch((error: unknown) => {
          if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
            throw new TRPCError({
              cause: error,
              code: "NOT_FOUND",
              message: "Account not found.",
            });
          }
          throw error;
        })
    ),
  /** Saved links, with the account each spelling points to. */
  links: adminProcedure.query(() =>
    db
      .select({
        account: { id: users.id, image: users.image, name: users.name },
        name: nameLinks.name,
      })
      .from(nameLinks)
      .innerJoin(users, eq(users.id, nameLinks.userId))
      .orderBy(asc(nameLinks.name))
  ),
  unlink: adminProcedure
    .input(nameInput)
    .mutation(({ input }) =>
      db.transaction((tx) => unlinkName(tx, input.name))
    ),
  /**
   * Names on schedules and in groups that point to no account, grouped by
   * spelling, with where they're used and the account they most likely mean.
   */
  unlinked: adminProcedure.query(async () => {
    const [slots, members, accounts] = await Promise.all([
      db
        .select({
          name: scheduleAssignments.name,
          role: scheduleAssignments.role,
        })
        .from(scheduleAssignments)
        .where(isNull(scheduleAssignments.userId)),
      db
        .select({ group: groups.name, name: groupMembers.name })
        .from(groupMembers)
        .innerJoin(groups, eq(groups.id, groupMembers.groupId))
        .where(isNull(groupMembers.userId)),
      loadAccounts(),
    ]);
    const byKey = new Map<string, Unlinked>();
    const add = (name: string, use: string, preacher: boolean) => {
      const key = nameKey(name);
      const entry = byKey.get(key) ?? {
        key,
        name,
        preacherOnly: true,
        spellings: new Map(),
        total: 0,
        uses: new Map(),
      };
      entry.total += 1;
      entry.preacherOnly &&= preacher;
      entry.spellings.set(name, (entry.spellings.get(name) ?? 0) + 1);
      entry.uses.set(use, (entry.uses.get(use) ?? 0) + 1);
      byKey.set(key, entry);
    };
    for (const slot of slots) {
      add(
        slot.name,
        servingRoleLabels[slot.role as ServingRole] ?? slot.role,
        slot.role === "preacher"
      );
    }
    for (const member of members) {
      add(member.name, member.group, false);
    }
    return [...byKey.values()]
      .map((entry) => {
        const name =
          [...entry.spellings].sort((a, b) => b[1] - a[1]).at(0)?.[0] ??
          entry.name;
        return {
          key: entry.key,
          name,
          preacherOnly: entry.preacherOnly,
          spellings: [...entry.spellings.keys()],
          suggestion: suggestAccount(name, accounts),
          total: entry.total,
          uses: [...entry.uses].map(([label, count]) => ({ count, label })),
        };
      })
      .sort(
        (a, b) =>
          Number(a.preacherOnly) - Number(b.preacherOnly) ||
          b.total - a.total ||
          a.name.localeCompare(b.name)
      );
  }),
});
