import type { Config } from "drizzle-kit";
import { env } from "~/env.mjs";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

// `db:push` bypasses the migration history, so a pushed change is never
// recorded and later breaks `db:migrate`. Only allow it against local
// databases; production changes go through migrations in CI.
if (process.argv.includes("push") && env.DATABASE_URL) {
  const { hostname } = new URL(env.DATABASE_URL);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `Refusing to db:push to non-local host "${hostname}". Generate a migration instead.`
    );
  }
}

export default {
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  dialect: "postgresql",
  out: "./src/lib/db/migrations",
  schema: "./src/lib/db/schema/schema.ts",
} satisfies Config;
