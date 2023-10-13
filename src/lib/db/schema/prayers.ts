import {
  boolean,
  int,
  json,
  mysqlTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const prayers = mysqlTable("prayers", {
  id: serial("id").primaryKey(),
  name: text("name"),
  isAnonymous: boolean("isAnonymous").default(false),
  content: text("content").notNull(),
  count: int("count").notNull().default(0),
  prayerNames: json("prayerNames").notNull().$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow(),
});
