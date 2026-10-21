import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { schedules, takeaways } from "~/lib/db/schema/schema";
import { monthsOf } from "~/lib/months";
import { db } from "~/server";
import { isAdmin } from "~/server/authz";
import { affectedRow, isPgError, PG_FOREIGN_KEY_VIOLATION } from "../errors";
import {
  afterCursor,
  byCursor,
  inWindow,
  matchesWords,
  type Order,
  toPage,
} from "../paging";
import {
  addTakeawaySchema,
  manageableTakeawaySchema,
  queryByIdSchema,
  takeawayListSchema,
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

/**
 * Public takeaway columns: everything except `authorId`, so anonymous
 * visitors never see author ids (and these pages work before migration 0010).
 */
const publicTakeawayColumns = {
  contributors: takeaways.contributors,
  createdAt: takeaways.createdAt,
  id: takeaways.id,
  keypoints: takeaways.keypoints,
  scheduleId: takeaways.scheduleId,
  updatedAt: takeaways.updatedAt,
};

const publicSelection = {
  schedules: getTableColumns(schedules),
  takeaways: publicTakeawayColumns,
};

/**
 * Filters and orders a takeaway list by its schedule's date (then the
 * takeaway's id), so `toPage`'s cursor is `(schedules.date, takeaways.id)`.
 */
const listFilter = (
  input: {
    before?: Date;
    cursor?: { date: Date; id: number } | null;
    from?: Date;
    q: string;
    type: "all" | "church_service" | "bible_study";
  },
  order: Order,
  searched: Parameters<typeof matchesWords>[0]
) => ({
  orderBy: byCursor(schedules.date, takeaways.id, order),
  where: and(
    input.type === "all" ? undefined : eq(schedules.type, input.type),
    inWindow(schedules.date, input),
    matchesWords(searched, input.q),
    afterCursor(schedules.date, takeaways.id, input.cursor, order)
  ),
});

const cursorOf = (row: {
  schedules: { date: Date };
  takeaways: { id: number };
}) => ({
  date: row.schedules.date,
  id: row.takeaways.id,
});

/** The one rule: staff manage every takeaway, writers only their own. */
const mayManage = (authorId: string | null, userId: string, staff: boolean) =>
  staff || authorId === userId;

/** Whether the takeaway is missing, or `userId` may or may not manage it. */
const manageAccess = async (
  takeawayId: number,
  userId: string
): Promise<"allowed" | "forbidden" | "missing"> => {
  const [takeaway] = await db
    .select({ authorId: takeaways.authorId })
    .from(takeaways)
    .where(eq(takeaways.id, takeawayId))
    .limit(1);
  if (!takeaway) {
    return "missing";
  }
  return mayManage(takeaway.authorId, userId, await isAdmin(userId))
    ? "allowed"
    : "forbidden";
};

export const canManageTakeaway = async (
  takeawayId: number,
  userId: string
): Promise<boolean> => (await manageAccess(takeawayId, userId)) === "allowed";

/** Throws NOT_FOUND if the takeaway is missing, FORBIDDEN if not manageable. */
const assertCanManage = async (takeawayId: number, userId: string) => {
  const access = await manageAccess(takeawayId, userId);
  if (access === "missing") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Takeaway not found." });
  }
  if (access === "forbidden") {
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
  /**
   * A page of takeaways with whether the viewer may edit each, searched by
   * title and keypoints; authors stay private.
   */
  getManageable: takeawayProcedure
    .input(manageableTakeawaySchema)
    .query(async ({ ctx, input }) => {
      const viewer = ctx.session.user.id;
      const { orderBy, where } = listFilter(input, input.order, [
        schedules.title,
        takeaways.keypoints,
      ]);
      const [staff, rows] = await Promise.all([
        isAdmin(viewer),
        db
          .select()
          .from(takeaways)
          .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
          .where(where)
          .orderBy(...orderBy)
          .limit(input.limit + 1),
      ]);
      const page = toPage(rows, input.limit, cursorOf);
      return {
        items: page.items.map(
          ({ takeaways: { authorId, ...note }, schedules: schedule }) => ({
            canManage: mayManage(authorId, viewer, staff),
            schedules: schedule,
            takeaways: note,
          })
        ),
        nextCursor: page.nextCursor,
      };
    }),
  getTakeawayById: publicProcedure
    .input(queryByIdSchema)
    .query(async ({ input }) => {
      const takeaway = await db
        .select(publicSelection)
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
  /**
   * A page of takeaways, newest first, searched by title, passage, preacher,
   * keypoints and contributors.
   */
  getTakeaways: publicProcedure
    .input(takeawayListSchema)
    .query(async ({ input }) => {
      const { orderBy, where } = listFilter(input, "desc", [
        schedules.title,
        schedules.bibleVerse,
        schedules.preacher,
        takeaways.keypoints,
        sql`${takeaways.contributors}::text`,
      ]);
      const rows = await db
        .select(publicSelection)
        .from(takeaways)
        .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
        .where(where)
        .orderBy(...orderBy)
        .limit(input.limit + 1);
      return toPage(rows, input.limit, cursorOf);
    }),
  /** The Aachen months (`yyyy-MM`) with takeaways, newest first, for filters. */
  months: publicProcedure.query(async () =>
    monthsOf(
      (
        await db
          .selectDistinct({ date: schedules.date })
          .from(takeaways)
          .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
      ).map((row) => row.date)
    )
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
