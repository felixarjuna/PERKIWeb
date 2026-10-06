import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { users } from "~/lib/db/schema/schema";
import { assertLocalDatabase, e2eEnv } from "./env";
import { MEMBER } from "./fixtures";

/** Migrates the throwaway database from scratch and seeds known accounts. */
export default async function globalSetup() {
  assertLocalDatabase(e2eEnv.DATABASE_URL);

  const client = postgres(e2eEnv.DATABASE_URL, {
    max: 1,
    onnotice: () => null,
  });
  const db = drizzle(client);
  try {
    await db.execute(sql`drop schema if exists public cascade`);
    await db.execute(sql`drop schema if exists drizzle cascade`);
    await db.execute(sql`create schema public`);
    await migrate(db, { migrationsFolder: "./src/lib/db/migrations" });

    await db.insert(users).values({
      email: MEMBER.email,
      hashedPassword: await bcrypt.hash(MEMBER.password, 10),
      id: MEMBER.id,
      name: MEMBER.name,
    });
  } finally {
    await client.end();
  }
}
