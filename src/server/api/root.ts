import { prayerRouter } from "~/server/api/routers/prayers";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { botRouter } from "./routers/bot";
import { groupRouter } from "./routers/groups";
import { peopleRouter } from "./routers/people";
import { profileRouter } from "./routers/profile";
import { rolesRouter } from "./routers/roles";
import { scheduleImportRouter } from "./routers/schedule-import";
import { scheduleRouter } from "./routers/schedules";
import { speakerRouter } from "./routers/speakers";
import { takeawayRouter } from "./routers/takeaway";
import { userRouter } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  bot: botRouter,
  groups: groupRouter,
  people: peopleRouter,
  prayers: prayerRouter,
  profiles: profileRouter,
  roles: rolesRouter,
  scheduleImport: scheduleImportRouter,
  schedules: scheduleRouter,
  speakers: speakerRouter,
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
