import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { prayers, users } from "~/lib/db/schema/schema";
import { getUsernameFromName } from "~/lib/utils";
import { db } from "~/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { isAdmin } from "~/server/authz";
import {
  addPrayerSchema,
  editPrayerSchema,
  queryByIdSchema,
  setPrayedSchema,
} from "../schema/schema";

/** The username prayers are credited to, derived from the stored name. */
const nameOf = async (userId: string): Promise<string> => {
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return getUsernameFromName(user?.name ?? "");
};

/** Throws unless the prayer exists and `userId` wrote it or is an admin. */
const assertCanManage = async (prayerId: number, userId: string) => {
  const [prayer] = await db
    .select({ authorId: prayers.authorId })
    .from(prayers)
    .where(eq(prayers.id, prayerId))
    .limit(1);
  if (!prayer) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Prayer not found." });
  }
  if (prayer.authorId !== userId && !(await isAdmin(userId))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only change your own prayers.",
    });
  }
};

export const prayerRouter = createTRPCRouter({
  /** The author and their name come from the session, never from input. */
  addPrayer: protectedProcedure
    .input(addPrayerSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;
      await db.insert(prayers).values({
        authorId,
        content: input.content,
        isAnonymous: input.isAnonymous,
        name: await nameOf(authorId),
        prayerNames: [],
      });
    }),
  deletePrayer: protectedProcedure
    .input(queryByIdSchema)
    .mutation(async ({ ctx, input }) => {
      await assertCanManage(input.id, ctx.session.user.id);
      await db.delete(prayers).where(eq(prayers.id, input.id));
      return { id: input.id };
    }),
  /**
   * Every prayer, shaped for the viewer: anonymous prayers hide the author's
   * name from everyone but the author and admins, and the author id is never
   * sent to the client.
   */
  getPrayers: protectedProcedure.query(async ({ ctx }) => {
    const viewerId = ctx.session.user.id;
    const [rows, admin, viewerName] = await Promise.all([
      db.select().from(prayers).orderBy(prayers.id),
      isAdmin(viewerId),
      nameOf(viewerId),
    ]);
    return rows.map(({ authorId, ...prayer }) => {
      const canManage = admin || authorId === viewerId;
      const prayerNames = prayer.prayerNames as string[];
      return {
        ...prayer,
        canManage,
        name: prayer.isAnonymous && !canManage ? null : prayer.name,
        prayedByMe: viewerName !== "" && prayerNames.includes(viewerName),
        prayerNames,
      };
    });
  }),
  /**
   * Marks or unmarks the signed-in user as praying for a request. The row is
   * locked so concurrent toggles cannot lose an update.
   */
  setPrayed: protectedProcedure
    .input(setPrayedSchema)
    .mutation(async ({ ctx, input }) => {
      const name = await nameOf(ctx.session.user.id);
      return await db.transaction(async (tx) => {
        const [prayer] = await tx
          .select({ prayerNames: prayers.prayerNames })
          .from(prayers)
          .where(eq(prayers.id, input.id))
          .for("update");
        if (!prayer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prayer not found.",
          });
        }
        const current = prayer.prayerNames as string[];
        const others = current.filter((prayerName) => prayerName !== name);
        let prayerNames = others;
        if (input.prayed) {
          prayerNames = current.includes(name) ? current : [...current, name];
        }
        await tx
          .update(prayers)
          .set({ count: prayerNames.length, prayerNames })
          .where(eq(prayers.id, input.id));
        return { count: prayerNames.length, id: input.id };
      });
    }),
  updatePrayer: protectedProcedure
    .input(editPrayerSchema)
    .mutation(async ({ ctx, input }) => {
      await assertCanManage(input.id, ctx.session.user.id);
      await db
        .update(prayers)
        .set({ content: input.content, isAnonymous: input.isAnonymous })
        .where(eq(prayers.id, input.id));
      return { id: input.id };
    }),
});
