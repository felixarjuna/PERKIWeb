import { prayerRouter } from "~/server/api/routers/prayers";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { profileRouter } from "./routers/profile";
import { scheduleRouter } from "./routers/schedules";
import { takeawayRouter } from "./routers/takeaway";
import { userRouter } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  prayers: prayerRouter,
  profiles: profileRouter,
  schedules: scheduleRouter,
  takeaways: takeawayRouter,
  users: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 *
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.schedules.getSchedules();
 */
export const createCaller = createCallerFactory(appRouter);
