import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey(),
  content: text("content"),
  done: integer("done"),
});

export const takeaways = sqliteTable("takeaways", {
  id: integer("id").primaryKey(),
  takeawayId: text("takeawayId").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  speaker: text("speaker").notNull(),
  bibleVerse: text("bibleVerse").notNull(),
  summary: text("summary").notNull(),
  contributors: text("contributors").notNull().$type<string[]>(),
});

export const prayers = sqliteTable("prayers", {
  id: integer("id").primaryKey(),
  name: text("name"),
  content: text("content").notNull(),
  count: integer("count").notNull().default(0),
  prayerNames: blob("prayerNames", { mode: "json" }).notNull().$type<string[]>(),
});

export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
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
