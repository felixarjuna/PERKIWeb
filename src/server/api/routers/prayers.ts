import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { prayers, users } from "~/lib/db/schema/schema";
import { getUsernameFromName } from "~/lib/utils";
import { db } from "~/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { isAdmin } from "~/server/authz";
import { affectedRow } from "../errors";
import {
  addPrayerSchema,
  editPrayerSchema,
  prayerAcknowledgementSchema,
  prayerVisibilitySchema,
  queryByIdSchema,
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

/**
 * Prayer requests are private until an admin publishes them. Authors manage
 * their own requests; admins review, publish and manage all of them. The
 * public wall only ever receives `getPublishedPrayers`' safe projection.
 */
export const prayerRouter = createTRPCRouter({
  /**
   * Marks or unmarks the signed-in user as praying for a published request.
   * The row is locked so concurrent toggles cannot lose an update; people are
   * stored by user id (older rows may still hold their username).
   */
  acknowledgePrayer: protectedProcedure
    .input(prayerAcknowledgementSchema)
    .mutation(async ({ input, ctx }) => {
      const legacyName = await nameOf(ctx.session.user.id);
      return await db.transaction(async (tx) => {
        const rows = await tx
          .select()
          .from(prayers)
          .where(eq(prayers.id, input.id))
          .for("update");
        const prayer = rows.at(0);
        if (prayer?.visibility !== "published") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This prayer is no longer public.",
          });
        }
        const names = Array.isArray(prayer.prayerNames)
          ? prayer.prayerNames.filter(
              (name): name is string =>
                typeof name === "string" &&
                name !== ctx.session.user.id &&
                (!legacyName || name !== legacyName)
            )
          : [];
        if (input.pressed) {
          names.push(ctx.session.user.id);
        }
        await tx
          .update(prayers)
          .set({ count: names.length, prayerNames: names })
          .where(eq(prayers.id, input.id));
        return { count: names.length };
      });
    }),
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
  /** Published prayer ids the signed-in person is praying for. */
  getOwnPrayerAcknowledgements: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({ id: prayers.id, names: prayers.prayerNames })
      .from(prayers)
      .where(eq(prayers.visibility, "published"));
    const legacyName = await nameOf(ctx.session.user.id);
    return rows
      .filter(
        (row) =>
          Array.isArray(row.names) &&
          (row.names.includes(ctx.session.user.id) ||
            (legacyName && row.names.includes(legacyName)))
      )
      .map((row) => row.id);
  }),
  /** The signed-in person's own requests, private or published, newest first. */
  getOwnPrayers: protectedProcedure.query(({ ctx }) =>
    db
      .select({
        content: prayers.content,
        count: prayers.count,
        createdAt: prayers.createdAt,
        id: prayers.id,
        isAnonymous: prayers.isAnonymous,
        visibility: prayers.visibility,
      })
      .from(prayers)
      .where(eq(prayers.authorId, ctx.session.user.id))
      .orderBy(desc(prayers.createdAt))
  ),
  /** Review list for admins; the author id is never sent to the client. */
  getPrayers: adminProcedure.query(async () => {
    const rows = await db.select().from(prayers).orderBy(prayers.id);
    return rows.map(({ authorId: _authorId, ...prayer }) => prayer);
  }),
  getPublishedPrayers: publicProcedure.query(async () => {
    const rows = await db
      .select({
        content: prayers.content,
        count: prayers.count,
        createdAt: prayers.createdAt,
        id: prayers.id,
        isAnonymous: prayers.isAnonymous,
        name: prayers.name,
      })
      .from(prayers)
      .where(eq(prayers.visibility, "published"))
      .orderBy(desc(prayers.createdAt));
    return rows.map((row) => ({
      ...row,
      name: row.isAnonymous ? null : row.name,
    }));
  }),
  setPrayerVisibility: adminProcedure
    .input(prayerVisibilitySchema)
    .mutation(async ({ input }) =>
      affectedRow(
        await db
          .update(prayers)
          .set({ visibility: input.visibility })
          .where(eq(prayers.id, input.id))
          .returning({ id: prayers.id }),
        "Prayer"
      )
    ),
  /**
   * Authors (or admins) change wording and anonymity. Editing a published
   * request returns it to review, unless an admin made the change.
   */
  updatePrayer: protectedProcedure
    .input(editPrayerSchema)
    .mutation(async ({ ctx, input }) => {
      await assertCanManage(input.id, ctx.session.user.id);
      const admin = await isAdmin(ctx.session.user.id);
      return affectedRow(
        await db
          .update(prayers)
          .set({
            content: input.content,
            isAnonymous: input.isAnonymous,
            ...(admin ? {} : { visibility: "private" as const }),
          })
          .where(eq(prayers.id, input.id))
          .returning({ id: prayers.id }),
        "Prayer"
      );
    }),
});
