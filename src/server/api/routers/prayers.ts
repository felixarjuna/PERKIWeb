import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { prayers } from "~/lib/db/schema/schema";
import { getUsernameFromName } from "~/lib/utils";
import { db } from "~/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { affectedRow } from "../errors";
import {
  addPrayerCountSchema,
  addPrayerSchema,
  editPrayerSchema,
  prayerAcknowledgementSchema,
  prayerVisibilitySchema,
  queryByIdSchema,
} from "../schema/schema";

export const prayerRouter = createTRPCRouter({
  acknowledgePrayer: protectedProcedure
    .input(prayerAcknowledgementSchema)
    .mutation(
      async ({ input, ctx }) =>
        await db.transaction(async (tx) => {
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
          const legacyName = getUsernameFromName(ctx.session.user.name ?? "");
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
        })
    ),
  addPrayer: protectedProcedure
    .input(addPrayerSchema)
    .mutation(
      async ({ input }) => await db.insert(prayers).values({ ...input })
    ),
  deletePrayer: protectedProcedure
    .input(queryByIdSchema)
    .mutation(async ({ input }) =>
      affectedRow(
        await db
          .delete(prayers)
          .where(eq(prayers.id, input.id))
          .returning({ id: prayers.id }),
        "Prayer"
      )
    ),
  getOwnPrayerAcknowledgements: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({ id: prayers.id, names: prayers.prayerNames })
      .from(prayers)
      .where(eq(prayers.visibility, "published"));
    const legacyName = getUsernameFromName(ctx.session.user.name ?? "");
    return rows
      .filter(
        (row) =>
          Array.isArray(row.names) &&
          (row.names.includes(ctx.session.user.id) ||
            (legacyName && row.names.includes(legacyName)))
      )
      .map((row) => row.id);
  }),
  getPrayers: protectedProcedure.query(() => db.select().from(prayers)),
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
  setPrayerVisibility: protectedProcedure
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
  updatePrayer: protectedProcedure
    .input(editPrayerSchema)
    .mutation(async ({ input }) =>
      affectedRow(
        await db
          .update(prayers)
          .set({ ...input })
          .where(eq(prayers.id, input.id))
          .returning({ id: prayers.id }),
        "Prayer"
      )
    ),
  updatePrayerCount: protectedProcedure
    .input(addPrayerCountSchema)
    .mutation(async ({ input }) =>
      affectedRow(
        await db
          .update(prayers)
          .set({ count: input.count, prayerNames: input.prayerNames })
          .where(eq(prayers.id, input.id))
          .returning({ id: prayers.id }),
        "Prayer"
      )
    ),
});
