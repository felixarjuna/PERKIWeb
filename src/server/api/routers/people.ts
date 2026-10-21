import { TRPCError } from "@trpc/server";
import { asc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
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

interface Spelling {
  count: number;
  key: string;
  spellings: Set<string>;
}

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
  /**
   * Every account that names on schedules or in groups point to, with each
   * spelling (grouped by `nameKey`), how often it's used, and whether it's a
   * saved link (which can be removed) or an exact match of the account name.
   */
  linked: adminProcedure.query(async () => {
    const [slots, members, links] = await Promise.all([
      db
        .select({
          name: scheduleAssignments.name,
          userId: scheduleAssignments.userId,
        })
        .from(scheduleAssignments)
        .where(isNotNull(scheduleAssignments.userId)),
      db
        .select({ name: groupMembers.name, userId: groupMembers.userId })
        .from(groupMembers)
        .where(isNotNull(groupMembers.userId)),
      db
        .select({
          account: { id: users.id, image: users.image, name: users.name },
          name: nameLinks.name,
        })
        .from(nameLinks)
        .innerJoin(users, eq(users.id, nameLinks.userId)),
    ]);
    const saved = new Set(links.map((link) => link.name));
    const accounts = new Map(
      links.map((link) => [link.account.id, link.account])
    );
    const usedIds = [
      ...new Set([...slots, ...members].flatMap((use) => use.userId ?? [])),
    ].filter((id) => !accounts.has(id));
    if (usedIds.length > 0) {
      const rows = await db
        .select({ id: users.id, image: users.image, name: users.name })
        .from(users)
        .where(inArray(users.id, usedIds));
      for (const row of rows) {
        accounts.set(row.id, row);
      }
    }

    const byAccount = new Map<string, Map<string, Spelling>>();
    const add = (userId: string, key: string, name: string | null) => {
      const names = byAccount.get(userId) ?? new Map<string, Spelling>();
      const entry = names.get(key) ?? { count: 0, key, spellings: new Set() };
      if (name === null) {
        entry.spellings.add(key);
      } else {
        entry.count += 1;
        entry.spellings.add(name);
      }
      names.set(key, entry);
      byAccount.set(userId, names);
    };
    for (const use of [...slots, ...members]) {
      if (use.userId) {
        add(use.userId, nameKey(use.name), use.name);
      }
    }
    // Saved links nothing uses yet still belong on the list.
    for (const link of links) {
      if (!byAccount.get(link.account.id)?.has(link.name)) {
        add(link.account.id, link.name, null);
      }
    }

    return [...byAccount]
      .flatMap(([userId, names]) => {
        const account = accounts.get(userId);
        return account
          ? [
              {
                account,
                names: [...names.values()]
                  .map((entry) => ({
                    count: entry.count,
                    key: entry.key,
                    label: [...entry.spellings].join(" / "),
                    saved: saved.has(entry.key),
                  }))
                  .sort((x, y) => y.count - x.count),
              },
            ]
          : [];
      })
      .sort((x, y) =>
        (x.account.name ?? "").localeCompare(y.account.name ?? "", undefined, {
          sensitivity: "base",
        })
      );
  }),
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
