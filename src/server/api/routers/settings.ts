import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { settings, users } from "~/lib/db/schema/schema";
import {
  DEFAULT_DISCORD_INVITE_URL,
  discordInviteFrom,
  driveUrlFrom,
  SETTING_KEYS,
  type SettingKey,
  sheetIdFrom,
  sheetUrl,
} from "~/lib/settings";
import { db } from "~/server";
import { sheetTitle } from "~/server/google-sheets";
import { setSetting } from "~/server/settings";
import { adminProcedure, createTRPCRouter } from "../trpc";

const linkInput = z.object({ link: z.string().max(500).nullable() });

const invalid = (message: string) =>
  new TRPCError({ code: "BAD_REQUEST", message });

/** Who last changed each integration setting, and when. */
async function loadIntegrationRows() {
  const keys: SettingKey[] = Object.values(SETTING_KEYS);
  const rows = await db
    .select({
      key: settings.key,
      updatedAt: settings.updatedAt,
      updatedBy: users.name,
      value: settings.value,
    })
    .from(settings)
    .leftJoin(users, eq(users.id, settings.updatedById))
    .where(inArray(settings.key, keys));
  return (key: SettingKey) => rows.find((row) => row.key === key) ?? null;
}

const changed = (row: { updatedAt: Date; updatedBy: string | null }) => ({
  updatedAt: row.updatedAt,
  updatedBy: row.updatedBy,
});

/** The saved Drive folder, else the one still set in the server environment. */
function driveFolderOf(
  drive: { updatedAt: Date; updatedBy: string | null; value: string } | null
) {
  if (drive) {
    return { ...changed(drive), fromEnvironment: false, url: drive.value };
  }
  const fromEnvironment = process.env.DRIVE_FOLDER_URL || null;
  return fromEnvironment
    ? {
        fromEnvironment: true,
        updatedAt: null,
        updatedBy: null,
        url: fromEnvironment,
      }
    : null;
}

export const settingsRouter = createTRPCRouter({
  /** Everything on Settings → Integrations, with where each value comes from. */
  integrations: adminProcedure.query(async () => {
    const row = await loadIntegrationRows();
    const sheet = row(SETTING_KEYS.scheduleSheetId);
    const drive = row(SETTING_KEYS.driveFolderUrl);
    const discord = row(SETTING_KEYS.discordInviteUrl);
    return {
      discordInvite: discord
        ? { ...changed(discord), isDefault: false, url: discord.value }
        : {
            isDefault: true,
            updatedAt: null,
            updatedBy: null,
            url: DEFAULT_DISCORD_INVITE_URL,
          },
      driveFolder: driveFolderOf(drive),
      scheduleSheet: sheet && {
        ...changed(sheet),
        id: sheet.value,
        title: await sheetTitle(sheet.value).catch(() => null),
        url: sheetUrl(sheet.value),
      },
    };
  }),
  /** Back to the default invite with `null`. */
  setDiscordInvite: adminProcedure
    .input(linkInput)
    .mutation(async ({ ctx, input }) => {
      const url = input.link === null ? null : discordInviteFrom(input.link);
      if (input.link !== null && !url) {
        throw invalid(
          "Paste a Discord invite link (discord.gg/… or discord.com/invite/…)."
        );
      }
      await setSetting(SETTING_KEYS.discordInviteUrl, url, ctx.session.user.id);
    }),
  /** Hides the Drive item with `null`. */
  setDriveFolder: adminProcedure
    .input(linkInput)
    .mutation(async ({ ctx, input }) => {
      const url = input.link === null ? null : driveUrlFrom(input.link);
      if (input.link !== null && !url) {
        throw invalid("Paste a Google Drive link (drive.google.com/…).");
      }
      await setSetting(SETTING_KEYS.driveFolderUrl, url, ctx.session.user.id);
    }),
  /**
   * Sets the schedule sheet from a pasted link or id. It's only saved once
   * Google opens it, so a typo or a private sheet is caught here, not on import.
   */
  setScheduleSheet: adminProcedure
    .input(linkInput)
    .mutation(async ({ ctx, input }) => {
      if (input.link === null) {
        await setSetting(
          SETTING_KEYS.scheduleSheetId,
          null,
          ctx.session.user.id
        );
        return { title: null };
      }
      const sheetId = sheetIdFrom(input.link);
      if (!sheetId) {
        throw invalid(
          "Paste the link of a Google Sheet (docs.google.com/spreadsheets/…)."
        );
      }
      const title = await sheetTitle(sheetId).catch((error: unknown) => {
        throw new TRPCError({
          cause: error,
          code: "BAD_REQUEST",
          message:
            "Google couldn't open this sheet. Check the link, and that the sheet is shared with “Anyone with the link”.",
        });
      });
      await setSetting(
        SETTING_KEYS.scheduleSheetId,
        sheetId,
        ctx.session.user.id
      );
      return { title };
    }),
});
