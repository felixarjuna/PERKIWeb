import { int, mysqlTable, serial, text } from "drizzle-orm/mysql-core";

export const todos = mysqlTable("todos", {
  id: serial("id").primaryKey(),
  content: text("content"),
  done: int("done"),
});
