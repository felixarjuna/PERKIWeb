import { router } from "./trpc";

import { prayerRouter } from "./api/routers/prayers";
import { scheduleRouter } from "./api/routers/schedules";
import { takeawayRouter } from "./api/routers/takeaway";
import { todoRouter } from "./api/routers/todo";

// Development env
// import { drizzle } from "drizzle-orm/better-sqlite3";
// import Database from "better-sqlite3";
// const sqlite = new Database("sqlite.db");
// export const db = drizzle(sqlite);

// Production env
import { connect } from "@planetscale/database";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/planetscale-serverless";
dotenv.config();

const connection = connect({
  host: process.env["DATABASE_HOST"],
  username: process.env["DATABASE_USERNAME"],
  password: process.env["DATABASE_PASSWORD"],
});

export const db = drizzle(connection);

export const appRouter = router({
  todos: todoRouter,
  takeaways: takeawayRouter,
  schedules: scheduleRouter,
  prayers: prayerRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;
/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
