import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns, inArray, or, sql } from "drizzle-orm";
import {
  schedules,
  type TakeawayStatus,
  takeaways,
} from "~/lib/db/schema/schema";
import { markdownToPlainText } from "~/lib/markdown";
import { monthsOf } from "~/lib/months";
import { db } from "~/server";
import { canManageTakeaways, isAdmin } from "~/server/authz";
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
  takeawayStatusSchema,
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
 * Public takeaway columns: everything except `authorId` and `publishedById`,
 * so visitors never see account ids.
 */
const publicTakeawayColumns = {
  contributors: takeaways.contributors,
  createdAt: takeaways.createdAt,
  id: takeaways.id,
  keypoints: takeaways.keypoints,
  publishedAt: takeaways.publishedAt,
  scheduleId: takeaways.scheduleId,
  status: takeaways.status,
  updatedAt: takeaways.updatedAt,
};

/**
 * A list row's notes as their plain-text preview: lists show three lines, so
 * they get the text without Markdown instead of the whole note to parse.
 */
const withPreview = <T extends { keypoints: string }>({
  keypoints,
  ...note
}: T) => ({ ...note, preview: markdownToPlainText(keypoints) });

const publicSelection = {
  schedules: getTableColumns(schedules),
  takeaways: publicTakeawayColumns,
};

const isPublished = eq(takeaways.status, "published");

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

/** What a viewer is to a takeaway, read from the database on every call. */
interface Viewer {
  id: string;
  staff: boolean;
  writer: boolean;
}

const viewerFor = async (userId: string | undefined): Promise<Viewer> => {
  if (!userId) {
    return { id: "", staff: false, writer: false };
  }
  const [staff, writer] = await Promise.all([
    isAdmin(userId),
    canManageTakeaways(userId),
  ]);
  return { id: userId, staff, writer };
};

interface Ownership {
  authorId: string | null;
  status: TakeawayStatus;
}

/**
 * The edit rule from #36: staff edit every takeaway, a writer only their own
 * while it is a draft or in review. Once published, only staff change it.
 */
const mayManage = (takeaway: Ownership, viewer: Viewer) =>
  viewer.staff ||
  (takeaway.authorId === viewer.id && takeaway.status !== "published");

/**
 * The read rule from #36: published is public, staff and the author read
 * every status, other writers read takeaways that are in review.
 */
const mayRead = (takeaway: Ownership, viewer: Viewer) =>
  takeaway.status === "published" ||
  viewer.staff ||
  (viewer.writer &&
    (takeaway.authorId === viewer.id || takeaway.status === "in_review"));

/**
 * The status rule from #36: staff set any status; a writer moves their own
 * unpublished takeaway between draft and review. Only staff publish.
 */
const maySetStatus = (
  takeaway: Ownership,
  viewer: Viewer,
  next: TakeawayStatus
) => viewer.staff || (mayManage(takeaway, viewer) && next !== "published");

const loadOwnership = async (
  takeawayId: number
): Promise<Ownership | undefined> => {
  const [takeaway] = await db
    .select({ authorId: takeaways.authorId, status: takeaways.status })
    .from(takeaways)
    .where(eq(takeaways.id, takeawayId))
    .limit(1);
  return takeaway;
};

export const canManageTakeaway = async (
  takeawayId: number,
  userId: string
): Promise<boolean> => {
  const takeaway = await loadOwnership(takeawayId);
  return takeaway !== undefined && mayManage(takeaway, await viewerFor(userId));
};

const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Takeaway not found." });

/** Throws NOT_FOUND if the takeaway is missing, FORBIDDEN if not manageable. */
const assertCanManage = async (takeawayId: number, userId: string) => {
  const takeaway = await loadOwnership(takeawayId);
  if (!takeaway) {
    throw notFound();
  }
  const viewer = await viewerFor(userId);
  if (!mayManage(takeaway, viewer)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        takeaway.status === "published"
          ? "Published takeaways can only be changed by mita or the owner."
          : "You can only change your own takeaways.",
    });
  }
  // Recheck writer ownership and status in the write itself.
  return and(
    eq(takeaways.id, takeawayId),
    viewer.staff
      ? undefined
      : and(
          eq(takeaways.authorId, userId),
          inArray(takeaways.status, ["draft", "in_review"])
        )
  );
};

/**
 * The publication columns for a status change: set when a takeaway becomes
 * published, kept while it stays published, cleared when it leaves.
 */
const publicationFor = (
  current: TakeawayStatus,
  next: TakeawayStatus,
  viewerId: string
) => {
  if (next !== "published") {
    return { publishedAt: null, publishedById: null };
  }
  if (current === "published") {
    return {};
  }
  return { publishedAt: new Date(), publishedById: viewerId };
};

/** The rows `viewer` may see in the admin list (see `mayRead`). */
const readableBy = (viewer: Viewer) =>
  viewer.staff
    ? undefined
    : or(
        eq(takeaways.authorId, viewer.id),
        inArray(takeaways.status, ["in_review", "published"])
      );

export const takeawayRouter = createTRPCRouter({
  addTakeaway: takeawayProcedure
    .input(addTakeawaySchema)
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(takeaways)
        .values({
          authorId: ctx.session.user.id,
          contributors: input.contributors,
          keypoints: input.keypoints,
          scheduleId: input.scheduleId,
          status: input.status,
        })
        .returning({ id: takeaways.id, status: takeaways.status })
        .catch(rethrowMissingSchedule);
      if (!row) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      return row;
    }),
  deleteTakeaway: takeawayProcedure
    .input(queryByIdSchema)
    .mutation(async ({ ctx, input }) => {
      const where = await assertCanManage(input.id, ctx.session.user.id);
      return affectedRow(
        await db.delete(takeaways).where(where).returning({ id: takeaways.id }),
        "Takeaway"
      );
    }),
  /**
   * A page of the takeaways the viewer may read, with whether they may edit
   * or publish each, searched by title and keypoints; authors stay private.
   */
  getManageable: takeawayProcedure
    .input(manageableTakeawaySchema)
    .query(async ({ ctx, input }) => {
      const viewer = await viewerFor(ctx.session.user.id);
      const { orderBy, where } = listFilter(input, input.order, [
        schedules.title,
        takeaways.keypoints,
      ]);
      const rows = await db
        .select()
        .from(takeaways)
        .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
        .where(
          and(
            where,
            readableBy(viewer),
            input.status === "all"
              ? undefined
              : eq(takeaways.status, input.status)
          )
        )
        .orderBy(...orderBy)
        .limit(input.limit + 1);
      const page = toPage(rows, input.limit, cursorOf);
      return {
        items: page.items.map(
          ({
            takeaways: { authorId, publishedById: _publisher, ...note },
            schedules: schedule,
          }) => ({
            canManage: mayManage({ authorId, status: note.status }, viewer),
            canPublish: viewer.staff,
            schedules: schedule,
            takeaways: withPreview(note),
          })
        ),
        nextCursor: page.nextCursor,
      };
    }),
  /**
   * One takeaway with its schedule. Unpublished ones are only found by those
   * who may read them (`mayRead`); everyone else gets NOT_FOUND.
   */
  getTakeawayById: publicProcedure
    .input(queryByIdSchema)
    .query(async ({ ctx, input }) => {
      const [takeaway] = await db
        .select({ ...publicSelection, authorId: takeaways.authorId })
        .from(takeaways)
        .where(eq(takeaways.id, input.id))
        .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
        .limit(1);
      if (!takeaway) {
        throw notFound();
      }
      const readable = mayRead(
        { authorId: takeaway.authorId, status: takeaway.takeaways.status },
        await viewerFor(ctx.session?.user.id)
      );
      if (!readable) {
        throw notFound();
      }
      const { authorId: _author, ...visible } = takeaway;
      return visible;
    }),
  /**
   * A page of published takeaways, newest first, searched by title, passage,
   * preacher, keypoints and contributors.
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
        .where(and(where, isPublished))
        .orderBy(...orderBy)
        .limit(input.limit + 1);
      const page = toPage(rows, input.limit, cursorOf);
      return {
        items: page.items.map((row) => ({
          schedules: row.schedules,
          takeaways: withPreview(row.takeaways),
        })),
        nextCursor: page.nextCursor,
      };
    }),
  /** The Aachen months (`yyyy-MM`) with published takeaways, for filters. */
  months: publicProcedure.query(async () =>
    monthsOf(
      (
        await db
          .selectDistinct({ date: schedules.date })
          .from(takeaways)
          .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
          .where(isPublished)
      ).map((row) => row.date)
    )
  ),
  /**
   * Moves a takeaway between draft, in review and published. Publishing
   * records who did it and when; leaving published clears that again.
   */
  setStatus: takeawayProcedure
    .input(takeawayStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const [takeaway, viewer] = await Promise.all([
        loadOwnership(input.id),
        viewerFor(ctx.session.user.id),
      ]);
      if (!takeaway) {
        throw notFound();
      }
      if (!maySetStatus(takeaway, viewer, input.status)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            input.status === "published"
              ? "Only mita or the owner can publish a takeaway."
              : "You can only change your own unpublished takeaways.",
        });
      }
      return affectedRow(
        await db
          .update(takeaways)
          .set({
            status: input.status,
            ...publicationFor(takeaway.status, input.status, viewer.id),
          })
          .where(
            and(
              eq(takeaways.id, input.id),
              eq(takeaways.status, takeaway.status)
            )
          )
          .returning({ id: takeaways.id, status: takeaways.status }),
        "Takeaway"
      );
    }),
  updateTakeaway: takeawayProcedure
    .input(updateTakeawaySchema)
    .mutation(async ({ ctx, input }) => {
      const where = await assertCanManage(input.id, ctx.session.user.id);
      return affectedRow(
        await db
          .update(takeaways)
          .set({ ...input })
          .where(where)
          .returning({ id: takeaways.id })
          .catch(rethrowMissingSchedule),
        "Takeaway"
      );
    }),
});
