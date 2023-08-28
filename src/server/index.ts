import { drizzle } from "drizzle-orm/better-sqlite3";
import { router } from "./trpc";

import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { takeawayRouter } from "./api/routers/takeaway";
import { todoRouter } from "./api/routers/todo";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "drizzle" });

export const appRouter = router({ todos: todoRouter, takeaways: takeawayRouter });

export type AppRouter = typeof appRouter;
