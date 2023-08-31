import { datetime, int, json, mysqlTable, serial, text } from "drizzle-orm/mysql-core";

export const todos = mysqlTable("todos", {
  id: serial("id").primaryKey(),
  content: text("content"),
  done: int("done"),
});

export const takeaways = mysqlTable("takeaways", {
  id: serial("id").primaryKey(),
  takeawayId: text("takeawayId").notNull(),
  title: text("title").notNull(),
  date: datetime("date").notNull(),
  speaker: text("speaker").notNull(),
  bibleVerse: text("bibleVerse").notNull(),
  summary: text("summary").notNull(),
  contributors: text("contributors").notNull().$type<string[]>(),
});

export const prayers = mysqlTable("prayers", {
  id: serial("id").primaryKey(),
  name: text("name"),
  content: text("content").notNull(),
  count: int("count").notNull().default(0),
  prayerNames: json("prayerNames").notNull().$type<string[]>(),
});

export const schedules = mysqlTable("schedules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: datetime("date").notNull(),
  speaker: text("speaker").notNull(),
  bibleVerse: text("bibleVerse").notNull(),
  summary: text("summary").notNull(),
  liturgos: text("liturgos"),
  musician: text("musician"),
  multimedia: text("multimedia"),
  accommodation: text("accommodation"),
  cookingGroup: text("cookingGroup"),
  cleaningGroup: text("cleaningGroup").notNull(),
});
