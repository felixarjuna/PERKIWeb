import { drizzle } from "drizzle-orm/better-sqlite3";
import { router } from "./trpc";

import Database from "better-sqlite3";
import { scheduleRouter } from "./api/routers/schedules";
import { takeawayRouter } from "./api/routers/takeaway";
import { todoRouter } from "./api/routers/todo";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite);

export const appRouter = router({
  todos: todoRouter,
  takeaways: takeawayRouter,
  schedules: scheduleRouter,
});

export type AppRouter = typeof appRouter;
