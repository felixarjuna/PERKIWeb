import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { type Schedule, schedules } from "./schema/schema";

config();

const scheduleList: Schedule[] = [
  {
    accommodation: "Danny Kurniawan",
    bibleVerse: "Roma 4:1-12",
    cleaningGroup: "Group 4",
    cookingGroup: "Group 3",
    createdAt: new Date(),
    date: new Date("2024-04-26T22:00:00.000Z"),
    description: "Exposition the book of romans.",
    id: 40,
    leader: "Toni Setiawan",
    multimedia: "Felix Arjuna",
    musician: "Clarissa Adelyne",
    noteWriter: "Lionel Erico",
    preacher: "Ev. Nehemiah Riggruben",
    title: "Exposition Book of Romans",
    type: "church_service",
    updatedAt: new Date(),
  },
  {
    accommodation: null,
    bibleVerse: "Roma 4:13-25",
    cleaningGroup: "Group 5",
    cookingGroup: null,
    createdAt: new Date(),
    date: new Date("2024-05-03T22:00:00.000Z"),
    description: "Exposition the book of romans.",
    id: 41,
    leader: "Felix Arjuna",
    multimedia: null,
    musician: "Clarissa Adelyne",
    noteWriter: "Lionel Erico",
    preacher: "Danny Kurniawan",
    title: "Exposition Book of Romans",
    type: "bible_study",
    updatedAt: new Date(),
  },
];

const main = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const connection = postgres(databaseUrl);
  const db = drizzle(connection);

  console.log("Seed start");
  await db.insert(schedules).values(scheduleList);
  console.log("Seed done");
  await connection.end();
};

await main();
