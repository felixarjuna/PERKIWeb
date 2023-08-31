import { publicProcedure, router } from "@/server/trpc";
import { addPrayerCountSchema, addPrayerSchema } from "../schema/schema";

export const prayerRouter = router({
  getPrayers: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.prayers.findMany({ include: { prayers: true } });
  }),
  addPrayer: publicProcedure.input(addPrayerSchema).mutation(({ ctx, input }) => {
    return ctx.prisma.prayers.create({
      data: { ...input, prayers: { connect: { id: input.prayerId } } },
    });
  }),
  updatePrayerCount: publicProcedure.input(addPrayerCountSchema).mutation(({ ctx, input }) => {
    return ctx.prisma.prayers.update({
      where: { id: input.id },
      data: {
        count: input.count,
        prayers: { connect: { id: input.prayerId } },
      },
    });
  }),
});
