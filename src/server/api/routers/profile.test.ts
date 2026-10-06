import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { profiles, users } from "~/lib/db/schema/schema";
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
  it("joins each profile with its user's public columns", async () => {
    const member = await insertUser({ email: "member", name: "Member" });
    await callerFor(member.id).profiles.addUserProfile(profileFor(member.id));

    const rows = await callerFor(member.id).profiles.getUserProfiles();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.profiles.phoneNumber).toBe("+49 123 456789");
    expect(rows[0]?.user).toEqual({
      email: "member",
      id: member.id,
      image: null,
      name: "Member",
    });
    expect(rows[0]?.user).not.toHaveProperty("hashedPassword");
  });

  it("rejects signed-out visitors", async () => {
    await expect(
      anonymousCaller().profiles.getUserProfiles()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  // SECURITY: getUserProfiles returns every member's phone number, address
  // and birthday but is only a protectedProcedure. Signup (users.createUser)
  // is public, so anyone on the internet can self-register and then dump the
  // whole member directory. It should be restricted to admins/approved
  // members; a plain freshly created account must get FORBIDDEN.
  it.fails("hides member PII from a freshly self-registered account", async () => {
    const member = await insertUser();
    await callerFor(member.id).profiles.addUserProfile(profileFor(member.id));
    await anonymousCaller().users.createUser({
      name: "Stranger",
      password: "stranger-password",
      username: "stranger",
    });
    const [stranger] = await testDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "stranger"));

    await expect(
      callerFor(stranger?.id ?? "").profiles.getUserProfiles()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
