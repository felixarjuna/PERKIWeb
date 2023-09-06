import { eq } from "drizzle-orm";
import { prayers } from "~/db/schema";
import { db } from "~/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  addPrayerCountSchema,
  addPrayerSchema,
  deleteEntitySchema,
} from "../schema/schema";

export const prayerRouter = createTRPCRouter({
  getPrayers: publicProcedure.query(() => {
    return db.select().from(prayers);
  }),
  addPrayer: publicProcedure
    .input(addPrayerSchema)
    .mutation(async ({ input }) => {
      return await db.insert(prayers).values({ ...input });
    }),
  updatePrayerCount: publicProcedure
    .input(addPrayerCountSchema)
    .mutation(async ({ input }) => {
      return await db
        .update(prayers)
        .set({ count: input.count, prayerNames: input.prayerNames })
        .where(eq(prayers.id, input.id));
    }),
  deletePrayer: publicProcedure
    .input(deleteEntitySchema)
    .mutation(async ({ input }) => {
      return await db.delete(prayers).where(eq(prayers.id, input.id));
    }),
});
