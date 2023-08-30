import { prayers } from "@/db/schema";
import { db } from "@/server";
import { publicProcedure, router } from "@/server/trpc";
import { eq } from "drizzle-orm";
import { addPrayerCountSchema, addPrayerSchema } from "../schema/schema";

export const prayerRouter = router({
  getPrayers: publicProcedure.query(async () => {
    return db.select().from(prayers).all();
  }),
  addPrayer: publicProcedure.input(addPrayerSchema).mutation(async ({ input }) => {
    return db
      .insert(prayers)
      .values({ ...input })
      .run();
  }),
  updatePrayerCount: publicProcedure.input(addPrayerCountSchema).mutation(async ({ input }) => {
    return db.update(prayers).set({ count: input.count }).where(eq(prayers.id, input.id)).run();
  }),
});
