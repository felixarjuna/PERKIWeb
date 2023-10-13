import * as dotenv from "dotenv";
import { type Config } from "drizzle-kit";
dotenv.config();

// Prod env
export default {
  schema: "./src/lib/db/schema",
  out: "./src/lib/db/migrations",
  driver: "mysql2",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
