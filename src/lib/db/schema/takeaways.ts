import { relations } from "drizzle-orm";
import { int, json, mysqlTable, serial, text } from "drizzle-orm/mysql-core";
import { schedules } from "./schedules";

export const takeaways = mysqlTable("takeaways", {
  id: serial("id").primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  keypoints: text("keypoints").notNull(),
  contributors: json("contributors").notNull().$type<string[]>(),
});

export const takeawayRelation = relations(takeaways, ({ one }) => ({
  schedule: one(schedules, {
    fields: [takeaways.scheduleId],
    references: [schedules.id],
  }),
}));
