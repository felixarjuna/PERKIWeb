import { eq, inArray } from "drizzle-orm";
import { settings } from "~/lib/db/schema/schema";
import {
  DEFAULT_DISCORD_INVITE_URL,
  SETTING_KEYS,
  type SettingKey,
} from "~/lib/settings";
import { DEFAULT_TAKEAWAY_WEEKDAY } from "~/lib/takeaway-deadline";
import { db } from "~/server";

export async function takeawayDeadlineWeekday() {
  const value = Number(await getSetting(SETTING_KEYS.takeawayDeadlineWeekday));
  return Number.isInteger(value) && value >= 1 && value <= 7
    ? value
    : DEFAULT_TAKEAWAY_WEEKDAY;
}

export async function getSettings<K extends SettingKey>(
  keys: readonly K[]
): Promise<Partial<Record<K, string>>> {
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(inArray(settings.key, [...keys]));
  return Object.fromEntries(rows.map((row) => [row.key, row.value])) as Partial<
    Record<K, string>
  >;
}

export async function getSetting(key: SettingKey): Promise<string | null> {
  return (await getSettings([key]))[key] ?? null;
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

/**
 * Links shown around the site. The Drive folder falls back to the old
 * DRIVE_FOLDER_URL env var (read directly so tests need no full env) until
 * it's set in Settings; Discord falls back to the long-standing invite.
 */
export async function siteLinks() {
  const values = await getSettings([
    SETTING_KEYS.discordInviteUrl,
    SETTING_KEYS.driveFolderUrl,
  ]);
  return {
    discordInviteUrl:
      values[SETTING_KEYS.discordInviteUrl] ?? DEFAULT_DISCORD_INVITE_URL,
    driveFolderUrl:
      values[SETTING_KEYS.driveFolderUrl] ??
      (process.env.DRIVE_FOLDER_URL || null),
  };
}
