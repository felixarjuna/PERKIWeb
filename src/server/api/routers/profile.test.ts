import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { profiles, users } from "~/lib/db/schema/schema";
import { SETTING_KEYS } from "~/lib/settings";
import { setSetting } from "~/server/settings";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const fullProfile = {
  address: "Musterstr. 1, 80333 Munich",
  birthday: new Date("2000-02-29T00:00:00.000Z"),
  location: "Munich",
  major: "Informatics",
  phoneNumber: "+49 123 456789",
};

const WHATSAPP = "https://chat.whatsapp.com/AbC123";

/** A profile row as the old join form left it. */
const insertProfile = (
  userId: string,
  values: Partial<typeof profiles.$inferInsert> = fullProfile
) => testDb.insert(profiles).values({ userId, ...values });

const profilesOf = (userId: string) =>
  testDb.select().from(profiles).where(eq(profiles.userId, userId));

describe("profiles.mine", () => {
  it("has no profile and a due welcome for a new account", async () => {
    const user = await insertUser();

    const mine = await callerFor(user.id).profiles.mine();

    expect(mine.profile).toBeNull();
    expect(mine.completion.state).toBe("not-started");
    expect(mine.welcomeDue).toBe(true);
  });

  it("counts a profile from the old join form as complete, welcome not due", async () => {
    const user = await insertUser();
    await insertProfile(user.id);

    const mine = await callerFor(user.id).profiles.mine();

    expect(mine.completion.state).toBe("complete");
    expect(mine.welcomeDue).toBe(false);
    expect(mine.profile).toMatchObject({ phoneNumber: "+49 123 456789" });
    expect(mine.profile).not.toHaveProperty("bio");
  });

  it("rejects signed-out visitors", async () => {
    await expect(anonymousCaller().profiles.mine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("profiles.saveMine", () => {
  it("creates a profile from a single field", async () => {
    const user = await insertUser();

    const saved = await callerFor(user.id).profiles.saveMine({
      birthday: fullProfile.birthday,
    });

    expect(saved.completion).toMatchObject({ filled: 1, state: "incomplete" });
    expect(saved.welcomeDue).toBe(false);
    const [row] = await profilesOf(user.id);
    expect(row?.birthday).toEqual(fullProfile.birthday);
  });

  it("keeps fields it wasn't given", async () => {
    const user = await insertUser();
    const api = callerFor(user.id);
    await api.profiles.saveMine({ birthday: fullProfile.birthday });

    await api.profiles.saveMine({ phoneNumber: "+49 1" });

    const [row] = await profilesOf(user.id);
    expect(row).toMatchObject({
      birthday: fullProfile.birthday,
      phoneNumber: "+49 1",
    });
  });

  it("clears a field saved as an empty string", async () => {
    const user = await insertUser();
    await insertProfile(user.id);

    await callerFor(user.id).profiles.saveMine({ major: "" });

    const [row] = await profilesOf(user.id);
    expect(row?.major).toBeNull();
  });

  it("only ever writes the caller's own profile", async () => {
    const other = await insertUser();
    await insertProfile(other.id);
    const user = await insertUser();

    await callerFor(user.id).profiles.saveMine({
      major: "Physics",
      userId: other.id,
    } as never);

    const [otherRow] = await profilesOf(other.id);
    expect(otherRow?.major).toBe("Informatics");
    const [own] = await profilesOf(user.id);
    expect(own?.major).toBe("Physics");
  });

  it("stores one profile when two first saves arrive at once", async () => {
    const user = await insertUser();
    const api = callerFor(user.id);

    const results = await Promise.allSettled([
      api.profiles.saveMine({ major: "Physics" }),
      api.profiles.saveMine({ location: "Aachen" }),
    ]);

    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"]);
    expect(await profilesOf(user.id)).toHaveLength(1);
  });

  it("rejects signed-out visitors", async () => {
    await expect(
      anonymousCaller().profiles.saveMine({ major: "Physics" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("profiles.markWelcomeSeen", () => {
  it("stops the welcome step without creating a profile", async () => {
    const user = await insertUser();
    const api = callerFor(user.id);

    await api.profiles.markWelcomeSeen();

    expect((await api.profiles.mine()).welcomeDue).toBe(false);
    expect(await profilesOf(user.id)).toHaveLength(0);
    const [row] = await testDb
      .select({ welcomeSeenAt: users.welcomeSeenAt })
      .from(users)
      .where(eq(users.id, user.id));
    expect(row?.welcomeSeenAt).toBeInstanceOf(Date);
  });
});

describe("profiles.whatsappGroup", () => {
  it("is not configured until staff set a link", async () => {
    const user = await insertUser();
    await insertProfile(user.id);

    expect(await callerFor(user.id).profiles.whatsappGroup()).toEqual({
      configured: false,
      unlocked: true,
      url: null,
    });
  });

  it("keeps the link from an incomplete profile", async () => {
    const admin = await insertUser({ role: "mita" });
    await setSetting(SETTING_KEYS.whatsappGroupUrl, WHATSAPP, admin.id);
    const user = await insertUser();
    await insertProfile(user.id, { major: "Physics" });

    expect(await callerFor(user.id).profiles.whatsappGroup()).toEqual({
      configured: true,
      unlocked: false,
      url: null,
    });
  });

  it("gives the link to a complete profile", async () => {
    const admin = await insertUser({ role: "mita" });
    await setSetting(SETTING_KEYS.whatsappGroupUrl, WHATSAPP, admin.id);
    const user = await insertUser();
    await insertProfile(user.id);

    expect(await callerFor(user.id).profiles.whatsappGroup()).toEqual({
      configured: true,
      unlocked: true,
      url: WHATSAPP,
    });
  });

  it("rejects signed-out visitors", async () => {
    await expect(
      anonymousCaller().profiles.whatsappGroup()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("profiles.getUserProfiles", () => {
  it("joins each profile with its user's public columns for admins", async () => {
    const member = await insertUser({ email: "member", name: "Member" });
    await insertProfile(member.id);
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
    await insertProfile(member.id);
    const stranger = await insertUser({ name: "Stranger" });

    await expect(
      callerFor(stranger.id).profiles.getUserProfiles()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps the member directory from writers", async () => {
    const member = await insertUser();
    await insertProfile(member.id);
    const writer = await insertUser({ role: "writer" });

    await expect(
      callerFor(writer.id).profiles.getUserProfiles()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
