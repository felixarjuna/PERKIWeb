import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { isAdmin } from "../../authz";
import { affectedRow, isPgError, PG_FOREIGN_KEY_VIOLATION } from "../errors";
import {
  addTakeawaySchema,
  queryByIdSchema,
  updateTakeawaySchema,
} from "../schema/schema";
import { createTRPCRouter, publicProcedure, takeawayProcedure } from "../trpc";

/** Maps a write that references a missing schedule to NOT_FOUND. */
const rethrowMissingSchedule = (error: unknown): never => {
  if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
    throw new TRPCError({
      cause: error,
      code: "NOT_FOUND",
      message: "Schedule not found.",
    });
  }
  throw error;
};

/** Staff manage every takeaway; writers only the ones they wrote. */
export const canManageTakeaway = async (
  takeawayId: number,
  userId: string
): Promise<boolean> => {
  const [takeaway] = await db
    .select({ authorId: takeaways.authorId })
    .from(takeaways)
    .where(eq(takeaways.id, takeawayId))
    .limit(1);
  return takeaway
    ? takeaway.authorId === userId || (await isAdmin(userId))
    : false;
};

/** Throws NOT_FOUND if the takeaway is missing, FORBIDDEN if not manageable. */
const assertCanManage = async (takeawayId: number, userId: string) => {
  const [takeaway] = await db
    .select({ authorId: takeaways.authorId })
    .from(takeaways)
    .where(eq(takeaways.id, takeawayId))
    .limit(1);
  if (!takeaway) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Takeaway not found." });
  }
  if (takeaway.authorId !== userId && !(await isAdmin(userId))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only change your own takeaways.",
    });
  }
};

export const takeawayRouter = createTRPCRouter({
  addTakeaway: takeawayProcedure.input(addTakeawaySchema).mutation(
    async ({ ctx, input }) =>
      await db
        .insert(takeaways)
        .values({
          authorId: ctx.session.user.id,
          contributors: input.contributors,
          keypoints: input.keypoints,
          scheduleId: input.scheduleId,
        })
        .catch(rethrowMissingSchedule)
  ),
  deleteTakeaway: takeawayProcedure
    .input(queryByIdSchema)
    .mutation(async ({ ctx, input }) => {
      await assertCanManage(input.id, ctx.session.user.id);
      return affectedRow(
        await db
          .delete(takeaways)
          .where(eq(takeaways.id, input.id))
          .returning({ id: takeaways.id }),
        "Takeaway"
      );
    }),
  /** Takeaways with whether the viewer may edit each; authors stay private. */
  getManageable: takeawayProcedure.query(async ({ ctx }) => {
    const viewer = ctx.session.user.id;
    const staff = await isAdmin(viewer);
    const rows = await db
      .select()
      .from(takeaways)
      .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
      .orderBy(desc(schedules.date));
    return rows.map(
      ({ takeaways: { authorId, ...note }, schedules: schedule }) => ({
        canManage: staff || authorId === viewer,
        schedules: schedule,
        takeaways: note,
      })
    );
  }),
  getTakeawayById: publicProcedure
    .input(queryByIdSchema)
    .query(async ({ input }) => {
      const takeaway = await db
        .select()
        .from(takeaways)
        .where(eq(takeaways.id, input.id))
        .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
        .then((data) => data.at(0));

      if (takeaway === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Error occurs when loading takeaway from database.",
        });
      }

      return takeaway;
    }),
  getTakeaways: publicProcedure.query(
    async () =>
      await db
        .select()
        .from(takeaways)
        .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
        .orderBy(desc(schedules.date))
  ),
  updateTakeaway: takeawayProcedure
    .input(updateTakeawaySchema)
    .mutation(async ({ ctx, input }) => {
      await assertCanManage(input.id, ctx.session.user.id);
      return affectedRow(
        await db
          .update(takeaways)
          .set({ ...input })
          .where(eq(takeaways.id, input.id))
          .returning({ id: takeaways.id })
          .catch(rethrowMissingSchedule),
        "Takeaway"
      );
    }),
});
