import { and, asc, eq, inArray, isNotNull, isNull, ne, or } from "drizzle-orm";
import {
  schedules,
  takeawayComments,
  takeawayRevisions,
  takeawaySuggestions,
  takeaways,
  users,
} from "~/lib/db/schema/schema";
import { reviewInbox } from "~/lib/review-inbox";
import { db } from "~/server";
import { getRole } from "~/server/authz";
import { createTRPCRouter, takeawayProcedure } from "../trpc";
import { openRevisionOf, openStatus } from "./takeaway-revisions";

/** Read-only: what waits for the viewer in the review flow (#59). */
export const reviewInboxRouter = createTRPCRouter({
  mine: takeawayProcedure.query(async ({ ctx }) => {
    const viewer = {
      id: ctx.session.user.id,
      role: await getRole(ctx.session.user.id),
    };
    // Unpublished takeaways, and published ones with an open correction
    // (#74), which go through review in the correction's status.
    const rows = await db
      .select({
        authorId: takeaways.authorId,
        authorName: users.name,
        date: schedules.date,
        id: takeaways.id,
        revisionId: takeawayRevisions.id,
        revisionStatus: takeawayRevisions.status,
        status: takeaways.status,
        title: schedules.title,
        type: schedules.type,
      })
      .from(takeaways)
      .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
      .leftJoin(users, eq(users.id, takeaways.authorId))
      .leftJoin(takeawayRevisions, openRevisionOf)
      .where(
        or(ne(takeaways.status, "published"), isNotNull(takeawayRevisions.id))
      )
      .orderBy(asc(schedules.date), asc(takeaways.id));
    const ids = rows.map((row) => row.id);
    const [comments, suggestions] = ids.length
      ? await Promise.all([
          db
            .select({
              authorId: takeawayComments.authorId,
              revisionId: takeawayComments.revisionId,
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
            .select({
              revisionId: takeawaySuggestions.revisionId,
              takeawayId: takeawaySuggestions.takeawayId,
            })
            .from(takeawaySuggestions)
            .where(
              and(
                inArray(takeawaySuggestions.takeawayId, ids),
                eq(takeawaySuggestions.status, "open")
              )
            ),
        ])
      : [[], []];
    // A correction's feedback is what was said on that correction; feedback
    // left from the takeaway's own review is not waiting on it.
    const inbox = reviewInbox(
      rows.map(({ revisionId, revisionStatus, ...row }) => {
        const belongs = (item: {
          revisionId: number | null;
          takeawayId: number;
        }) =>
          item.takeawayId === row.id &&
          (revisionId === null || item.revisionId === revisionId);
        return {
          ...row,
          // A writer's notes to themselves are not feedback waiting for them.
          openComments: comments.filter(
            (item) => belongs(item) && item.authorId !== row.authorId
          ).length,
          openSuggestions: suggestions.filter(belongs).length,
          revision: openStatus(revisionStatus),
        };
      }),
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
