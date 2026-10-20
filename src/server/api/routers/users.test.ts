import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { users } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const findUser = async (id: string) =>
  (await testDb.select().from(users).where(eq(users.id, id))).at(0);
type RemovedMutation = (input: Record<string, string>) => Promise<unknown>;

describe("removed password APIs", () => {
  it.each(["createUser", "updatePassword"])(
    "rejects calls to users.%s",
    async (method) => {
      const user = await insertUser();
      const call = Reflect.get(
        callerFor(user.id).users,
        method
      ) as RemovedMutation;
      await expect(
        call({
          currentPassword: "old-password",
          id: user.id,
          name: "Stranger",
          newPassword: "new-password",
          password: "long-enough-password",
          retypeNewPassword: "new-password",
          username: "stranger",
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
  );
});

describe("users.getUserById", () => {
  it("returns the signed-in account without password metadata", async () => {
    const user = await insertUser({
      email: "member@example.com",
      name: "Member",
    });
    const account = await callerFor(user.id).users.getUserById();
    expect(account).toEqual({
      email: user.email,
      id: user.id,
      image: null,
      name: "Member",
    });
    expect(account).not.toHaveProperty("hashedPassword");
    expect(account).not.toHaveProperty("hasPassword");
  });
  it("returns null for a missing account", async () => {
    expect(await callerFor("ghost").users.getUserById()).toBeNull();
  });
  it("rejects signed-out visitors", async () => {
    await expect(anonymousCaller().users.getUserById()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("users.updateUser", () => {
  it("updates the display name without changing Google's email or account identity", async () => {
    const user = await insertUser({
      email: "member@example.com",
      name: "Member",
    });
    await callerFor(user.id).users.updateUser({
      email: "attacker@example.com",
      hashedPassword: "injected",
      id: user.id,
      image: "https://evil.test/avatar",
      name: "New Name",
      username: "attacker@example.com",
    } as never);
    expect(await findUser(user.id)).toMatchObject({
      email: "member@example.com",
      hashedPassword: null,
      image: null,
      name: "New Name",
    });
  });
  it("accepts a name-only update", async () => {
    const user = await insertUser();
    await callerFor(user.id).users.updateUser({
      id: user.id,
      name: "Updated",
    } as never);
    expect((await findUser(user.id))?.name).toBe("Updated");
  });
  it("rejects a blank name", async () => {
    const user = await insertUser();
    await expect(
      callerFor(user.id).users.updateUser({ id: user.id, name: "   " } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("rejects updates to another account", async () => {
    const victim = await insertUser({ name: "Victim" });
    const attacker = await insertUser();
    await expect(
      callerFor(attacker.id).users.updateUser({
        id: victim.id,
        name: "Changed",
      } as never)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await findUser(victim.id))?.name).toBe("Victim");
  });
  it("rejects signed-out updates", async () => {
    await expect(
      anonymousCaller().users.updateUser({
        id: "anyone",
        name: "Changed",
      } as never)
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
