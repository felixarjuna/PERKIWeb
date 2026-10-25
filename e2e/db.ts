import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, like, lt, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  groupMembers,
  groups,
  groupTerms,
  type NewSchedule,
  profiles,
  scheduleAssignments,
  schedules,
  servingPool,
  settings,
  takeaways,
  unavailability,
  users,
} from "~/lib/db/schema/schema";
import { assertLocalDatabase, e2eEnv } from "./env";

const DAYS_AHEAD = 30;
const DAY_MS = 86_400_000;

/**
 * Inserts a schedule straight into the e2e database so specs that only need
 * one to exist (e.g. takeaways) don't depend on the schedule form.
 */
export const insertSchedule = async (
  title: string,
  date = new Date(Date.now() + DAYS_AHEAD * DAY_MS),
  values: Partial<NewSchedule> = {}
) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, {
    max: 1,
    onnotice: () => null,
  });
  try {
    const [row] = await drizzle(client)
      .insert(schedules)
      .values({
        bibleVerse: "John 3:16",
        cleaningGroup: "Group A",
        date,
        description: `Seeded schedule ${title}`,
        leader: "Danny Kurniawan",
        musician: "Felix Arjuna",
        noteWriter: "Lionel Erico",
        title,
        type: "bible_study",
        ...values,
      })
      .returning({ id: schedules.id });
    if (!row) {
      throw new Error(`Failed to insert schedule "${title}".`);
    }
    return row.id;
  } finally {
    await client.end();
  }
};

/** Inserts a signed-in-capable user with a profile and the given role. */
export const insertProfiledUser = async (name: string, role: string) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    const id = randomUUID();
    const db = drizzle(client);
    await db.insert(users).values({ email: `${id}@e2e.test`, id, name, role });
    await db.insert(profiles).values({
      address: `${name} Street 1`,
      location: "Aachen",
      major: "Informatik",
      phoneNumber: "+4915112345678",
      userId: id,
    });
    return { email: `${id}@e2e.test`, id, name };
  } finally {
    await client.end();
  }
};

/** Inserts a takeaway; published unless `status` says otherwise. */
export const insertTakeaway = async (
  scheduleId: number,
  keypoints: string,
  authorId?: string,
  status: "draft" | "in_review" | "published" = "published"
) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    const [row] = await drizzle(client)
      .insert(takeaways)
      .values({
        authorId,
        contributors: ["Test Author"],
        keypoints,
        scheduleId,
        status,
      })
      .returning({ id: takeaways.id });
    if (!row) {
      throw new Error("Failed to insert test takeaway");
    }
    return row.id;
  } finally {
    await client.end();
  }
};

/** Puts a linked account in a serving slot of a schedule. */
export const insertAssignment = async (
  scheduleId: number,
  role: string,
  user: { id: string; name: string }
) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    await drizzle(client)
      .insert(scheduleAssignments)
      .values({ name: user.name, role, scheduleId, userId: user.id });
  } finally {
    await client.end();
  }
};

/**
 * Adds a group with one linked member to the group term in force on `day`
 * (`yyyy-MM-dd`), creating an early term when there is none yet, so other
 * specs' groups stay as they are.
 */
export const insertGroupWith = async (
  groupName: string,
  user: { id: string; name: string },
  day: string
) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    const db = drizzle(client);
    const [inForce] = await db
      .select()
      .from(groupTerms)
      .where(lte(groupTerms.startsOn, day))
      .orderBy(desc(groupTerms.startsOn))
      .limit(1);
    const term =
      inForce ??
      (
        await db
          .insert(groupTerms)
          .values({ startsOn: "2000-01-01" })
          .onConflictDoUpdate({
            set: { startsOn: "2000-01-01" },
            target: groupTerms.startsOn,
          })
          .returning()
      )[0];
    const [group] = await db
      .insert(groups)
      .values({ name: groupName, termId: term?.id ?? 0 })
      .returning();
    await db
      .insert(groupMembers)
      .values({ groupId: group?.id ?? 0, name: user.name, userId: user.id });
  } finally {
    await client.end();
  }
};

/** Puts a member in the serving pool, active in a role at both kinds of gathering. */
export const insertPoolEntry = async (
  userId: string,
  role: string,
  values: Partial<typeof servingPool.$inferInsert> = {}
) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    await drizzle(client)
      .insert(servingPool)
      .values({ role, scope: "both", userId, ...values });
  } finally {
    await client.end();
  }
};

/** Replaces a takeaway's notes, as if its writer had saved new text. */
export const updateTakeawayNotes = async (id: number, keypoints: string) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    await drizzle(client)
      .update(takeaways)
      .set({ keypoints })
      .where(eq(takeaways.id, id));
  } finally {
    await client.end();
  }
};

/** Deletes every schedule (and so its takeaways) from `from` until `before`. */
export const deleteSchedulesBetween = async (from: Date, before: Date) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, {
    max: 1,
    onnotice: () => null,
  });
  try {
    await drizzle(client)
      .delete(schedules)
      .where(and(gte(schedules.date, from), lt(schedules.date, before)));
  } finally {
    await client.end();
  }
};

/** Records when a seeded takeaway was published, as publishing would. */
export const setPublishedAt = async (id: number, publishedAt: Date) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    await drizzle(client)
      .update(takeaways)
      .set({ publishedAt })
      .where(eq(takeaways.id, id));
  } finally {
    await client.end();
  }
};

/** Saves a workspace setting (keys in `src/lib/settings.ts`). */
export const saveSetting = async (key: string, value: string) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    await drizzle(client)
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ set: { value }, target: settings.key });
  } finally {
    await client.end();
  }
};

/** Deletes the accounts whose name starts with `prefix`, with their pool entries and links. */
export const deleteUsersNamed = async (prefix: string) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    await drizzle(client)
      .delete(users)
      .where(like(users.name, `${prefix}%`));
  } finally {
    await client.end();
  }
};

/** Marks days (`yyyy-MM-dd`, both included) a member can't serve. */
export const insertUnavailability = async (
  userId: string,
  startsOn: string,
  endsOn: string,
  note: string | null = null
) => {
  assertLocalDatabase(e2eEnv.DATABASE_URL);
  const client = postgres(e2eEnv.DATABASE_URL, { max: 1 });
  try {
    await drizzle(client)
      .insert(unavailability)
      .values({ endsOn, note, startsOn, userId });
  } finally {
    await client.end();
  }
};
