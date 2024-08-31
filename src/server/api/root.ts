import { prayerRouter } from "~/server/api/routers/prayers";
import { createTRPCRouter } from "~/server/api/trpc";
import { scheduleRouter } from "./routers/schedules";
import { takeawayRouter } from "./routers/takeaway";
import { userRouter } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  users: userRouter,
  prayers: prayerRouter,
  schedules: scheduleRouter,
  takeaways: takeawayRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
