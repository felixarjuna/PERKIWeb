import { eq } from "drizzle-orm";
import { prayers } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  addPrayerCountSchema,
  addPrayerSchema,
  editPrayerSchema,
  queryByIdSchema,
} from "../schema/schema";

export const prayerRouter = createTRPCRouter({
  getPrayers: protectedProcedure.query(() => {
    return db.select().from(prayers);
  }),
  addPrayer: protectedProcedure
    .input(addPrayerSchema)
    .mutation(async ({ input }) => {
      return await db.insert(prayers).values({ ...input });
    }),
  updatePrayerCount: protectedProcedure
    .input(addPrayerCountSchema)
    .mutation(async ({ input }) => {
      return await db
        .update(prayers)
        .set({ count: input.count, prayerNames: input.prayerNames })
        .where(eq(prayers.id, input.id));
    }),
  deletePrayer: protectedProcedure
    .input(queryByIdSchema)
    .mutation(async ({ input }) => {
      return await db.delete(prayers).where(eq(prayers.id, input.id));
    }),
  updatePrayer: protectedProcedure
    .input(editPrayerSchema)
    .mutation(async ({ input }) => {
      return await db
        .update(prayers)
        .set({ ...input })
        .where(eq(prayers.id, input.id));
    }),
});
