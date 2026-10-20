import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { profiles } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const profileFor = (userId: string) => ({
  address: "Musterstr. 1, 80333 Munich",
  bio: "Hi!",
  birthday: new Date("2000-02-29T00:00:00.000Z"),
  location: "Munich",
  major: "Informatics",
  phoneNumber: "+49 123 456789",
  userId,
});

const profilesOf = (userId: string) =>
  testDb.select().from(profiles).where(eq(profiles.userId, userId));

describe("profiles.addUserProfile", () => {
  it("stores the signed-in user's profile", async () => {
    const user = await insertUser();

    await callerFor(user.id).profiles.addUserProfile(profileFor(user.id));

    const rows = await profilesOf(user.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      ...profileFor(user.id),
      birthday: new Date("2000-02-29T00:00:00.000Z"),
    });
  });

  it("rejects a second profile for the same user with CONFLICT", async () => {
    const user = await insertUser();
    const api = callerFor(user.id);
    await api.profiles.addUserProfile(profileFor(user.id));

    await expect(
      api.profiles.addUserProfile({ ...profileFor(user.id), major: "Physics" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const rows = await profilesOf(user.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.major).toBe("Informatics");
  });

  it("stores one profile when the same user submits twice at once", async () => {
    const user = await insertUser();
    const api = callerFor(user.id);

    const results = await Promise.allSettled([
      api.profiles.addUserProfile(profileFor(user.id)),
      api.profiles.addUserProfile(profileFor(user.id)),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({
      reason: { code: "CONFLICT" },
    });
    expect(await profilesOf(user.id)).toHaveLength(1);
  });

  it("rejects submitting a profile for another user with FORBIDDEN", async () => {
    const victim = await insertUser();
    const attacker = await insertUser();

    await expect(
      callerFor(attacker.id).profiles.addUserProfile(profileFor(victim.id))
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await profilesOf(victim.id)).toHaveLength(0);
  });

  it("rejects a missing birthday with BAD_REQUEST", async () => {
    const user = await insertUser();
    const { birthday: _birthday, ...withoutBirthday } = profileFor(user.id);

    await expect(
      callerFor(user.id).profiles.addUserProfile(withoutBirthday as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects signed-out visitors", async () => {
    await expect(
      anonymousCaller().profiles.addUserProfile(profileFor("anyone"))
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("profiles.getUserProfiles", () => {
  it("joins each profile with its user's public columns for admins", async () => {
    const member = await insertUser({ email: "member", name: "Member" });
    await callerFor(member.id).profiles.addUserProfile(profileFor(member.id));
    const admin = await insertUser({ role: "admin" });

    const rows = await callerFor(admin.id).profiles.getUserProfiles();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.profiles.phoneNumber).toBe("+49 123 456789");
    expect(rows[0]?.user).toEqual({
      email: "member",
      id: member.id,
      image: null,
      name: "Member",
      role: "member",
    });
    expect(rows[0]?.user).not.toHaveProperty("hashedPassword");
  });

  it("rejects signed-out visitors", async () => {
    await expect(
      anonymousCaller().profiles.getUserProfiles()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("hides member PII from a freshly self-registered account", async () => {
    const member = await insertUser();
    await callerFor(member.id).profiles.addUserProfile(profileFor(member.id));
    const stranger = await insertUser({ name: "Stranger" });

    await expect(
      callerFor(stranger?.id ?? "").profiles.getUserProfiles()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps the member directory from writers", async () => {
    const member = await insertUser();
    await callerFor(member.id).profiles.addUserProfile(profileFor(member.id));
    const writer = await insertUser({ role: "writer" });

    await expect(
      callerFor(writer.id).profiles.getUserProfiles()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("profiles.hasOwnProfile", () => {
  it("is false before the user registers as a member", async () => {
    const user = await insertUser();

    expect(await callerFor(user.id).profiles.hasOwnProfile()).toBe(false);
  });

  it("is true once the user's profile exists", async () => {
    const user = await insertUser();
    const api = callerFor(user.id);
    await api.profiles.addUserProfile(profileFor(user.id));

    expect(await api.profiles.hasOwnProfile()).toBe(true);
  });

  it("does not leak another user's registration", async () => {
    const registered = await insertUser();
    const other = await insertUser();
    await callerFor(registered.id).profiles.addUserProfile(
      profileFor(registered.id)
    );

    expect(await callerFor(other.id).profiles.hasOwnProfile()).toBe(false);
  });

  it("rejects anonymous callers with UNAUTHORIZED", async () => {
    await expect(
      anonymousCaller().profiles.hasOwnProfile()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
