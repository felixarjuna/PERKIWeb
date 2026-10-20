import { describe, expect, it } from "vitest";
import { prayers } from "~/lib/db/schema/schema";
import { PRAYER_MAX_LENGTH } from "~/server/api/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const validPrayer = { content: "Pray for my exams", isAnonymous: false };

/** A signed-in caller for a fresh user named `name` (a member by default). */
const signedIn = async (name = "Alice", role: "admin" | "member" = "member") =>
  callerFor((await insertUser({ name, role })).id);

/** A signed-in caller plus the id of their new user. */
const signedInUser = async (name: string) => {
  const user = await insertUser({ name });
  return { api: callerFor(user.id), id: user.id };
};

const onlyPrayer = async () => {
  const rows = await testDb.select().from(prayers);
  expect(rows).toHaveLength(1);
  const [row] = rows;
  if (!row) {
    throw new Error("expected exactly one prayer");
  }
  return row;
};

/** Adds a prayer as a fresh author and publishes it as a fresh admin. */
const publishedPrayer = async (prayer = validPrayer) => {
  const author = await signedIn("Alice");
  const admin = await signedIn("Admin", "admin");
  await author.prayers.addPrayer(prayer);
  const { id } = await onlyPrayer();
  await admin.prayers.setPrayerVisibility({ id, visibility: "published" });
  return { admin, author, id };
};

describe("prayers router: authorship", () => {
  it("credits a new private prayer to the signed-in user, with a zero count", async () => {
    const api = await signedIn("Alice Smith");

    await api.prayers.addPrayer(validPrayer);

    expect(await onlyPrayer()).toMatchObject({
      ...validPrayer,
      count: 0,
      name: "alicesmith",
      prayerNames: [],
      visibility: "private",
    });
  });

  it("ignores a client-supplied name, count, prayer list or visibility", async () => {
    const api = await signedIn("Alice");

    await api.prayers.addPrayer({
      ...validPrayer,
      count: 99,
      name: "Bob",
      prayerNames: ["Mallory"],
      visibility: "published",
    } as never);

    expect(await onlyPrayer()).toMatchObject({
      count: 0,
      name: "alice",
      prayerNames: [],
      visibility: "private",
    });
  });

  it("lists only the author's own requests, private or published", async () => {
    const alice = await signedIn("Alice");
    const bob = await signedIn("Bob");
    await alice.prayers.addPrayer(validPrayer);
    await bob.prayers.addPrayer({ ...validPrayer, content: "Bob's request" });

    const own = await alice.prayers.getOwnPrayers();
    expect(own).toHaveLength(1);
    expect(own[0]).toMatchObject({
      content: validPrayer.content,
      visibility: "private",
    });
    expect(own[0]).not.toHaveProperty("authorId");
    expect(own[0]).not.toHaveProperty("prayerNames");
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

  it("sends an author's edit of a published prayer back to review", async () => {
    const { admin, author, id } = await publishedPrayer();

    await author.prayers.updatePrayer({ ...validPrayer, content: "New", id });
    expect((await onlyPrayer()).visibility).toBe("private");

    await admin.prayers.setPrayerVisibility({ id, visibility: "published" });
    await admin.prayers.updatePrayer({ ...validPrayer, content: "Fixed", id });
    expect(await onlyPrayer()).toMatchObject({
      content: "Fixed",
      visibility: "published",
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

    expect(await api.prayers.getOwnPrayers()).toEqual([]);
  });
});

describe("prayers router: review and the public wall", () => {
  it("keeps the review list and publishing admin-only", async () => {
    const member = await signedIn("Alice");
    await member.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await expect(member.prayers.getPrayers()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      member.prayers.setPrayerVisibility({ id, visibility: "published" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await onlyPrayer()).visibility).toBe("private");

    const admin = await signedIn("Admin", "admin");
    const [listed] = await admin.prayers.getPrayers();
    expect(listed).toMatchObject({ content: validPrayer.content, id });
    expect(listed).not.toHaveProperty("authorId");
  });

  it("shows only published prayers, with safe fields, on the public wall", async () => {
    const { admin, id } = await publishedPrayer();
    await testDb.update(prayers).set({ prayerNames: ["Private participant"] });

    const publicRows = await anonymousCaller().prayers.getPublishedPrayers();
    expect(publicRows).toHaveLength(1);
    expect(publicRows.at(0)).not.toHaveProperty("prayerNames");
    expect(publicRows.at(0)).not.toHaveProperty("authorId");

    await admin.prayers.setPrayerVisibility({ id, visibility: "private" });
    expect(await anonymousCaller().prayers.getPublishedPrayers()).toEqual([]);
  });

  it("hides an anonymous author's name on the public wall", async () => {
    await publishedPrayer({ ...validPrayer, isAnonymous: true });

    expect(
      (await anonymousCaller().prayers.getPublishedPrayers()).at(0)?.name
    ).toBeNull();
    // Admins reviewing it still see who wrote it.
    const reviewer = await signedIn("Reviewer", "admin");
    const [reviewed] = await reviewer.prayers.getPrayers();
    expect(reviewed?.name).toBe("alice");
  });
});

describe("prayers router: praying together", () => {
  it("records who prays by user id, idempotently, only on published prayers", async () => {
    const author = await signedIn("Alice");
    await author.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();
    const bob = await signedInUser("Bob");
    const carol = await signedInUser("Carol");

    await expect(
      bob.api.prayers.acknowledgePrayer({ id, pressed: true })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const admin = await signedIn("Admin", "admin");
    await admin.prayers.setPrayerVisibility({ id, visibility: "published" });
    await bob.api.prayers.acknowledgePrayer({ id, pressed: true });
    await carol.api.prayers.acknowledgePrayer({ id, pressed: true });
    // Praying twice is idempotent.
    await bob.api.prayers.acknowledgePrayer({ id, pressed: true });

    const prayed = await onlyPrayer();
    expect(prayed.count).toBe(2);
    expect((prayed.prayerNames as string[]).sort()).toEqual(
      [bob.id, carol.id].sort()
    );
    expect(await bob.api.prayers.getOwnPrayerAcknowledgements()).toEqual([id]);
    expect(await author.prayers.getOwnPrayerAcknowledgements()).toEqual([]);

    await bob.api.prayers.acknowledgePrayer({ id, pressed: false });
    expect(await onlyPrayer()).toMatchObject({
      count: 1,
      prayerNames: [carol.id],
    });
  });

  it("replaces a legacy username entry instead of counting the person twice", async () => {
    const { id } = await publishedPrayer();
    await testDb.update(prayers).set({ count: 1, prayerNames: ["bob"] });
    const bob = await signedInUser("Bob");

    expect(await bob.api.prayers.getOwnPrayerAcknowledgements()).toEqual([id]);
    await bob.api.prayers.acknowledgePrayer({ id, pressed: true });

    expect(await onlyPrayer()).toMatchObject({
      count: 1,
      prayerNames: [bob.id],
    });
  });

  it("keeps every concurrent prayer", async () => {
    const { id } = await publishedPrayer();
    const callers = await Promise.all(
      ["Bob", "Carol", "Dave", "Erin"].map((name) => signedInUser(name))
    );

    await Promise.all(
      callers.map(({ api }) =>
        api.prayers.acknowledgePrayer({ id, pressed: true })
      )
    );

    const prayer = await onlyPrayer();
    expect(prayer.count).toBe(callers.length);
    expect((prayer.prayerNames as string[]).sort()).toEqual(
      callers.map((caller) => caller.id).sort()
    );
  });
});

describe("prayers router: validation and access", () => {
  it("returns NOT_FOUND when changing or deleting a missing prayer", async () => {
    const api = await signedIn();
    const admin = await signedIn("Admin", "admin");
    const calls = [
      api.prayers.updatePrayer({ ...validPrayer, id: 404 }),
      api.prayers.acknowledgePrayer({ id: 404, pressed: true }),
      api.prayers.deletePrayer({ id: 404 }),
      admin.prayers.setPrayerVisibility({ id: 404, visibility: "published" }),
    ];

    await Promise.all(
      calls.map((call) =>
        expect(call).rejects.toMatchObject({ code: "NOT_FOUND" })
      )
    );
  });

  it(`accepts ${PRAYER_MAX_LENGTH} characters and rejects 1 or ${PRAYER_MAX_LENGTH + 1}`, async () => {
    const api = await signedIn();

    await api.prayers.addPrayer({
      ...validPrayer,
      content: "x".repeat(PRAYER_MAX_LENGTH),
    });
    await expect(
      api.prayers.addPrayer({ ...validPrayer, content: "x" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api.prayers.addPrayer({
        ...validPrayer,
        content: "x".repeat(PRAYER_MAX_LENGTH + 1),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await testDb.select().from(prayers)).toHaveLength(1);
  });

  it("rejects every private procedure for signed-out visitors", async () => {
    const api = anonymousCaller();
    const calls = [
      api.prayers.getPrayers(),
      api.prayers.getOwnPrayers(),
      api.prayers.getOwnPrayerAcknowledgements(),
      api.prayers.addPrayer(validPrayer),
      api.prayers.updatePrayer({ ...validPrayer, id: 1 }),
      api.prayers.acknowledgePrayer({ id: 1, pressed: true }),
      api.prayers.setPrayerVisibility({ id: 1, visibility: "published" }),
      api.prayers.deletePrayer({ id: 1 }),
    ];

    await Promise.all(
      calls.map((call) =>
        expect(call).rejects.toMatchObject({ code: "UNAUTHORIZED" })
      )
    );
  });
});
