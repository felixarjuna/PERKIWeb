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

describe("names from Google", () => {
  it("can't be changed from the app", async () => {
    const user = await insertUser({ name: "Maria Santoso" });
    const rename = Reflect.get(
      callerFor(user.id).users,
      "updateUser"
    ) as RemovedMutation;

    await expect(rename({ id: user.id, name: "Mimi" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect((await findUser(user.id))?.name).toBe("Maria Santoso");
  });
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
