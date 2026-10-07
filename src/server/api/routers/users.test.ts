import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { users } from "~/lib/db/schema/schema";
import {
  anonymousCaller,
  callerFor,
  insertUser,
  insertUserWithPassword,
} from "~/test/caller";
import { testDb } from "~/test/db";

const PASSWORD = "correct-horse-battery";
const NEW_PASSWORD = "new-staple-password";
const BCRYPT_HASH = /^\$2[aby]\$/;

const findUserByEmail = async (email: string) => {
  const [row] = await testDb.select().from(users).where(eq(users.email, email));
  return row;
};

const findUserById = async (id: string) => {
  const [row] = await testDb.select().from(users).where(eq(users.id, id));
  return row;
};

describe("users.createUser", () => {
  it("creates a user with a bcrypt hash and never stores plaintext", async () => {
    const result = await anonymousCaller().users.createUser({
      name: "Alice",
      password: PASSWORD,
      username: "alice",
    });

    expect(result).toEqual({ success: true });
    const row = await findUserByEmail("alice");
    expect(row?.name).toBe("Alice");
    expect(row?.hashedPassword).toBeTruthy();
    expect(row?.hashedPassword).not.toBe(PASSWORD);
    expect(row?.hashedPassword).not.toContain(PASSWORD);
    expect(row?.hashedPassword).toMatch(BCRYPT_HASH);
    expect(await bcrypt.compare(PASSWORD, row?.hashedPassword ?? "")).toBe(
      true
    );
  });

  it("rejects a duplicate username with CONFLICT", async () => {
    await insertUser({ email: "alice" });

    await expect(
      anonymousCaller().users.createUser({
        name: "Impostor",
        password: PASSWORD,
        username: "alice",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const rows = await testDb
      .select()
      .from(users)
      .where(eq(users.email, "alice"));
    expect(rows).toHaveLength(1);
  });

  it("rejects passwords shorter than 8 characters with BAD_REQUEST", async () => {
    await expect(
      anonymousCaller().users.createUser({
        name: "Bob",
        password: "short",
        username: "bob",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await findUserByEmail("bob")).toBeUndefined();
  });
});

describe("users.getUserById", () => {
  it("returns the signed-in user without the password hash", async () => {
    const user = await insertUserWithPassword(PASSWORD, {
      email: "carol",
      name: "Carol",
    });

    const account = await callerFor(user.id).users.getUserById();

    expect(account).toEqual({
      email: "carol",
      hasPassword: true,
      id: user.id,
      image: null,
      name: "Carol",
    });
    expect(account).not.toHaveProperty("hashedPassword");
  });

  it("reports hasPassword false for OAuth-only accounts", async () => {
    const user = await insertUser();

    const account = await callerFor(user.id).users.getUserById();

    expect(account?.hasPassword).toBe(false);
  });

  it("returns null when the session user no longer exists", async () => {
    expect(await callerFor("ghost").users.getUserById()).toBeNull();
  });

  it("rejects signed-out visitors", async () => {
    await expect(anonymousCaller().users.getUserById()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("users.updatePassword", () => {
  const changeFor = (id: string) => ({
    currentPassword: PASSWORD,
    id,
    newPassword: NEW_PASSWORD,
    retypeNewPassword: NEW_PASSWORD,
  });

  it("stores a new bcrypt hash that verifies against the new password", async () => {
    const user = await insertUserWithPassword(PASSWORD);

    const result = await callerFor(user.id).users.updatePassword(
      changeFor(user.id)
    );

    expect(result).toEqual({ success: true });
    const hash = (await findUserById(user.id))?.hashedPassword ?? "";
    expect(hash).not.toContain(NEW_PASSWORD);
    expect(await bcrypt.compare(NEW_PASSWORD, hash)).toBe(true);
    expect(await bcrypt.compare(PASSWORD, hash)).toBe(false);
  });

  it("rejects a wrong current password and keeps the old hash", async () => {
    const user = await insertUserWithPassword(PASSWORD);

    await expect(
      callerFor(user.id).users.updatePassword({
        ...changeFor(user.id),
        currentPassword: "not-my-password",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect((await findUserById(user.id))?.hashedPassword).toBe(
      user.hashedPassword
    );
  });

  it("rejects a mismatched retyped password", async () => {
    const user = await insertUserWithPassword(PASSWORD);

    await expect(
      callerFor(user.id).users.updatePassword({
        ...changeFor(user.id),
        retypeNewPassword: "something-else",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await findUserById(user.id))?.hashedPassword).toBe(
      user.hashedPassword
    );
  });

  it("rejects changing another user's password with FORBIDDEN", async () => {
    const victim = await insertUserWithPassword(PASSWORD);
    const attacker = await insertUser();

    await expect(
      callerFor(attacker.id).users.updatePassword(changeFor(victim.id))
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await findUserById(victim.id))?.hashedPassword).toBe(
      victim.hashedPassword
    );
  });

  it("rejects accounts without a password (OAuth-only) with BAD_REQUEST", async () => {
    const user = await insertUser();

    await expect(
      callerFor(user.id).users.updatePassword(changeFor(user.id))
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects empty fields with BAD_REQUEST", async () => {
    const user = await insertUserWithPassword(PASSWORD);

    await expect(
      callerFor(user.id).users.updatePassword({
        ...changeFor(user.id),
        currentPassword: "",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("enforces the 8-character minimum on the new password", async () => {
    const user = await insertUserWithPassword(PASSWORD);

    await expect(
      callerFor(user.id).users.updatePassword({
        ...changeFor(user.id),
        newPassword: "x",
        retypeNewPassword: "x",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects signed-out visitors", async () => {
    await expect(
      anonymousCaller().users.updatePassword(changeFor("anyone"))
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("users.updateUser", () => {
  it("updates name, username (email) and image", async () => {
    const user = await insertUser({ email: "dave", name: "Dave" });

    const result = await callerFor(user.id).users.updateUser({
      id: user.id,
      image: "https://example.com/d.png",
      name: "David",
      username: "david",
    });

    expect(result).toEqual({ success: true });
    const row = await findUserById(user.id);
    expect(row).toMatchObject({
      email: "david",
      image: "https://example.com/d.png",
      name: "David",
    });
  });

  it("lets a user keep their own username", async () => {
    const user = await insertUser({ email: "erin", name: "Erin" });

    await callerFor(user.id).users.updateUser({
      id: user.id,
      name: "Erin B",
      username: "erin",
    });

    expect((await findUserById(user.id))?.name).toBe("Erin B");
  });

  it("does not touch the password hash", async () => {
    const user = await insertUserWithPassword(PASSWORD, { email: "fay" });

    await callerFor(user.id).users.updateUser({
      id: user.id,
      name: "Fay",
      username: "fay",
    });

    expect((await findUserById(user.id))?.hashedPassword).toBe(
      user.hashedPassword
    );
  });

  it("rejects taking another user's username with CONFLICT", async () => {
    await insertUser({ email: "taken" });
    const user = await insertUser({ email: "gina", name: "Gina" });

    await expect(
      callerFor(user.id).users.updateUser({
        id: user.id,
        name: "Gina",
        username: "taken",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await findUserById(user.id))?.email).toBe("gina");
  });

  it("rejects updating another user's account with FORBIDDEN", async () => {
    const victim = await insertUser({ email: "victim", name: "Victim" });
    const attacker = await insertUser();

    await expect(
      callerFor(attacker.id).users.updateUser({
        id: victim.id,
        name: "Pwned",
        username: "victim",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await findUserById(victim.id))?.name).toBe("Victim");
  });

  it("rejects malformed input with BAD_REQUEST", async () => {
    const user = await insertUser();

    await expect(
      callerFor(user.id).users.updateUser({
        id: user.id,
        name: "No username",
      } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects signed-out visitors", async () => {
    await expect(
      anonymousCaller().users.updateUser({
        id: "anyone",
        name: "x",
        username: "x",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
