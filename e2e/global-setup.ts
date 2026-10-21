import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { accounts, profiles, users } from "~/lib/db/schema/schema";
import { assertLocalDatabase, e2eEnv } from "./env";
import {
  ADMIN,
  DASHBOARD_MEMBERS,
  MEMBER,
  OWNER,
  WRITER,
  WRITER_2,
} from "./fixtures";

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

    // Seeded accounts have seen the welcome step, so specs land where they
    // navigate instead of on /welcome.
    const welcomeSeenAt = new Date();
    await db.insert(users).values(
      [
        { email: MEMBER.email, id: MEMBER.id, name: MEMBER.name },
        { email: ADMIN.email, id: ADMIN.id, name: ADMIN.name, role: "mita" },
        { email: OWNER.email, id: OWNER.id, name: OWNER.name, role: "owner" },
        {
          email: WRITER.email,
          id: WRITER.id,
          name: WRITER.name,
          role: "writer",
        },
        {
          email: WRITER_2.email,
          id: WRITER_2.id,
          name: WRITER_2.name,
          role: "writer",
        },
      ].map((user) => ({ ...user, welcomeSeenAt }))
    );

    await db.insert(accounts).values(
      [MEMBER, ADMIN, OWNER, WRITER, WRITER_2].map(({ id }) => ({
        provider: "google",
        providerAccountId: id,
        type: "oidc" as const,
        userId: id,
      }))
    );

    // The owner appears in the member directory, which lists profiles.
    await db.insert(profiles).values({
      address: "Owner Street 1",
      location: "Aachen",
      major: "Informatik",
      phoneNumber: "+4915112345678",
      userId: OWNER.id,
    });

    // Dashboard members only need a profile; they never sign in. Each joins
    // a day apart: rows sharing one instant read as a migration backfill.
    const DAY_MS = 86_400_000;
    await db.insert(users).values(
      DASHBOARD_MEMBERS.map(({ email, id, name }, index) => ({
        createdAt: new Date(Date.now() - index * DAY_MS),
        email,
        id,
        name,
      }))
    );
    await db.insert(profiles).values(
      DASHBOARD_MEMBERS.map(({ birthday, id, name }) => ({
        address: `${name} Street 1`,
        birthday,
        location: "Aachen",
        major: "Informatik",
        phoneNumber: "+4915112345678",
        userId: id,
      }))
    );
  } finally {
    await client.end();
  }
}
