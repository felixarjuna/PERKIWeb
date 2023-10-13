import {
  datetime,
  json,
  mysqlTable,
  serial,
  text,
} from "drizzle-orm/mysql-core";

export const takeaways = mysqlTable("takeaways", {
  id: serial("id").primaryKey(),
  takeawayId: text("takeawayId").notNull(),
  title: text("title").notNull(),
  date: datetime("date").notNull(),
  speaker: text("speaker").notNull(),
  bibleVerse: text("bibleVerse").notNull(),
  summary: text("summary").notNull(),
  contributors: json("contributors").notNull().$type<string[]>(),
});
