import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  REVISION_STATUSES,
  type RevisionStatus,
  takeawayRevisions,
  takeaways,
  users,
} from "~/lib/db/schema/schema";
import { takeawayKeypointsSchema } from "~/lib/takeaway-content";
import {
  mayChangeText,
  type OpenRevisionStatus,
  revisionActions,
  workingSubject,
} from "~/lib/takeaway-revisions";
import { mayReadTakeaway, type TakeawayViewer } from "~/lib/takeaway-status";
import { normalizeTldr } from "~/lib/takeaway-tldr";
import { db } from "~/server";
import { getRole } from "~/server/authz";
import { createTRPCRouter, takeawayProcedure } from "../trpc";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const OPEN_STATUSES = ["draft", "in_review"] as const;

/** Joins a takeaway to its open correction, if it has one. */
export const openRevisionOf = and(
  eq(takeawayRevisions.takeawayId, takeaways.id),
  inArray(takeawayRevisions.status, OPEN_STATUSES)
);

export const openStatus = (
  status: RevisionStatus | null | undefined
): OpenRevisionStatus | null =>
  status === "draft" || status === "in_review" ? status : null;

export const viewerOf = async (userId: string): Promise<TakeawayViewer> => ({
  id: userId,
  role: await getRole(userId),
});

const notFound = (message = "Takeaway not found.") =>
  new TRPCError({ code: "NOT_FOUND", message });

/**
 * Locks a takeaway until the transaction ends and loads it with its open
 * correction: what reviewers read, comment on and suggest edits to is the
 * correction's text while there is one (`workingSubject`). Every write that
 * depends on the text, status or author goes through this lock.
 */
export const lockWorkingCopy = async (tx: Transaction, takeawayId: number) => {
  const [takeaway] = await tx
    .select({
      authorId: takeaways.authorId,
      contributors: takeaways.contributors,
      id: takeaways.id,
      keypoints: takeaways.keypoints,
      scheduleId: takeaways.scheduleId,
      status: takeaways.status,
      tldr: takeaways.tldr,
    })
    .from(takeaways)
    .where(eq(takeaways.id, takeawayId))
    .for("update");
  if (!takeaway) {
    return;
  }
  const [revision] = await tx
    .select()
    .from(takeawayRevisions)
    .where(
      and(
        eq(takeawayRevisions.takeawayId, takeawayId),
        inArray(takeawayRevisions.status, OPEN_STATUSES)
      )
    );
  const status = openStatus(revision?.status);
  return {
    revision: revision && status ? { ...revision, status } : null,
    /** The rules' subject: the open correction, or the takeaway itself. */
    subject: workingSubject(takeaway, status),
    takeaway,
  };
};

export type WorkingCopy = NonNullable<
  Awaited<ReturnType<typeof lockWorkingCopy>>
>;

/** The text being worked on: the correction's, or the takeaway's own. */
export const workingText = ({ revision, takeaway }: WorkingCopy) =>
  revision ?? takeaway;

interface TextChanges {
  contributors?: unknown;
  keypoints?: string;
  scheduleId?: number;
  tldr?: string;
}

/**
 * Saves the notes, TL;DR or credits. Until a takeaway is published they
 * change on the takeaway; afterwards on its open correction, which the first
 * save starts from the published text, so the website keeps that text until
 * staff publish the correction (#74).
 */
export const saveText = async (
  userId: string,
  takeawayId: number,
  { tldr, ...changes }: TextChanges
) => {
  const viewer = await viewerOf(userId);
  const text = {
    ...changes,
    ...(tldr === undefined ? {} : { tldr: normalizeTldr(tldr) }),
  };
  return await db.transaction(async (tx) => {
    const copy = await lockWorkingCopy(tx, takeawayId);
    if (!copy) {
      throw notFound();
    }
    const { revision, takeaway } = copy;
    if (!mayChangeText(takeaway, revision?.status ?? null, viewer)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only change your own takeaways.",
      });
    }
    if (takeaway.status !== "published") {
      await tx.update(takeaways).set(text).where(eq(takeaways.id, takeawayId));
      return { id: takeawayId };
    }
    const { scheduleId, ...correction } = text;
    if (scheduleId !== undefined && scheduleId !== takeaway.scheduleId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "A published takeaway stays with its gathering. Unpublish it to move it.",
      });
    }
    if (revision) {
      await tx
        .update(takeawayRevisions)
        .set(correction)
        .where(eq(takeawayRevisions.id, revision.id));
    } else {
      await tx.insert(takeawayRevisions).values({
        authorId: viewer.id,
        contributors: takeaway.contributors,
        keypoints: takeaway.keypoints,
        takeawayId,
        tldr: takeaway.tldr,
        ...correction,
      });
    }
    return { id: takeawayId };
  });
};

/**
 * Folds an open correction into a takeaway that is being unpublished: the
 * draft continues from the corrected text and goes through review again.
 */
export const foldOpenRevision = async (tx: Transaction, copy: WorkingCopy) => {
  const { revision, takeaway } = copy;
  if (!revision) {
    return {};
  }
  await tx
    .delete(takeawayRevisions)
    .where(eq(takeawayRevisions.id, revision.id));
  return {
    contributors: revision.contributors,
    keypoints: revision.keypoints,
    tldr: revision.tldr,
  };
};

const refusal = (next: RevisionStatus) => {
  if (next === "published") {
    return "Only mita or the dev can publish changes, once they are in review.";
  }
  if (next === "in_review") {
    return "Only the writer of this takeaway can send its changes to review.";
  }
  return "Only its writer, mita or the dev can change these changes' status.";
};

const takeawayInput = z.object({ takeawayId: z.number().int().positive() });

export const takeawayRevisionsRouter = createTRPCRouter({
  /**
   * The open correction of a published takeaway, for those who may read it
   * (the read rule applied to the correction); null when there is none.
   */
  current: takeawayProcedure
    .input(takeawayInput)
    .query(async ({ ctx, input }) => {
      const viewer = await viewerOf(ctx.session.user.id);
      return await db.transaction(async (tx) => {
        const copy = await lockWorkingCopy(tx, input.takeawayId);
        if (!(copy && mayReadTakeaway(copy.takeaway, viewer))) {
          throw notFound();
        }
        const { revision, subject, takeaway } = copy;
        if (!(revision && mayReadTakeaway(subject, viewer))) {
          return null;
        }
        const [author] = revision.authorId
          ? await tx
              .select({ name: users.name })
              .from(users)
              .where(eq(users.id, revision.authorId))
          : [];
        return {
          actions: revisionActions(takeaway, revision.status, viewer),
          author: author ?? null,
          contributors: revision.contributors,
          createdAt: revision.createdAt,
          id: revision.id,
          keypoints: revision.keypoints,
          status: revision.status,
          tldr: revision.tldr,
          updatedAt: revision.updatedAt,
        };
      });
    }),
  /**
   * Moves a takeaway's open correction. Publishing copies its text onto the
   * takeaway (the website shows it from then on) and records what it
   * replaced and who approved it; the takeaway's own publication date stays.
   */
  setStatus: takeawayProcedure
    .input(takeawayInput.extend({ status: z.enum(REVISION_STATUSES) }))
    .mutation(async ({ ctx, input }) => {
      const viewer = await viewerOf(ctx.session.user.id);
      return await db.transaction(async (tx) => {
        const copy = await lockWorkingCopy(tx, input.takeawayId);
        if (!copy) {
          throw notFound();
        }
        const { revision, subject, takeaway } = copy;
        if (!(revision && mayReadTakeaway(subject, viewer))) {
          throw notFound("This takeaway has no changes waiting.");
        }
        const allowed = revisionActions(takeaway, revision.status, viewer).some(
          (action) => action.to === input.status
        );
        if (!allowed) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: refusal(input.status),
          });
        }
        if (input.status === "in_review" || input.status === "published") {
          const content = takeawayKeypointsSchema.safeParse(revision.keypoints);
          if (!content.success) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: content.error.issues[0]?.message,
            });
          }
        }
        const decided =
          input.status === "published" || input.status === "discarded"
            ? { decidedAt: new Date(), decidedById: viewer.id }
            : {};
        if (input.status === "published") {
          await tx
            .update(takeaways)
            .set({
              contributors: revision.contributors,
              keypoints: revision.keypoints,
              tldr: revision.tldr,
            })
            .where(eq(takeaways.id, takeaway.id));
        }
        await tx
          .update(takeawayRevisions)
          .set({
            status: input.status,
            ...decided,
            ...(input.status === "published"
              ? {
                  previousKeypoints: takeaway.keypoints,
                  previousTldr: takeaway.tldr,
                }
              : {}),
          })
          .where(eq(takeawayRevisions.id, revision.id));
        return { status: input.status };
      });
    }),
});
