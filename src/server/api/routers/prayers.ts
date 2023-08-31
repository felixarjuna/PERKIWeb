import { prayers } from "@/db/schema";
import { db } from "@/server";
import { publicProcedure, router } from "@/server/trpc";
import { eq } from "drizzle-orm";
import { addPrayerCountSchema, addPrayerSchema } from "../schema/schema";

export const prayerRouter = router({
  getPrayers: publicProcedure.query(() => {
    return db.select().from(prayers);
  }),
  addPrayer: publicProcedure.input(addPrayerSchema).mutation(({ input }) => {
    return db.insert(prayers).values({ ...input });
  }),
  updatePrayerCount: publicProcedure.input(addPrayerCountSchema).mutation(({ input }) => {
    return db
      .update(prayers)
      .set({ count: input.count, prayerNames: input.prayerNames })
      .where(eq(prayers.id, input.id));
  }),
});
