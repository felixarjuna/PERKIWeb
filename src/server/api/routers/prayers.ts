import { eq } from "drizzle-orm";
import { prayers } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { affectedRow } from "../errors";
import {
  addPrayerCountSchema,
  addPrayerSchema,
  editPrayerSchema,
  queryByIdSchema,
} from "../schema/schema";

export const prayerRouter = createTRPCRouter({
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
  getPrayers: protectedProcedure.query(() => db.select().from(prayers)),
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
