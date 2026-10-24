import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { takeawayComments, users } from "~/lib/db/schema/schema";
import {
  COMMENT_MAX_LENGTH,
  mayCommentOn,
  mayReadComments,
  QUOTE_MAX_LENGTH,
} from "~/lib/takeaway-comments";
import {
  actsAsAuthor,
  submitBlockers,
  type TakeawayViewer,
} from "~/lib/takeaway-status";
import { db } from "~/server";
import { getRole } from "~/server/authz";
import { affectedRow } from "../errors";
import { createTRPCRouter, takeawayProcedure } from "../trpc";
import { lockWorkingCopy, type Transaction } from "./takeaway-revisions";

const threadInput = z.object({ takeawayId: z.number().int().positive() });

// Lock the takeaway until the operation finishes: publication or withdrawal
// cannot change the permission between checking it and writing a comment.
// While a published takeaway has a correction, the thread is about the
// correction (#74): its status decides who may comment, and new comments
// are attached to it.
const authorizeThread = async (
  tx: Transaction,
  takeawayId: number,
  viewer: TakeawayViewer
) => {
  const copy = await lockWorkingCopy(tx, takeawayId);
  if (!(copy && mayReadComments(copy.subject, viewer))) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Review thread not found.",
    });
  }
  return {
    canComment: mayCommentOn(copy.subject, viewer),
    revisionId: copy.revision?.id ?? null,
    subject: copy.subject,
  };
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
        const thread = await authorizeThread(tx, input.takeawayId, viewer);
        assertWritable(thread.canComment);
        return affectedRow(
          await tx
            .insert(takeawayComments)
            .values({
              authorId: viewer.id,
              body: input.body,
              quote: input.quote || null,
              revisionId: thread.revisionId,
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
      const { canComment, subject } = await authorizeThread(
        tx,
        input.takeawayId,
        viewer
      );
      const rows = await tx
        .select({
          author: { id: author.id, image: author.image, name: author.name },
          authorId: takeawayComments.authorId,
          body: takeawayComments.body,
          createdAt: takeawayComments.createdAt,
          id: takeawayComments.id,
          quote: takeawayComments.quote,
          requestsChanges: takeawayComments.requestsChanges,
          resolvedAt: takeawayComments.resolvedAt,
          resolvedBy: { name: resolver.name },
        })
        .from(takeawayComments)
        .leftJoin(author, eq(author.id, takeawayComments.authorId))
        .leftJoin(resolver, eq(resolver.id, takeawayComments.resolvedById))
        .where(eq(takeawayComments.takeawayId, input.takeawayId))
        .orderBy(asc(takeawayComments.createdAt), asc(takeawayComments.id));
      // What keeps the viewer from submitting it, if they are its writer.
      const blocking = new Set(
        subject.status === "draft" && actsAsAuthor(subject, viewer)
          ? submitBlockers(rows, subject, viewer)
          : []
      );
      return {
        canComment,
        comments: rows.map((row) => {
          const { authorId, ...comment } = row;
          return {
            ...comment,
            author: comment.author
              ? { image: comment.author.image, name: comment.author.name }
              : null,
            blocksSubmit: blocking.has(row),
            mine: authorId === viewer.id,
          };
        }),
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
        assertWritable(
          (await authorizeThread(tx, comment.takeawayId, viewer)).canComment
        );
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
        assertWritable(
          (await authorizeThread(tx, comment.takeawayId, viewer)).canComment
        );
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
