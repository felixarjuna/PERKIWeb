import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schedules } from "./schema/schema";

import * as dotenv from "dotenv";
dotenv.config();

const scheduleList = [
  {
    id: 40,
    title: "Exposition Book of Romans",
    date: new Date("2024-04-26T22:00:00.000Z"),
    speaker: "Ev. Nehemiah Riggruben",
    bibleVerse: "Roma 4:1-12",
    summary: "Exposition the book of romans.",
    liturgos: "Toni Setiawan",
    musician: "Clarissa Adelyne",
    multimedia: "Felix Arjuna",
    accommodation: "Danny Kurniawan",
    cookingGroup: "Group 3",
    cleaningGroup: "Group 4",
    fellowshipType: "ChurchService",
  },
  {
    id: 41,
    title: "Exposition Book of Romans",
    date: new Date("2024-05-03T22:00:00.000Z"),
    speaker: "Danny Kurniawan",
    bibleVerse: "Roma 4:13-25",
    summary: "Exposition the book of romans.",
    liturgos: null,
    musician: "Clarissa Adelyne",
    multimedia: null,
    accommodation: null,
    cookingGroup: null,
    cleaningGroup: "Group 5",
    fellowshipType: "BigGroupBibleStudy",
  },
];

const DATABASE_URL =
  "***REMOVED***";

export const main = async () => {
  const connection = postgres(DATABASE_URL);
  const db = drizzle(connection);

  console.log("Seed start");
  await db.insert(schedules).values(scheduleList);
  console.log("Seed done");
};
