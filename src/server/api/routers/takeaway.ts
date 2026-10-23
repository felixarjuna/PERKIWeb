import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns, inArray, or, sql } from "drizzle-orm";
import {
  schedules,
  type TakeawayStatus,
  takeaways,
} from "~/lib/db/schema/schema";
import { markdownToPlainText } from "~/lib/markdown";
import { monthsOf } from "~/lib/months";
import { canWriteTakeaways, isStaffRole, type Role } from "~/lib/roles";
import { takeawayKeypointsSchema } from "~/lib/takeaway-content";
import { mayEditTakeaway, statusActions } from "~/lib/takeaway-status";
import { db } from "~/server";
import { getRole } from "~/server/authz";
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
  tldr: takeaways.tldr,
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
  role: Role;
  staff: boolean;
  writer: boolean;
}

const viewerFor = async (userId: string | undefined): Promise<Viewer> => {
  const role = userId ? await getRole(userId) : "member";
  return {
    id: userId ?? "",
    role,
    staff: isStaffRole(role),
    writer: canWriteTakeaways(role),
  };
};

interface Ownership {
  authorId: string | null;
  status: TakeawayStatus;
}

/** The edit rule (`mayEditTakeaway`): author and staff, until published. */
const mayManage = (takeaway: Ownership, viewer: Viewer) =>
  mayEditTakeaway(takeaway, viewer);

/**
 * The read rule from #36: published is public, staff and the author read
 * every status, other writers read takeaways that are in review.
 */
const mayRead = (takeaway: Ownership, viewer: Viewer) =>
  takeaway.status === "published" ||
  viewer.staff ||
  (viewer.writer &&
    (takeaway.authorId === viewer.id || takeaway.status === "in_review"));

/** The status rule (`statusActions`): exactly the moves the list offers. */
const maySetStatus = (
  takeaway: Ownership,
  viewer: Viewer,
  next: TakeawayStatus
) => statusActions(takeaway, viewer).some((action) => action.to === next);

/** Why `viewer` may not make this move, for the FORBIDDEN message. */
const statusRefusal = (current: TakeawayStatus, next: TakeawayStatus) => {
  if (next === "published") {
    return "Only mita or the dev can publish a takeaway.";
  }
  if (current === "published") {
    return "Only mita or the dev can unpublish a takeaway.";
  }
  if (next === "in_review") {
    return "Only the writer of this takeaway can send it to review.";
  }
  return "Only its writer, mita or the dev can take this takeaway out of review.";
};

const loadOwnership = async (
  takeawayId: number
): Promise<(Ownership & { keypoints: string }) | undefined> => {
  const [takeaway] = await db
    .select({
      authorId: takeaways.authorId,
      keypoints: takeaways.keypoints,
      status: takeaways.status,
    })
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
export const assertCanManage = async (takeawayId: number, userId: string) => {
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
          ? "Published takeaways can't be changed. Unpublish it first."
          : "You can only change your own takeaways.",
    });
  }
  // Recheck ownership and status in the write itself, so a takeaway
  // published meanwhile is never changed.
  return and(
    eq(takeaways.id, takeawayId),
    inArray(takeaways.status, ["draft", "in_review"]),
    viewer.staff ? undefined : eq(takeaways.authorId, userId)
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
            actions: statusActions({ authorId, status: note.status }, viewer),
            canManage: mayManage({ authorId, status: note.status }, viewer),
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
      if (input.status === "published" && takeaway.status === "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Send this draft to review before publishing it.",
        });
      }
      if (!maySetStatus(takeaway, viewer, input.status)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: statusRefusal(takeaway.status, input.status),
        });
      }
      if (input.status !== "draft") {
        const content = takeawayKeypointsSchema.safeParse(takeaway.keypoints);
        if (!content.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: content.error.issues[0]?.message,
          });
        }
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
