import { afterEach, beforeAll, vi } from "vitest";
import { migrateTestDb, resetTestDb } from "./db";

/**
 * Server tests swap the production postgres-js client for PGlite and stub
 * NextAuth, so importing a router never reads env vars or opens a connection.
 */
vi.mock("~/server", async () => ({ db: (await import("./db")).testDb }));
vi.mock("~/server/auth", () => ({ auth: vi.fn(() => null) }));

// Migrations insert some data (e.g. the current groups); tests start empty.
beforeAll(async () => {
  await migrateTestDb();
  await resetTestDb();
});
afterEach(resetTestDb);
