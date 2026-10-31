import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { settings, users } from "~/lib/db/schema/schema";
import {
  DEFAULT_DISCORD_INVITE_URL,
  discordInviteFrom,
  docIdFrom,
  docUrl,
  driveUrlFrom,
  SETTING_KEYS,
  type SettingKey,
  sheetIdFrom,
  sheetUrl,
  whatsappGroupFrom,
} from "~/lib/settings";
import { labelTaken } from "~/lib/takeaway-sources";
import { db } from "~/server";
import { docHtml } from "~/server/google-docs";
import { sheetTitle } from "~/server/google-sheets";
import { emailSettings } from "~/server/invite-email";
import { setSetting, takeawayDeadlineWeekday } from "~/server/settings";
import {
  takeawaySources,
  updateTakeawaySources,
} from "~/server/takeaway-sources";
import { adminProcedure, createTRPCRouter } from "../trpc";

const linkInput = z.object({ link: z.string().max(500).nullable() });

const invalid = (message: string) =>
  new TRPCError({ code: "BAD_REQUEST", message });

/** The document id in a pasted link, once Google opens the document. */
async function openableDoc(link: string) {
  const docId = docIdFrom(link);
  if (!docId) {
    throw invalid(
      "Paste the link of a Google Doc (docs.google.com/document/…)."
    );
  }
  await docHtml(docId).catch((error: unknown) => {
    throw new TRPCError({
      cause: error,
      code: "BAD_REQUEST",
      message:
        "Google couldn't open this document. Check the link, and that the document is shared with “Anyone with the link”.",
    });
  });
  return docId;
}

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
  email: adminProcedure.query(emailSettings),
  /** Everything on Settings → Integrations, with where each value comes from. */
  integrations: adminProcedure.query(async () => {
    const row = await loadIntegrationRows();
    const sheet = row(SETTING_KEYS.scheduleSheetId);
    const drive = row(SETTING_KEYS.driveFolderUrl);
    const discord = row(SETTING_KEYS.discordInviteUrl);
    const whatsapp = row(SETTING_KEYS.whatsappGroupUrl);
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
      whatsappGroup: whatsapp && { ...changed(whatsapp), url: whatsapp.value },
    };
  }),
  /** Removes a source; its documents themselves are left alone. */
  removeTakeawaySource: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await updateTakeawaySources(ctx.session.user.id, (sources) =>
        sources.filter((source) => source.id !== input.id)
      );
    }),
  /**
   * Adds a source (`id` null) or changes one, from pasted links or ids. Like
   * the sheet, each document is only saved once Google opens it.
   */
  saveTakeawaySource: adminProcedure
    .input(
      z.object({
        id: z.string().nullable(),
        label: z.string().trim().min(1, "Give the source a name.").max(40),
        notes: z.string().max(500),
        tldr: z.string().max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const notesDocId = await openableDoc(input.notes);
      const tldrDocId =
        input.tldr.trim() === "" ? null : await openableDoc(input.tldr);
      const id = input.id ?? randomUUID();
      await updateTakeawaySources(ctx.session.user.id, (sources) => {
        if (labelTaken(sources, input.label, id)) {
          throw invalid(`There's already a source named “${input.label}”.`);
        }
        const source = { id, label: input.label, notesDocId, tldrDocId };
        if (input.id === null) {
          return [...sources, source];
        }
        if (!sources.some((existing) => existing.id === id)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This source was removed meanwhile. Add it again.",
          });
        }
        return sources.map((existing) =>
          existing.id === id ? source : existing
        );
      });
      return { id };
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
  setEmail: adminProcedure
    .input(
      z
        .object({
          enabled: z.boolean(),
          sender: z
            .string()
            .trim()
            .pipe(z.union([z.email(), z.literal("")])),
        })
        .refine((input) => !input.enabled || input.sender.length > 0, {
          message: "Set a sender address before turning email on.",
          path: ["sender"],
        })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .insert(settings)
        .values(
          (
            [
              [SETTING_KEYS.emailEnabled, String(input.enabled)],
              [SETTING_KEYS.emailSender, input.sender],
            ] as const
          ).map(([key, value]) => ({
            key,
            updatedById: ctx.session.user.id,
            value,
          }))
        )
        .onConflictDoUpdate({
          set: {
            updatedAt: new Date(),
            updatedById: ctx.session.user.id,
            value: sql`excluded.value`,
          },
          target: settings.key,
        });
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
  setTakeawayDeadline: adminProcedure
    .input(z.object({ weekday: z.number().int().min(1).max(7) }))
    .mutation(async ({ ctx, input }) => {
      await setSetting(
        SETTING_KEYS.takeawayDeadlineWeekday,
        String(input.weekday),
        ctx.session.user.id
      );
    }),
  /** Hides the WhatsApp card on /account with `null`. */
  setWhatsappGroup: adminProcedure
    .input(linkInput)
    .mutation(async ({ ctx, input }) => {
      const url = input.link === null ? null : whatsappGroupFrom(input.link);
      if (input.link !== null && !url) {
        throw invalid(
          "Paste a WhatsApp group invite link (chat.whatsapp.com/…)."
        );
      }
      await setSetting(SETTING_KEYS.whatsappGroupUrl, url, ctx.session.user.id);
    }),
  takeawayDeadline: adminProcedure.query(takeawayDeadlineWeekday),
  /** The document pairs "Import from Docs" reads, on Settings → Takeaways. */
  takeawaySources: adminProcedure.query(async () => {
    const sources = await takeawaySources();
    const [row] = await db
      .select({ updatedAt: settings.updatedAt, updatedBy: users.name })
      .from(settings)
      .leftJoin(users, eq(users.id, settings.updatedById))
      .where(eq(settings.key, SETTING_KEYS.takeawaySources));
    return {
      changed: row ?? null,
      sources: sources.map((source) => ({
        id: source.id,
        label: source.label,
        notes: { id: source.notesDocId, url: docUrl(source.notesDocId) },
        tldr: source.tldrDocId
          ? { id: source.tldrDocId, url: docUrl(source.tldrDocId) }
          : null,
      })),
    };
  }),
});
