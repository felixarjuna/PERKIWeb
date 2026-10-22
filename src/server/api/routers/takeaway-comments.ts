import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { takeawayComments, takeaways, users } from "~/lib/db/schema/schema";
import {
  COMMENT_MAX_LENGTH,
  mayCommentOn,
  mayReadComments,
  QUOTE_MAX_LENGTH,
} from "~/lib/takeaway-comments";
import type { TakeawayViewer } from "~/lib/takeaway-status";
import { db } from "~/server";
import { getRole } from "~/server/authz";
import { affectedRow } from "../errors";
import { createTRPCRouter, takeawayProcedure } from "../trpc";

const threadInput = z.object({ takeawayId: z.number().int().positive() });
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Lock the takeaway until the operation finishes: publication or withdrawal
// cannot change the permission between checking it and writing a comment.
const authorizeThread = async (
  tx: Transaction,
  takeawayId: number,
  viewer: TakeawayViewer
) => {
  const [takeaway] = await tx
    .select({ authorId: takeaways.authorId, status: takeaways.status })
    .from(takeaways)
    .where(eq(takeaways.id, takeawayId))
    .for("update");
  if (!(takeaway && mayReadComments(takeaway, viewer))) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Review thread not found.",
    });
  }
  return mayCommentOn(takeaway, viewer);
};

const assertWritable = (canComment: boolean) => {
  if (!canComment) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This review thread is read-only.",
    });
  }
};

const author = alias(users, "comment_author");
const resolver = alias(users, "comment_resolver");

export const takeawayCommentsRouter = createTRPCRouter({
  add: takeawayProcedure
    .input(
      threadInput.extend({
        body: z.string().trim().min(1).max(COMMENT_MAX_LENGTH),
        quote: z.string().trim().max(QUOTE_MAX_LENGTH).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const viewer = {
        id: ctx.session.user.id,
        role: await getRole(ctx.session.user.id),
      };
      return await db.transaction(async (tx) => {
        assertWritable(await authorizeThread(tx, input.takeawayId, viewer));
        return affectedRow(
          await tx
            .insert(takeawayComments)
            .values({
              authorId: viewer.id,
              body: input.body,
              quote: input.quote || null,
              takeawayId: input.takeawayId,
            })
            .returning({ id: takeawayComments.id }),
          "Comment"
        );
      });
    }),
  list: takeawayProcedure.input(threadInput).query(async ({ ctx, input }) => {
    const viewer = {
      id: ctx.session.user.id,
      role: await getRole(ctx.session.user.id),
    };
    return await db.transaction(async (tx) => {
      const canComment = await authorizeThread(tx, input.takeawayId, viewer);
      const rows = await tx
        .select({
          author: { id: author.id, image: author.image, name: author.name },
          authorId: takeawayComments.authorId,
          body: takeawayComments.body,
          createdAt: takeawayComments.createdAt,
          id: takeawayComments.id,
          quote: takeawayComments.quote,
          resolvedAt: takeawayComments.resolvedAt,
          resolvedBy: { name: resolver.name },
        })
        .from(takeawayComments)
        .leftJoin(author, eq(author.id, takeawayComments.authorId))
        .leftJoin(resolver, eq(resolver.id, takeawayComments.resolvedById))
        .where(eq(takeawayComments.takeawayId, input.takeawayId))
        .orderBy(asc(takeawayComments.createdAt), asc(takeawayComments.id));
      return {
        canComment,
        comments: rows.map(({ authorId, ...comment }) => ({
          ...comment,
          author: comment.author
            ? { image: comment.author.image, name: comment.author.name }
            : null,
          mine: authorId === viewer.id,
        })),
      };
    });
  }),
  remove: takeawayProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const viewer = {
        id: ctx.session.user.id,
        role: await getRole(ctx.session.user.id),
      };
      return await db.transaction(async (tx) => {
        const [comment] = await tx
          .select({
            authorId: takeawayComments.authorId,
            takeawayId: takeawayComments.takeawayId,
          })
          .from(takeawayComments)
          .where(eq(takeawayComments.id, input.id));
        if (!comment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Comment not found.",
          });
        }
        assertWritable(await authorizeThread(tx, comment.takeawayId, viewer));
        if (comment.authorId !== viewer.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own comments.",
          });
        }
        return affectedRow(
          await tx
            .delete(takeawayComments)
            .where(eq(takeawayComments.id, input.id))
            .returning({ id: takeawayComments.id }),
          "Comment"
        );
      });
    }),
  setResolved: takeawayProcedure
    .input(z.object({ id: z.number().int().positive(), resolved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const viewer = {
        id: ctx.session.user.id,
        role: await getRole(ctx.session.user.id),
      };
      return await db.transaction(async (tx) => {
        const [comment] = await tx
          .select({ takeawayId: takeawayComments.takeawayId })
          .from(takeawayComments)
          .where(eq(takeawayComments.id, input.id));
        if (!comment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Comment not found.",
          });
        }
        assertWritable(await authorizeThread(tx, comment.takeawayId, viewer));
        return affectedRow(
          await tx
            .update(takeawayComments)
            .set({
              resolvedAt: input.resolved ? new Date() : null,
              resolvedById: input.resolved ? viewer.id : null,
            })
            .where(eq(takeawayComments.id, input.id))
            .returning({ id: takeawayComments.id }),
          "Comment"
        );
      });
    }),
});
