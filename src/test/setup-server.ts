import { afterEach, beforeAll, vi } from "vitest";
import { migrateTestDb, resetTestDb } from "./db";

/**
 * Server tests swap the production postgres-js client for PGlite and stub
 * NextAuth, so importing a router never reads env vars or opens a connection.
 */
vi.mock("~/server", async () => ({ db: (await import("./db")).testDb }));
vi.mock("~/server/auth", () => ({ auth: vi.fn(() => null) }));

beforeAll(migrateTestDb);
afterEach(resetTestDb);
