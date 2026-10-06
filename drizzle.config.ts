import type { Config } from "drizzle-kit";
import { env } from "~/env.mjs";

export default {
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  dialect: "postgresql",
  out: "./src/lib/db/migrations",
  schema: "./src/lib/db/schema/schema.ts",
} satisfies Config;
