import { and, asc, eq, inArray, or } from "drizzle-orm";
import {
  scheduleAssignments,
  schedules,
  type TakeawayStatus,
  takeaways,
} from "~/lib/db/schema/schema";
import { takeawayDueAt } from "~/lib/takeaway-deadline";
import { db } from "~/server";
import { takeawayDeadlineWeekday } from "~/server/settings";
import { adminProcedure, createTRPCRouter, takeawayProcedure } from "../trpc";

interface AssignmentItem {
  date: Date;
  dueAt: Date;
  key: string;
  linked: boolean;
  overdue: boolean;
  scheduleId: number;
  status: TakeawayStatus | "not_started";
  takeawayId: number | null;
  title: string;
  writerName: string | null;
}

async function assignmentsFor(userId?: string) {
  const weekday = await takeawayDeadlineWeekday();
  const slots = await db
    .select({
      date: schedules.date,
      id: scheduleAssignments.id,
      name: scheduleAssignments.name,
      scheduleId: schedules.id,
      title: schedules.title,
      userId: scheduleAssignments.userId,
    })
    .from(scheduleAssignments)
    .innerJoin(schedules, eq(schedules.id, scheduleAssignments.scheduleId))
    .where(
      and(
        eq(scheduleAssignments.role, "note_writer"),
        userId ? eq(scheduleAssignments.userId, userId) : undefined
      )
    )
    .orderBy(asc(schedules.date), asc(scheduleAssignments.id));
  const scheduleIds = slots.map((slot) => slot.scheduleId);
  const notes = await db
    .select({
      authorId: takeaways.authorId,
      date: schedules.date,
      id: takeaways.id,
      scheduleId: schedules.id,
      status: takeaways.status,
      title: schedules.title,
    })
    .from(takeaways)
    .innerJoin(schedules, eq(schedules.id, takeaways.scheduleId))
    .where(
      userId
        ? or(
            eq(takeaways.authorId, userId),
            and(
              inArray(takeaways.scheduleId, scheduleIds),
              eq(takeaways.status, "published")
            )
          )
        : inArray(takeaways.scheduleId, scheduleIds)
    )
    .orderBy(asc(takeaways.id));
  const used = new Set<number>();
  const now = Date.now();
  const items: AssignmentItem[] = slots.flatMap((slot) => {
    const own = notes.filter(
      (note) =>
        note.scheduleId === slot.scheduleId &&
        slot.userId !== null &&
        note.authorId === slot.userId
    );
    const matching = own.length
      ? own
      : notes
          .filter(
            (note) =>
              note.scheduleId === slot.scheduleId && note.status === "published"
          )
          .slice(0, 1);
    const dueAt = takeawayDueAt(slot.date, weekday);
    return (matching.length ? matching : [null]).map((note) => {
      if (note) {
        used.add(note.id);
      }
      const status = note?.status ?? "not_started";
      return {
        date: slot.date,
        dueAt,
        key: `assignment-${slot.id}-${note?.id ?? "new"}`,
        linked: slot.userId !== null,
        overdue:
          (status === "not_started" || status === "draft") &&
          now > dueAt.getTime(),
        scheduleId: slot.scheduleId,
        status,
        takeawayId: note?.id ?? null,
        title: slot.title,
        writerName: slot.name,
      };
    });
  });
  if (userId) {
    for (const note of notes) {
      if (note.authorId === userId && !used.has(note.id)) {
        const dueAt = takeawayDueAt(note.date, weekday);
        items.push({
          date: note.date,
          dueAt,
          key: `takeaway-${note.id}`,
          linked: true,
          overdue: note.status === "draft" && now > dueAt.getTime(),
          scheduleId: note.scheduleId,
          status: note.status,
          takeawayId: note.id,
          title: note.title,
          writerName: null,
        });
      }
    }
  }
  items.sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime());
  return {
    items,
    reminderCount: items.filter(
      (item) =>
        item.date.getTime() <= now &&
        (item.status === "not_started" || item.status === "draft")
    ).length,
  };
}

export const writerAssignmentsRouter = createTRPCRouter({
  all: adminProcedure.query(() => assignmentsFor()),
  mine: takeawayProcedure.query(({ ctx }) =>
    assignmentsFor(ctx.session.user.id)
  ),
});
