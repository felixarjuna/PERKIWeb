import { prayerRouter } from "~/server/api/routers/prayers";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { accessRouter } from "./routers/access";
import { botRouter } from "./routers/bot";
import { groupRouter } from "./routers/groups";
import { peopleRouter } from "./routers/people";
import { profileRouter } from "./routers/profile";
import { reviewInboxRouter } from "./routers/review-inbox";
import { rolesRouter } from "./routers/roles";
import { scheduleImportRouter } from "./routers/schedule-import";
import { scheduleRouter } from "./routers/schedules";
import { servingPoolRouter } from "./routers/serving-pool";
import { servingPoolImportRouter } from "./routers/serving-pool-import";
import { settingsRouter } from "./routers/settings";
import { speakerRouter } from "./routers/speakers";
import { takeawayRouter } from "./routers/takeaway";
import { takeawayCommentsRouter } from "./routers/takeaway-comments";
import { takeawayImportRouter } from "./routers/takeaway-import";
import { takeawayRevisionsRouter } from "./routers/takeaway-revisions";
import { takeawaySuggestionsRouter } from "./routers/takeaway-suggestions";
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
  reviewInbox: reviewInboxRouter,
  roles: rolesRouter,
  scheduleImport: scheduleImportRouter,
  schedules: scheduleRouter,
  servingPool: servingPoolRouter,
  servingPoolImport: servingPoolImportRouter,
  settings: settingsRouter,
  speakers: speakerRouter,
  takeawayComments: takeawayCommentsRouter,
  takeawayImport: takeawayImportRouter,
  takeawayRevisions: takeawayRevisionsRouter,
  takeawaySuggestions: takeawaySuggestionsRouter,
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
