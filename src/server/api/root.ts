import { prayerRouter } from "~/server/api/routers/prayers";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { accessRouter } from "./routers/access";
import { botRouter } from "./routers/bot";
import { groupRouter } from "./routers/groups";
import { peopleRouter } from "./routers/people";
import { profileRouter } from "./routers/profile";
import { rolesRouter } from "./routers/roles";
import { scheduleImportRouter } from "./routers/schedule-import";
import { scheduleRouter } from "./routers/schedules";
import { settingsRouter } from "./routers/settings";
import { speakerRouter } from "./routers/speakers";
import { takeawayRouter } from "./routers/takeaway";
import { takeawayCommentsRouter } from "./routers/takeaway-comments";
import { takeawayTldrRouter } from "./routers/takeaway-tldr";
import { userRouter } from "./routers/users";
import { writerAssignmentsRouter } from "./routers/writer-assignments";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  access: accessRouter,
  bot: botRouter,
  groups: groupRouter,
  people: peopleRouter,
  prayers: prayerRouter,
  profiles: profileRouter,
  roles: rolesRouter,
  scheduleImport: scheduleImportRouter,
  schedules: scheduleRouter,
  settings: settingsRouter,
  speakers: speakerRouter,
  takeawayComments: takeawayCommentsRouter,
  takeaways: takeawayRouter,
  takeawayTldr: takeawayTldrRouter,
  users: userRouter,
  writerAssignments: writerAssignmentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 *
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.schedules.list({});
 */
export const createCaller = createCallerFactory(appRouter);
