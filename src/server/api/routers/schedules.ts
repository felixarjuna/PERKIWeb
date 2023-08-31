import { publicProcedure, router } from "@/server/trpc";
import { addScheduleSchema } from "../schema/schema";

export const scheduleRouter = router({
  getSchedules: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.schedules.findMany({ orderBy: { date: "desc" } });
  }),
  addSchedule: publicProcedure.input(addScheduleSchema).mutation(({ ctx, input }) => {
    return ctx.prisma.schedules.create({ data: { ...input } });
  }),
});
