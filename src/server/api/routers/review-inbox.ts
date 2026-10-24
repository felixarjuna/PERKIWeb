import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import {
  schedules,
  takeawayComments,
  takeawaySuggestions,
  takeaways,
  users,
} from "~/lib/db/schema/schema";
import { reviewInbox } from "~/lib/review-inbox";
import { db } from "~/server";
import { getRole } from "~/server/authz";
import { createTRPCRouter, takeawayProcedure } from "../trpc";

/** Read-only: what waits for the viewer in the review flow (#59). */
export const reviewInboxRouter = createTRPCRouter({
  mine: takeawayProcedure.query(async ({ ctx }) => {
    const viewer = {
      id: ctx.session.user.id,
      role: await getRole(ctx.session.user.id),
    };
    const rows = await db
      .select({
        authorId: takeaways.authorId,
        authorName: users.name,
        date: schedules.date,
        id: takeaways.id,
        status: takeaways.status,
        title: schedules.title,
        type: schedules.type,
      })
      .from(takeaways)
      .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
      .leftJoin(users, eq(users.id, takeaways.authorId))
      .where(ne(takeaways.status, "published"))
      .orderBy(asc(schedules.date), asc(takeaways.id));
    const ids = rows.map((row) => row.id);
    const [comments, suggestions] = ids.length
      ? await Promise.all([
          db
            .select({
              authorId: takeawayComments.authorId,
              takeawayId: takeawayComments.takeawayId,
            })
            .from(takeawayComments)
            .where(
              and(
                inArray(takeawayComments.takeawayId, ids),
                isNull(takeawayComments.resolvedAt)
              )
            ),
          db
            .select({ takeawayId: takeawaySuggestions.takeawayId })
            .from(takeawaySuggestions)
            .where(
              and(
                inArray(takeawaySuggestions.takeawayId, ids),
                eq(takeawaySuggestions.status, "open")
              )
            ),
        ])
      : [[], []];
    const inbox = reviewInbox(
      rows.map((row) => ({
        ...row,
        // A writer's notes to themselves are not feedback waiting for them.
        openComments: comments.filter(
          (item) => item.takeawayId === row.id && item.authorId !== row.authorId
        ).length,
        openSuggestions: suggestions.filter(
          (item) => item.takeawayId === row.id
        ).length,
      })),
      viewer
    );
    const shown = (list: typeof inbox.needsReview) =>
      list.map(({ authorId: _authorId, ...item }) => item);
    return {
      needsReview: shown(inbox.needsReview),
      openFeedback: shown(inbox.openFeedback),
      readyToPublish: shown(inbox.readyToPublish),
    };
  }),
});
