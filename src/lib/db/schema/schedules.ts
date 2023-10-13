import { datetime, mysqlTable, serial, text } from "drizzle-orm/mysql-core";

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
