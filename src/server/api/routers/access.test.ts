import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  accessRequests,
  roleChanges,
  roleInvites,
} from "~/lib/db/schema/schema";
import { getRole } from "~/server/authz";
import { claimInvite } from "~/server/invites";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("access.invite", () => {
  it("gives the role when that email first signs in, and records who invited", async () => {
    const mita = await insertUser({ name: "Mia", role: "mita" });
    const invite = await callerFor(mita.id).access.invite({
      email: "  New.Writer@Example.com ",
      role: "writer",
    });
    expect(invite).toMatchObject({
      email: "new.writer@example.com",
      role: "writer",
    });
    expect(invite.expiresAt.getTime() - Date.now()).toBeGreaterThan(
      29 * DAY_MS
    );

    const person = await insertUser({ email: "New.Writer@example.com" });
    expect(await claimInvite(person)).toBe("writer");
    expect(await getRole(person.id)).toBe("writer");
    expect(
      await callerFor(mita.id).roles.getHistory({ userId: person.id })
    ).toEqual([
      expect.objectContaining({
        changedByName: "Mia",
        fromRole: "member",
        source: "invite",
        toRole: "writer",
      }),
    ]);
    expect(await callerFor(mita.id).access.invites()).toEqual([]);
    // An invite is used once.
    expect(await claimInvite(person)).toBeNull();
  });

  it("never invites anyone as owner", async () => {
    const mita = await insertUser({ role: "mita" });
    await expect(
      callerFor(mita.id).access.invite({
        email: "a@example.com",
        role: "owner" as never,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses an email that already has an account", async () => {
    const mita = await insertUser({ role: "mita" });
    await insertUser({ email: "taken@example.com" });
    await expect(
      callerFor(mita.id).access.invite({
        email: "TAKEN@example.com",
        role: "writer",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("replaces an open invite for the same email", async () => {
    const mita = await insertUser({ role: "mita" });
    const api = callerFor(mita.id);
    await api.access.invite({ email: "a@example.com", role: "writer" });
    await api.access.invite({ email: "a@example.com", role: "mita" });
    expect(await api.access.invites()).toEqual([
      expect.objectContaining({ email: "a@example.com", role: "mita" }),
    ]);
    const person = await insertUser({ email: "a@example.com" });
    expect(await claimInvite(person)).toBe("mita");
  });

  it("does nothing once revoked or expired", async () => {
    const mita = await insertUser({ role: "mita" });
    const api = callerFor(mita.id);
    const revoked = await api.access.invite({
      email: "r@example.com",
      role: "writer",
    });
    await api.access.revokeInvite({ id: revoked.id });
    const expired = await api.access.invite({
      email: "e@example.com",
      role: "writer",
    });
    await testDb
      .update(roleInvites)
      .set({ expiresAt: new Date(Date.now() - DAY_MS) })
      .where(eq(roleInvites.id, expired.id));

    expect(await api.access.invites()).toEqual([]);
    const people = await Promise.all(
      ["r@example.com", "e@example.com"].map((email) => insertUser({ email }))
    );
    expect(await Promise.all(people.map(claimInvite))).toEqual([null, null]);
    expect(await Promise.all(people.map((p) => getRole(p.id)))).toEqual([
      "member",
      "member",
    ]);
    expect(await testDb.select().from(roleChanges)).toEqual([]);
  });

  it("ignores accounts without an email", async () => {
    expect(await claimInvite({ email: null, id: "x" })).toBeNull();
  });

  it.each(["writer", "member"] as const)(
    "is staff only: rejects a %s",
    async (role) => {
      const api = callerFor((await insertUser({ role })).id);
      await expect(
        api.access.invite({ email: "a@example.com", role: "writer" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(api.access.invites()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(api.access.requests()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    }
  );
});

describe("access.request", () => {
  it("lets a member ask to be a writer once; a mita approves it", async () => {
    const mita = await insertUser({ name: "Mia", role: "mita" });
    const member = await insertUser({ name: "Sam" });
    const api = callerFor(member.id);
    expect(await api.access.myRequest()).toBeNull();
    await api.access.request({ role: "writer" });
    await api.access.request({ role: "writer" });
    expect(await api.access.myRequest()).toMatchObject({
      role: "writer",
      status: "pending",
    });

    const [open, ...rest] = await callerFor(mita.id).access.requests();
    expect(rest).toEqual([]);
    expect(open).toMatchObject({ name: "Sam", role: "writer" });
    expect(open).not.toHaveProperty("hashedPassword");

    await callerFor(mita.id).access.decide({
      approve: true,
      id: open?.id ?? 0,
    });
    expect(await getRole(member.id)).toBe("writer");
    expect(await callerFor(mita.id).access.requests()).toEqual([]);
    expect(await api.access.myRequest()).toMatchObject({ status: "approved" });
    expect(
      await callerFor(mita.id).roles.getHistory({ userId: member.id })
    ).toEqual([
      expect.objectContaining({
        changedByName: "Mia",
        fromRole: "member",
        source: "request",
        toRole: "writer",
      }),
    ]);
  });

  it("records a decline in the role history without changing the role", async () => {
    const mita = await insertUser({ name: "Mia", role: "mita" });
    const member = await insertUser();
    await callerFor(member.id).access.request({ role: "writer" });
    const [open] = await callerFor(mita.id).access.requests();
    await callerFor(mita.id).access.decide({
      approve: false,
      id: open?.id ?? 0,
    });
    expect(await getRole(member.id)).toBe("member");
    expect(
      await callerFor(mita.id).roles.getHistory({ userId: member.id })
    ).toEqual([
      expect.objectContaining({
        changedByName: "Mia",
        source: "declined",
        toRole: "writer",
      }),
    ]);
    await expect(
      callerFor(mita.id).access.decide({ approve: true, id: open?.id ?? 0 })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await getRole(member.id)).toBe("member");
  });

  it("never lets members ask for mita or owner", async () => {
    const api = callerFor((await insertUser()).id);
    await expect(
      api.access.request({ role: "mita" as never })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api.access.request({ role: "owner" as never })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it.each(["writer", "mita", "owner"] as const)(
    "has nothing to ask for as a %s",
    async (role) => {
      const api = callerFor((await insertUser({ role })).id);
      await expect(
        api.access.request({ role: "writer" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  );

  it("doesn't demote someone who became mita before the request was approved", async () => {
    const mita = await insertUser({ role: "mita" });
    const member = await insertUser();
    await callerFor(member.id).access.request({ role: "writer" });
    await callerFor(mita.id).roles.setRole({ role: "mita", userId: member.id });
    const [open] = await testDb.select().from(accessRequests);
    await callerFor(mita.id).access.decide({
      approve: true,
      id: open?.id ?? 0,
    });
    expect(await getRole(member.id)).toBe("mita");
  });

  it("rejects signed-out visitors", async () => {
    await expect(
      anonymousCaller().access.request({ role: "writer" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
