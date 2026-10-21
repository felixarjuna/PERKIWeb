import { eq } from "drizzle-orm";
import { settings } from "~/lib/db/schema/schema";
import { SETTING_KEYS, type SettingKey } from "~/lib/settings";
import { db } from "~/server";

export async function getSetting(key: SettingKey): Promise<string | null> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key));
  return row?.value ?? null;
}

/** Stores a setting, or removes it when `value` is null. */
export async function setSetting(
  key: SettingKey,
  value: string | null,
  updatedById: string
) {
  if (value === null) {
    await db.delete(settings).where(eq(settings.key, key));
    return;
  }
  await db
    .insert(settings)
    .values({ key, updatedById, value })
    .onConflictDoUpdate({
      set: { updatedAt: new Date(), updatedById, value },
      target: settings.key,
    });
}

/** The sheet the schedule import reads, or null until staff set one. */
export const scheduleSheetId = () => getSetting(SETTING_KEYS.scheduleSheetId);
