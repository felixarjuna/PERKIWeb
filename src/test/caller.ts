import { randomUUID } from "node:crypto";
import type { Session } from "next-auth";
import { users } from "~/lib/db/schema/schema";
import { createCaller } from "~/server/api/root";
import { testDb } from "./db";

const SESSION_TTL_MS = 60 * 60 * 1000;

/** A tRPC caller with no session, i.e. a signed-out visitor. */
export const anonymousCaller = () =>
  createCaller({ headers: new Headers(), session: null });

/** A tRPC caller whose session belongs to `userId`. */
export const callerFor = (userId: string) => {
  const session: Session = {
    expires: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    user: { id: userId },
  };
  return createCaller({ headers: new Headers(), session });
};

/** Inserts a user row directly and returns it. */
export const insertUser = async (
  overrides: Partial<typeof users.$inferInsert> = {}
) => {
  const id = overrides.id ?? randomUUID();
  const [user] = await testDb
    .insert(users)
    .values({ email: `${id}@test.local`, id, name: "Test User", ...overrides })
    .returning();
  if (!user) {
    throw new Error("Failed to insert test user");
  }
  return user;
};
