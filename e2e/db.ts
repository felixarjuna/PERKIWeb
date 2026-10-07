import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schedules } from "~/lib/db/schema/schema";
import { e2eEnv } from "./env";

const DAYS_AHEAD = 30;
const DAY_MS = 86_400_000;

/**
 * Inserts a schedule straight into the e2e database so specs that only need
 * one to exist (e.g. takeaways) don't depend on the schedule form.
 */
export const insertSchedule = async (title: string) => {
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
