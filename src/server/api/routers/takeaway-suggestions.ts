import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import {
  takeawayRevisions,
  takeawaySuggestions,
  takeaways,
  users,
} from "~/lib/db/schema/schema";
import { mayReadComments, QUOTE_MAX_LENGTH } from "~/lib/takeaway-comments";
import type { TakeawayViewer } from "~/lib/takeaway-status";
import {
  applySuggestion,
  mayDecideSuggestions,
  maySuggestOn,
  REPLACEMENT_MAX_LENGTH,
} from "~/lib/takeaway-suggestions";
import { db } from "~/server";
import { getRole } from "~/server/authz";
import { affectedRow } from "../errors";
import { createTRPCRouter, takeawayProcedure } from "../trpc";
import {
  lockWorkingCopy,
  type Transaction,
  workingText,
} from "./takeaway-revisions";

const viewerOf = async (userId: string): Promise<TakeawayViewer> => ({
  id: userId,
  role: await getRole(userId),
});

// Lock the takeaway until the operation finishes: its text, status and
// author cannot change between checking a permission and acting on it.
// While a published takeaway has a correction, suggestions are about the
// correction's text (#74) and accepting one changes it, never the live text.
const lockTakeaway = async (
  tx: Transaction,
  takeawayId: number,
  viewer: TakeawayViewer
) => {
  const copy = await lockWorkingCopy(tx, takeawayId);
  // Suggestions are part of the review thread and share its visibility.
  if (!(copy && mayReadComments(copy.subject, viewer))) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Review thread not found.",
    });
  }
  return {
    ...copy.subject,
    keypoints: workingText(copy).keypoints,
    revisionId: copy.revision?.id ?? null,
  };
};

const forbidden = (message: string) =>
  new TRPCError({ code: "FORBIDDEN", message });

/** Loads an open suggestion and its locked takeaway for a decision. */
const lockSuggestion = async (
  tx: Transaction,
  id: number,
  viewer: TakeawayViewer
) => {
  const [suggestion] = await tx
    .select()
    .from(takeawaySuggestions)
    .where(eq(takeawaySuggestions.id, id));
  if (!suggestion) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Suggestion not found.",
    });
  }
  const takeaway = await lockTakeaway(tx, suggestion.takeawayId, viewer);
  // Re-read under the takeaway's lock: a concurrent decision has finished.
  const [current] = await tx
    .select({ status: takeawaySuggestions.status })
    .from(takeawaySuggestions)
    .where(eq(takeawaySuggestions.id, id));
  return {
    status: current?.status,
    suggestion,
    takeaway,
  };
};

const assertOpen = (status: string | undefined) => {
  if (status !== "open") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This suggestion was already decided.",
    });
  }
};

const assertMayDecide = (
  takeaway: Awaited<ReturnType<typeof lockTakeaway>>,
  viewer: TakeawayViewer
) => {
  if (!mayDecideSuggestions(takeaway, viewer)) {
    throw forbidden(
      takeaway.status === "published"
        ? "Published takeaways can't be changed. Unpublish it first."
        : "Only the takeaway's writer or staff can decide on suggestions."
    );
  }
};

const author = alias(users, "suggestion_author");
const decider = alias(users, "suggestion_decider");
const idInput = z.object({ id: z.number().int().positive() });

export const takeawaySuggestionsRouter = createTRPCRouter({
  /**
   * Accepts a suggestion: the passage is replaced in the notes. A passage
   * that changed since cannot be replaced; the writer applies it by hand and
   * accepts it with `byHand`, which leaves the text as it is.
   */
  accept: takeawayProcedure
    .input(idInput.extend({ byHand: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const viewer = await viewerOf(ctx.session.user.id);
      return await db.transaction(async (tx) => {
        const { status, suggestion, takeaway } = await lockSuggestion(
          tx,
          input.id,
          viewer
        );
        assertMayDecide(takeaway, viewer);
        assertOpen(status);
        let { keypoints } = takeaway;
        if (!input.byHand) {
          const applied = applySuggestion(
            keypoints,
            suggestion.original,
            suggestion.replacement
          );
          if (applied === null) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This passage changed since it was suggested. Apply the suggestion by hand, then mark it as applied.",
            });
          }
          keypoints = applied;
          await (takeaway.revisionId === null
            ? tx
                .update(takeaways)
                .set({ keypoints })
                .where(eq(takeaways.id, suggestion.takeawayId))
            : tx
                .update(takeawayRevisions)
                .set({ keypoints })
                .where(eq(takeawayRevisions.id, takeaway.revisionId)));
        }
        await tx
          .update(takeawaySuggestions)
          .set({
            decidedAt: new Date(),
            decidedById: viewer.id,
            status: "accepted",
          })
          .where(eq(takeawaySuggestions.id, input.id));
        return { keypoints };
      });
    }),
  add: takeawayProcedure
    .input(
      z
        .object({
          original: z.string().trim().min(1).max(QUOTE_MAX_LENGTH),
          replacement: z.string().trim().min(1).max(REPLACEMENT_MAX_LENGTH),
          takeawayId: z.number().int().positive(),
        })
        .refine((value) => value.original !== value.replacement, {
          message: "Change the passage before suggesting it.",
          path: ["replacement"],
        })
    )
    .mutation(async ({ ctx, input }) => {
      const viewer = await viewerOf(ctx.session.user.id);
      return await db.transaction(async (tx) => {
        const takeaway = await lockTakeaway(tx, input.takeawayId, viewer);
        if (!maySuggestOn(takeaway, viewer)) {
          throw forbidden("You can't suggest edits to this takeaway.");
        }
        return affectedRow(
          await tx
            .insert(takeawaySuggestions)
            .values({
              authorId: viewer.id,
              original: input.original,
              replacement: input.replacement,
              revisionId: takeaway.revisionId,
              takeawayId: input.takeawayId,
            })
            .returning({ id: takeawaySuggestions.id }),
          "Suggestion"
        );
      });
    }),
  list: takeawayProcedure
    .input(z.object({ takeawayId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const viewer = await viewerOf(ctx.session.user.id);
      return await db.transaction(async (tx) => {
        const takeaway = await lockTakeaway(tx, input.takeawayId, viewer);
        const rows = await tx
          .select({
            author: { id: author.id, image: author.image, name: author.name },
            authorId: takeawaySuggestions.authorId,
            createdAt: takeawaySuggestions.createdAt,
            decidedAt: takeawaySuggestions.decidedAt,
            decidedBy: { name: decider.name },
            id: takeawaySuggestions.id,
            original: takeawaySuggestions.original,
            replacement: takeawaySuggestions.replacement,
            status: takeawaySuggestions.status,
          })
          .from(takeawaySuggestions)
          .leftJoin(author, eq(author.id, takeawaySuggestions.authorId))
          .leftJoin(decider, eq(decider.id, takeawaySuggestions.decidedById))
          .where(eq(takeawaySuggestions.takeawayId, input.takeawayId))
          .orderBy(
            asc(takeawaySuggestions.createdAt),
            asc(takeawaySuggestions.id)
          );
        return {
          canDecide: mayDecideSuggestions(takeaway, viewer),
          canSuggest: maySuggestOn(takeaway, viewer),
          suggestions: rows.map(({ authorId, ...suggestion }) => ({
            ...suggestion,
            /** Whether accepting can replace the passage in the current text. */
            applies:
              applySuggestion(
                takeaway.keypoints,
                suggestion.original,
                suggestion.replacement
              ) !== null,
            author: suggestion.author
              ? { image: suggestion.author.image, name: suggestion.author.name }
              : null,
            mine: authorId === viewer.id,
          })),
        };
      });
    }),
  reject: takeawayProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const viewer = await viewerOf(ctx.session.user.id);
    return await db.transaction(async (tx) => {
      const { status, takeaway } = await lockSuggestion(tx, input.id, viewer);
      assertMayDecide(takeaway, viewer);
      assertOpen(status);
      return affectedRow(
        await tx
          .update(takeawaySuggestions)
          .set({
            decidedAt: new Date(),
            decidedById: viewer.id,
            status: "rejected",
          })
          .where(eq(takeawaySuggestions.id, input.id))
          .returning({ id: takeawaySuggestions.id }),
        "Suggestion"
      );
    });
  }),
  /** Withdraws the caller's own suggestion while it is still open. */
  remove: takeawayProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const viewer = await viewerOf(ctx.session.user.id);
    return await db.transaction(async (tx) => {
      const { status, suggestion } = await lockSuggestion(tx, input.id, viewer);
      if (suggestion.authorId !== viewer.id) {
        throw forbidden("You can only withdraw your own suggestions.");
      }
      assertOpen(status);
      return affectedRow(
        await tx
          .delete(takeawaySuggestions)
          .where(eq(takeawaySuggestions.id, input.id))
          .returning({ id: takeawaySuggestions.id }),
        "Suggestion"
      );
    });
  }),
});
