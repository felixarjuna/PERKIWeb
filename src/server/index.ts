// Production env
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env.mjs";

const connection = postgres(env.DATABASE_URL);
export const db = drizzle(connection);
