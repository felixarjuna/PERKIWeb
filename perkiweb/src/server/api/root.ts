import { prayerRouter } from "~/server/api/routers/prayers";
import { createTRPCRouter } from "~/server/api/trpc";
import { scheduleRouter } from "./routers/schedules";
import { takeawayRouter } from "./routers/takeaway";
import { todoRouter } from "./routers/todo";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  prayers: prayerRouter,
  schedules: scheduleRouter,
  takeaways: takeawayRouter,
  todos: todoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
