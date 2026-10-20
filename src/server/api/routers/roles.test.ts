import { asc, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { profiles, roleChanges } from "~/lib/db/schema/schema";
import { getRole } from "~/server/authz";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

describe("role_changes", () => {
  it("always has a createdAt: defaulted, and NOT NULL in the migration", async () => {
    const mita = await insertUser({ role: "mita" });
    const member = await insertUser();
    await testDb
      .insert(roleChanges)
      .values({ fromRole: "member", toRole: "writer", userId: member.id });
    const [history] = await callerFor(mita.id).roles.getHistory({
      userId: member.id,
    });
    expect(history?.createdAt).toBeInstanceOf(Date);
    expect(history?.createdAt.getTime()).toBeGreaterThan(0);

    await expect(
      testDb.execute(
        sql`insert into role_changes ("createdAt", "fromRole", "toRole", "userId") values (null, 'member', 'writer', ${member.id})`
      )
    ).rejects.toThrow();
  });
});

describe("roles.setRole", () => {
  it("lets a mita make a member a writer and records who did it", async () => {
    const mita = await insertUser({ name: "Mia", role: "mita" });
    const member = await insertUser();
    await callerFor(mita.id).roles.setRole({
      role: "writer",
      userId: member.id,
    });
    expect(await getRole(member.id)).toBe("writer");
    expect(
      await callerFor(mita.id).roles.getHistory({ userId: member.id })
    ).toEqual([
      expect.objectContaining({
        changedByName: "Mia",
        fromRole: "member",
        toRole: "writer",
      }),
    ]);
  });

  it("never changes the owner, or makes anyone owner, even through the API", async () => {
    const mita = await insertUser({ role: "mita" });
    const owner = await insertUser({ role: "owner" });
    await expect(
      callerFor(mita.id).roles.setRole({ role: "member", userId: owner.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      callerFor(mita.id).roles.setRole({
        role: "owner" as never,
        userId: mita.id,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await getRole(owner.id)).toBe("owner");
    expect(await testDb.select().from(roleChanges)).toEqual([]);
  });

  it("reports an unknown user as not found", async () => {
    const mita = await insertUser({ role: "mita" });
    await expect(
      callerFor(mita.id).roles.setRole({ role: "writer", userId: "nobody" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns the current role and writes no history for a no-op change", async () => {
    const mita = await insertUser({ role: "mita" });
    const writer = await insertUser({ role: "writer" });
    expect(
      await callerFor(mita.id).roles.setRole({
        role: "writer",
        userId: writer.id,
      })
    ).toEqual({ role: "writer" });
    expect(await testDb.select().from(roleChanges)).toEqual([]);
  });

  it("records a legacy admin as mita in the history", async () => {
    const mita = await insertUser({ role: "mita" });
    const legacy = await insertUser({ role: "admin" });
    await callerFor(mita.id).roles.setRole({
      role: "member",
      userId: legacy.id,
    });
    expect(
      await callerFor(mita.id).roles.getHistory({ userId: legacy.id })
    ).toEqual([
      expect.objectContaining({ fromRole: "mita", toRole: "member" }),
    ]);
  });

  it.each(["writer", "member"] as const)("rejects a %s", async (role) => {
    const target = await insertUser();
    const api = callerFor((await insertUser({ role })).id);
    await expect(
      api.roles.setRole({ role: "writer", userId: target.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api.roles.getHistory({ userId: target.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects signed-out visitors", async () => {
    const target = await insertUser();
    await expect(
      anonymousCaller().roles.setRole({ role: "writer", userId: target.id })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("revokes access on the very next request", async () => {
    const a = await insertUser({ role: "mita" });
    const b = await insertUser({ role: "mita" });
    const api = callerFor(b.id);
    await api.roles.getHistory({ userId: a.id });
    await callerFor(a.id).roles.setRole({ role: "member", userId: b.id });
    await expect(api.roles.getHistory({ userId: a.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("keeps every history row when two mita change one person at once", async () => {
    const a = await insertUser({ role: "mita" });
    const b = await insertUser({ role: "mita" });
    const target = await insertUser();
    await Promise.all([
      callerFor(a.id).roles.setRole({ role: "writer", userId: target.id }),
      callerFor(b.id).roles.setRole({ role: "mita", userId: target.id }),
    ]);
    const rows = (
      await testDb
        .select()
        .from(roleChanges)
        .orderBy(asc(roleChanges.createdAt), asc(roleChanges.id))
    ).filter((row) => row.userId === target.id);
    expect(rows).toHaveLength(2);
    expect(rows.at(-1)?.toRole).toBe(await getRole(target.id));
    expect(rows.at(-1)?.fromRole).toBe(rows.at(0)?.toRole);
  });
});

describe("roles.myRole", () => {
  it("returns the normalized role of the caller", async () => {
    const legacy = await insertUser({ role: "admin" });
    const member = await insertUser();
    expect(await callerFor(legacy.id).roles.myRole()).toBe("mita");
    expect(await callerFor(member.id).roles.myRole()).toBe("member");
  });
});

describe("profiles.getUserProfiles", () => {
  it("shows the role in the member directory", async () => {
    const mita = await insertUser({ role: "mita" });
    const legacy = await insertUser({ role: "admin" });
    await testDb
      .insert(profiles)
      .values({ location: "Aachen", userId: legacy.id });
    const rows = await callerFor(mita.id).profiles.getUserProfiles();
    expect(rows.find((r) => r.user?.id === legacy.id)?.user?.role).toBe("mita");
  });
});
