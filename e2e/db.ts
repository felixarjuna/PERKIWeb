import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { profiles, schedules, takeaways, users } from "~/lib/db/schema/schema";
import { assertLocalDatabase, e2eEnv } from "./env";

const DAYS_AHEAD = 30;
const DAY_MS = 86_400_000;

/**
 * Inserts a schedule straight into the e2e database so specs that only need
 * one to exist (e.g. takeaways) don't depend on the schedule form.
 */
export const insertSchedule = async (title: string) => {
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
        date: new Date(Date.now() + DAYS_AHEAD * DAY_MS),
        description: `Seeded schedule ${title}`,
        leader: "Danny Kurniawan",
        musician: "Felix Arjuna",
        noteWriter: "Lionel Erico",
        title,
        type: "bible_study",
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

export const insertTakeaway = async (
  scheduleId: number,
  keypoints: string,
  authorId?: string
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
