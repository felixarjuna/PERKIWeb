import { type Config } from "drizzle-kit";
import { env } from "~/env.mjs";

export default {
  schema: "./src/lib/db/schema/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;
