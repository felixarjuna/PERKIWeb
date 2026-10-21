import { inArray } from "drizzle-orm";
import {
  groupMembers,
  nameLinks,
  scheduleAssignments,
  users,
} from "~/lib/db/schema/schema";
import { nameKey } from "~/lib/people";
import type { Transaction } from "~/server/schedule-assignments";

/**
 * Finds the account behind each written name: a saved name link first, then
 * an account whose name is spelled the same, if exactly one is.
 */
export async function resolveAccounts(tx: Transaction, names: string[]) {
  const keys = [...new Set(names.map(nameKey))].filter(Boolean);
  const accountFor = new Map<string, string>();
  if (keys.length === 0) {
    return (name: string) => accountFor.get(nameKey(name));
  }
  const [links, accounts] = await Promise.all([
    tx
      .select({ name: nameLinks.name, userId: nameLinks.userId })
      .from(nameLinks)
      .where(inArray(nameLinks.name, keys)),
    tx.select({ id: users.id, name: users.name }).from(users),
  ]);
  for (const key of keys) {
    const linked = links.find((link) => link.name === key)?.userId;
    const sameName = accounts.filter(
      (account) => account.name && nameKey(account.name) === key
    );
    const userId = linked ?? (sameName.length === 1 ? sameName[0]?.id : null);
    if (userId) {
      accountFor.set(key, userId);
    }
  }
  return (name: string) => accountFor.get(nameKey(name));
}

/** Points every slot and group entry with this spelling at its resolved account. */
async function relink(tx: Transaction, key: string) {
  const [slots, members] = await Promise.all([
    tx
      .select({ id: scheduleAssignments.id, name: scheduleAssignments.name })
      .from(scheduleAssignments),
    tx
      .select({ id: groupMembers.id, name: groupMembers.name })
      .from(groupMembers),
  ]);
  const accountFor = await resolveAccounts(tx, [key]);
  const userId = accountFor(key) ?? null;
  const matching = (rows: { id: number; name: string }[]) =>
    rows.filter((row) => nameKey(row.name) === key).map((row) => row.id);
  const slotIds = matching(slots);
  const memberIds = matching(members);
  if (slotIds.length > 0) {
    await tx
      .update(scheduleAssignments)
      .set({ userId })
      .where(inArray(scheduleAssignments.id, slotIds));
  }
  if (memberIds.length > 0) {
    await tx
      .update(groupMembers)
      .set({ userId })
      .where(inArray(groupMembers.id, memberIds));
  }
  return { groups: memberIds.length, slots: slotIds.length };
}

/** Links a spelling to an account, for every existing and future use of it. */
export async function linkName(
  tx: Transaction,
  name: string,
  userId: string,
  linkedById: string
) {
  const key = nameKey(name);
  await tx
    .insert(nameLinks)
    .values({ linkedById, name: key, userId })
    .onConflictDoUpdate({
      set: { createdAt: new Date(), linkedById, userId },
      target: nameLinks.name,
    });
  return relink(tx, key);
}

/** Removes a saved link; the spelling falls back to an exact account name, if any. */
export async function unlinkName(tx: Transaction, name: string) {
  const key = nameKey(name);
  await tx.delete(nameLinks).where(inArray(nameLinks.name, [key]));
  return relink(tx, key);
}
