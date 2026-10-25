import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { calendarFeeds } from "~/lib/db/schema/schema";
import { dutyCalendar, isFeedToken } from "~/lib/duty-calendar";
import { db } from "~/server";
import { loadDuties } from "./duties";

/** Past duties stay in the calendar this long, so they don't vanish the next day. */
const KEEP_PAST_DAYS = 30;
const DAY = 86_400_000;

/** The feed link's path; the origin is wherever the member opened the site. */
export const feedPath = (token: string) => `/api/calendar/${token}.ics`;

/** A new link for the member, replacing (and so ending) their old one. */
export async function regenerateFeed(userId: string) {
  // 32 random bytes: 256 bits, not guessable.
  const token = randomBytes(32).toString("base64url");
  const [row] = await db
    .insert(calendarFeeds)
    .values({ token, userId })
    .onConflictDoUpdate({
      set: { createdAt: new Date(), token },
      target: calendarFeeds.userId,
    })
    .returning();
  return { createdAt: row?.createdAt ?? new Date(), path: feedPath(token) };
}

/** The member's current link, or null before they make one. */
export async function feedOf(userId: string) {
  const [row] = await db
    .select()
    .from(calendarFeeds)
    .where(eq(calendarFeeds.userId, userId));
  return row ? { createdAt: row.createdAt, path: feedPath(row.token) } : null;
}

/**
 * The calendar behind a feed token: the owner's duties from the last
 * month on, or null for a token that isn't (or is no longer) anyone's.
 */
export async function calendarForToken(
  token: string,
  { now = new Date(), origin }: { now?: Date; origin: string }
) {
  if (!isFeedToken(token)) {
    return null;
  }
  const [feed] = await db
    .select({ userId: calendarFeeds.userId })
    .from(calendarFeeds)
    .where(eq(calendarFeeds.token, token));
  if (!feed) {
    return null;
  }
  const { past, upcoming } = await loadDuties(feed.userId, now);
  const since = now.getTime() - KEEP_PAST_DAYS * DAY;
  const days = [
    ...past.filter((day) => day.schedule.date.getTime() >= since).reverse(),
    ...upcoming,
  ];
  return dutyCalendar(
    days.map(({ duties, schedule }) => ({ ...schedule, duties })),
    { now, origin }
  );
}
