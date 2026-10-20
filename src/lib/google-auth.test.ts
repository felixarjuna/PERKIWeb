import type { NextAuthConfig } from "next-auth";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { accounts, profiles, users } from "~/lib/db/schema/schema";
import { migrateTestDb, resetTestDb, testDb } from "~/test/db";
import "~/server/auth";

vi.mock("~/server", async () => ({ db: (await import("~/test/db")).testDb }));
beforeAll(migrateTestDb);
afterEach(resetTestDb);
vi.mock("~/env.mjs", () => ({
  env: {
    GOOGLE_CLIENT_ID: "test-client",
    GOOGLE_CLIENT_SECRET: "test-secret",
    NEXTAUTH_SECRET: "test-secret",
    NODE_ENV: "test",
  },
}));
const captured = vi.hoisted(() => ({ config: null as NextAuthConfig | null }));
vi.mock("next-auth", () => ({
  default: (config: NextAuthConfig) => {
    captured.config = config;
    return {
      auth: () => null,
      handlers: {},
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  },
}));

const getConfig = () => {
  const { config } = captured;
  if (!config || typeof config === "function") {
    throw new Error("Expected static authentication configuration");
  }
  return config;
};

describe("Google-only authentication", () => {
  it("registers Google as the only sign-in provider", () => {
    expect(getConfig().providers).toEqual([
      expect.objectContaining({ id: "google" }),
    ]);
  });
  it("creates a first-time Google account without a password", async () => {
    const { adapter } = getConfig();
    if (
      !(adapter?.createUser && adapter.linkAccount && adapter.getUserByAccount)
    ) {
      throw new Error("Missing authentication adapter methods");
    }
    const user = await adapter.createUser({
      email: "new@example.com",
      emailVerified: null,
      id: "google-new",
      image: null,
      name: "New Member",
    });
    await adapter.linkAccount({
      provider: "google",
      providerAccountId: "google-sub-1",
      type: "oidc",
      userId: user.id,
    });
    expect(
      await adapter.getUserByAccount({
        provider: "google",
        providerAccountId: "google-sub-1",
      })
    ).toMatchObject({ email: "new@example.com", id: user.id });
    const rows = await testDb.select().from(users);
    expect(rows).toHaveLength(1);
    expect(rows.at(0)?.hashedPassword).toBeNull();
  });
  it("finds an existing Google account without replacing its membership", async () => {
    const existing = {
      email: "existing@example.com",
      id: "existing-google-user",
    };
    await testDb.insert(users).values(existing);
    await testDb.insert(accounts).values({
      provider: "google",
      providerAccountId: "existing-google-sub",
      type: "oidc",
      userId: existing.id,
    });
    await testDb
      .insert(profiles)
      .values({ location: "Aachen", userId: existing.id });
    const { adapter } = getConfig();
    if (!adapter?.getUserByAccount) {
      throw new Error("Missing Google account lookup");
    }
    expect(
      await adapter.getUserByAccount({
        provider: "google",
        providerAccountId: "existing-google-sub",
      })
    ).toMatchObject({ id: existing.id });
    expect(await testDb.select().from(users)).toHaveLength(1);
    expect(await testDb.select().from(profiles)).toEqual([
      expect.objectContaining({ location: "Aachen", userId: existing.id }),
    ]);
  });
});
