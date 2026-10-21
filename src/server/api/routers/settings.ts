import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { settings, users } from "~/lib/db/schema/schema";
import { SETTING_KEYS, sheetIdFrom, sheetUrl } from "~/lib/settings";
import { db } from "~/server";
import { sheetTitle } from "~/server/google-sheets";
import { setSetting } from "~/server/settings";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const settingsRouter = createTRPCRouter({
  /** The schedule sheet, with its file name when Google can open it. */
  scheduleSheet: adminProcedure.query(async () => {
    const [row] = await db
      .select({
        updatedAt: settings.updatedAt,
        updatedBy: users.name,
        value: settings.value,
      })
      .from(settings)
      .leftJoin(users, eq(users.id, settings.updatedById))
      .where(eq(settings.key, SETTING_KEYS.scheduleSheetId));
    if (!row) {
      return null;
    }
    const title = await sheetTitle(row.value).catch(() => null);
    return {
      id: row.value,
      title,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
      url: sheetUrl(row.value),
    };
  }),
  /**
   * Sets the schedule sheet from a pasted link or id. It's only saved once
   * Google opens it, so a typo or a private sheet is caught here, not on import.
   */
  setScheduleSheet: adminProcedure
    .input(z.object({ link: z.string().max(500).nullable() }))
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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Paste the link of a Google Sheet (docs.google.com/spreadsheets/…).",
        });
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
