import { describe, expect, it } from "vitest";
import { prayers } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const validPrayer = { content: "Pray for my exams", isAnonymous: false };

/** A signed-in caller for a fresh user named `name` (a member by default). */
const signedIn = async (name = "Alice", role: "admin" | "member" = "member") =>
  callerFor((await insertUser({ name, role })).id);

const onlyPrayer = async () => {
  const rows = await testDb.select().from(prayers);
  expect(rows).toHaveLength(1);
  const [row] = rows;
  if (!row) {
    throw new Error("expected exactly one prayer");
  }
  return row;
};

describe("prayers router", () => {
  it("credits a new prayer to the signed-in user, with a zero count", async () => {
    const api = await signedIn("Alice Smith");

    await api.prayers.addPrayer(validPrayer);

    const [prayer] = await api.prayers.getPrayers();
    expect(prayer).toMatchObject({
      ...validPrayer,
      canManage: true,
      count: 0,
      name: "alicesmith",
      prayedByMe: false,
      prayerNames: [],
    });
    expect(prayer).not.toHaveProperty("authorId");
  });

  it("ignores a client-supplied name, count or prayer list", async () => {
    const api = await signedIn("Alice");

    await api.prayers.addPrayer({
      ...validPrayer,
      count: 99,
      name: "Bob",
      prayerNames: ["Mallory"],
    } as never);

    expect(await onlyPrayer()).toMatchObject({
      count: 0,
      name: "alice",
      prayerNames: [],
    });
  });

  it("hides an anonymous author's name from other members", async () => {
    const author = await signedIn("Alice");
    const other = await signedIn("Bob");
    const admin = await signedIn("Admin", "admin");
    await author.prayers.addPrayer({ ...validPrayer, isAnonymous: true });

    const [seenByOther] = await other.prayers.getPrayers();
    expect(seenByOther).toMatchObject({ canManage: false, name: null });
    const [seenByAuthor] = await author.prayers.getPrayers();
    expect(seenByAuthor).toMatchObject({ canManage: true, name: "alice" });
    const [seenByAdmin] = await admin.prayers.getPrayers();
    expect(seenByAdmin).toMatchObject({ canManage: true, name: "alice" });
  });

  it("lets the author edit content and anonymity only", async () => {
    const api = await signedIn("Alice");
    await api.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await api.prayers.updatePrayer({
      content: "Pray for my thesis",
      id,
      isAnonymous: true,
      name: "Bob",
    } as never);

    expect(await onlyPrayer()).toMatchObject({
      content: "Pray for my thesis",
      isAnonymous: true,
      name: "alice",
    });
  });

  it("forbids other members from editing or deleting a prayer", async () => {
    const author = await signedIn("Alice");
    const other = await signedIn("Bob");
    await author.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await expect(
      other.prayers.updatePrayer({ ...validPrayer, content: "Edited", id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(other.prayers.deletePrayer({ id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect((await onlyPrayer()).content).toBe(validPrayer.content);
  });

  it("lets admins edit and delete any prayer", async () => {
    const author = await signedIn("Alice");
    const admin = await signedIn("Admin", "admin");
    await author.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await admin.prayers.updatePrayer({ ...validPrayer, content: "Edited", id });
    expect((await onlyPrayer()).content).toBe("Edited");

    await admin.prayers.deletePrayer({ id });
    expect(await testDb.select().from(prayers)).toEqual([]);
  });

  it("lets only admins manage prayers written before authorship existed", async () => {
    await testDb
      .insert(prayers)
      .values({ content: "Old prayer", name: "alice", prayerNames: [] });
    const { id } = await onlyPrayer();
    const member = await signedIn("Alice");

    await expect(member.prayers.deletePrayer({ id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await (await signedIn("Admin", "admin")).prayers.deletePrayer({ id });
    expect(await testDb.select().from(prayers)).toEqual([]);
  });

  it("deletes the author's own prayer", async () => {
    const api = await signedIn();
    await api.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await api.prayers.deletePrayer({ id });

    expect(await api.prayers.getPrayers()).toEqual([]);
  });

  it("records who prays and keeps the count in step", async () => {
    const author = await signedIn("Alice");
    const bob = await signedIn("Bob");
    const carol = await signedIn("Carol");
    await author.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await bob.prayers.setPrayed({ id, prayed: true });
    await carol.prayers.setPrayed({ id, prayed: true });
    // Praying twice is idempotent.
    await bob.prayers.setPrayed({ id, prayed: true });

    expect(await onlyPrayer()).toMatchObject({
      count: 2,
      prayerNames: ["bob", "carol"],
    });
    const [seenByBob] = await bob.prayers.getPrayers();
    expect(seenByBob?.prayedByMe).toBe(true);

    await bob.prayers.setPrayed({ id, prayed: false });

    expect(await onlyPrayer()).toMatchObject({
      count: 1,
      prayerNames: ["carol"],
    });
  });

  it("keeps every concurrent prayer", async () => {
    const author = await signedIn("Alice");
    await author.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();
    const callers = await Promise.all(
      ["Bob", "Carol", "Dave", "Erin"].map((name) => signedIn(name))
    );

    await Promise.all(
      callers.map((api) => api.prayers.setPrayed({ id, prayed: true }))
    );

    const prayer = await onlyPrayer();
    expect(prayer.count).toBe(callers.length);
    expect((prayer.prayerNames as string[]).sort()).toEqual([
      "bob",
      "carol",
      "dave",
      "erin",
    ]);
  });

  it("returns NOT_FOUND when changing or deleting a missing prayer", async () => {
    const api = await signedIn();
    const calls = [
      api.prayers.updatePrayer({ ...validPrayer, id: 404 }),
      api.prayers.setPrayed({ id: 404, prayed: true }),
      api.prayers.deletePrayer({ id: 404 }),
    ];

    await Promise.all(
      calls.map((call) =>
        expect(call).rejects.toMatchObject({ code: "NOT_FOUND" })
      )
    );
  });

  it("rejects content shorter than 2 or longer than 50 characters with BAD_REQUEST", async () => {
    const api = await signedIn();

    await expect(
      api.prayers.addPrayer({ ...validPrayer, content: "x" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api.prayers.addPrayer({ ...validPrayer, content: "x".repeat(51) })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects every procedure for signed-out visitors", async () => {
    const api = anonymousCaller();
    const calls = [
      api.prayers.getPrayers(),
      api.prayers.addPrayer(validPrayer),
      api.prayers.updatePrayer({ ...validPrayer, id: 1 }),
      api.prayers.setPrayed({ id: 1, prayed: true }),
      api.prayers.deletePrayer({ id: 1 }),
    ];

    await Promise.all(
      calls.map((call) =>
        expect(call).rejects.toMatchObject({ code: "UNAUTHORIZED" })
      )
    );
  });
});
