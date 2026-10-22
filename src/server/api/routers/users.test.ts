import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  accounts,
  prayers,
  profiles,
  roleChanges,
  schedules,
  takeaways,
  users,
} from "~/lib/db/schema/schema";
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

describe("users.deleteMine", () => {
  /** A member with a profile, a Google link, a prayer, a takeaway and a role change they made. */
  const memberWithHistory = async () => {
    const member = await insertUser({ name: "Leaving Member" });
    const other = await insertUser({ name: "Other Member" });
    await testDb
      .insert(profiles)
      .values({ location: "Aachen", userId: member.id });
    await testDb.insert(accounts).values({
      provider: "google",
      providerAccountId: `google-${member.id}`,
      type: "oidc",
      userId: member.id,
    });
    await testDb.insert(prayers).values([
      { authorId: member.id, content: "Mine", prayerNames: [] },
      { authorId: other.id, content: "Theirs", prayerNames: [] },
    ]);
    const [schedule] = await testDb
      .insert(schedules)
      .values({
        bibleVerse: "John 3:16",
        cleaningGroup: "Group 1",
        date: new Date("2026-10-18T13:30:00Z"),
        description: "Sunday service",
        leader: "Leader",
        musician: "Musician",
        noteWriter: "Leaving Member",
        title: "Service",
        type: "church_service",
      })
      .returning();
    if (!schedule) {
      throw new Error("Failed to insert schedule");
    }
    await testDb.insert(takeaways).values({
      authorId: member.id,
      contributors: [],
      keypoints: "Notes",
      scheduleId: schedule.id,
    });
    await testDb.insert(roleChanges).values([
      {
        changedById: member.id,
        fromRole: "member",
        toRole: "writer",
        userId: other.id,
      },
      { fromRole: "member", toRole: "writer", userId: member.id },
    ]);
    return { member, other };
  };

  it("removes the account, its profile, Google link and prayers", async () => {
    const { member, other } = await memberWithHistory();

    await callerFor(member.id).users.deleteMine();

    expect(await findUser(member.id)).toBeUndefined();
    expect(await testDb.select().from(profiles)).toEqual([]);
    expect(await testDb.select().from(accounts)).toEqual([]);
    expect(
      (await testDb.select().from(prayers)).map((prayer) => prayer.content)
    ).toEqual(["Theirs"]);
    expect(await findUser(other.id)).toBeDefined();
  });

  it("keeps their takeaways and the role changes they made, without them", async () => {
    const { member, other } = await memberWithHistory();

    await callerFor(member.id).users.deleteMine();

    const [takeaway] = await testDb.select().from(takeaways);
    expect(takeaway?.authorId).toBeNull();
    const history = await testDb.select().from(roleChanges);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ changedById: null, userId: other.id });
  });

  it("never deletes the owner's account", async () => {
    const owner = await insertUser({ role: "owner" });

    await expect(callerFor(owner.id).users.deleteMine()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await findUser(owner.id)).toBeDefined();
  });

  it("rejects signed-out visitors", async () => {
    await expect(anonymousCaller().users.deleteMine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
