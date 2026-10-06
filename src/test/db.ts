import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

/**
 * In-process Postgres (PGlite) built from the real migrations, so integration
 * tests never need a running database and can never touch production.
 */
const client = new PGlite();
export const testDb = drizzle({ client });

let migrated: Promise<void> | undefined;

/** Applies `src/lib/db/migrations` once per test file. */
export const migrateTestDb = () => {
  migrated ??= migrate(testDb, {
    migrationsFolder: "./src/lib/db/migrations",
  });
  return migrated;
};

/** Empties every table in the public schema and resets serial ids. */
export const resetTestDb = async () => {
  const { rows } = await client.query<{ tablename: string }>(
    "select tablename from pg_tables where schemaname = 'public'"
  );
  if (rows.length === 0) {
    return;
  }
  const tables = rows.map((row) => `"${row.tablename}"`).join(", ");
  await testDb.execute(
    sql.raw(`truncate table ${tables} restart identity cascade`)
  );
};
