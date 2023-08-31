import * as dotenv from "dotenv";
import { Config } from "drizzle-kit";
dotenv.config();

// Prod env
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "mysql2",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;

// Development env
// export default {
//   schema: "./src/db/schema.ts",
//   out: "./drizzle",
//   driver: "better-sqlite",
//   dbCredentials: {
//     url: "sqlite.db",
//   },
// } satisfies Config;
