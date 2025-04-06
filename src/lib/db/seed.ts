import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { type Schedule, schedules } from "./schema/schema";

import * as dotenv from "dotenv";
dotenv.config();

const scheduleList: Schedule[] = [
  {
    id: 40,
    title: "Exposition Book of Romans",
    date: new Date("2024-04-26T22:00:00.000Z"),
    preacher: "Ev. Nehemiah Riggruben",
    bibleVerse: "Roma 4:1-12",
    description: "Exposition the book of romans.",
    leader: "Toni Setiawan",
    musician: "Clarissa Adelyne",
    noteWriter: "Lionel Erico",
    multimedia: "Felix Arjuna",
    accommodation: "Danny Kurniawan",
    cookingGroup: "Group 3",
    cleaningGroup: "Group 4",
    type: "church_service",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 41,
    title: "Exposition Book of Romans",
    date: new Date("2024-05-03T22:00:00.000Z"),
    preacher: "Danny Kurniawan",
    bibleVerse: "Roma 4:13-25",
    description: "Exposition the book of romans.",
    leader: "Felix Arjuna",
    musician: "Clarissa Adelyne",
    noteWriter: "Lionel Erico",
    multimedia: null,
    accommodation: null,
    cookingGroup: null,
    cleaningGroup: "Group 5",
    type: "bible_study",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const DATABASE_URL =
  "postgres://postgres.ofwbvpmgfffrzynmcsxf:felixarjuna123!@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";

export const main = async () => {
  const connection = postgres(DATABASE_URL);
  const db = drizzle(connection);

  console.log("Seed start");
  await db.insert(schedules).values(scheduleList);
  console.log("Seed done");
};
