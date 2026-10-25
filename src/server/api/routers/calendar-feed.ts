import { feedOf, regenerateFeed } from "~/server/calendar-feed";
import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * The signed-in member's private calendar link. The user id comes from the
 * session only, so nobody sees or replaces another member's link.
 */
export const calendarFeedRouter = createTRPCRouter({
  mine: protectedProcedure.query(({ ctx }) => feedOf(ctx.session.user.id)),
  /** Makes the link, or a new one; the old link stops working at once. */
  regenerate: protectedProcedure.mutation(({ ctx }) =>
    regenerateFeed(ctx.session.user.id)
  ),
});
