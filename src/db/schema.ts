import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  contributors: text("contributors").notNull(),
});
