import { describe, expect, it } from "vitest";
import { prayers } from "~/lib/db/schema/schema";
import { PRAYER_MAX_LENGTH } from "~/server/api/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

const validPrayer = {
  content: "Pray for my exams",
  isAnonymous: false,
  name: "Alice",
  prayerNames: [],
};

const signedIn = async () => callerFor((await insertUser()).id);

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
  it("acknowledges a published prayer idempotently and returns only the current user's IDs", async () => {
    const first = await signedIn();
    const second = await signedIn();
    await first.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();
    await expect(
      first.prayers.acknowledgePrayer({ id, pressed: true })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await first.prayers.setPrayerVisibility({ id, visibility: "published" });
    await first.prayers.acknowledgePrayer({ id, pressed: true });
    await first.prayers.acknowledgePrayer({ id, pressed: true });
    expect((await onlyPrayer()).count).toBe(1);
    expect(await first.prayers.getOwnPrayerAcknowledgements()).toEqual([id]);
    expect(await second.prayers.getOwnPrayerAcknowledgements()).toEqual([]);
    await second.prayers.acknowledgePrayer({ id, pressed: true });
    expect((await onlyPrayer()).count).toBe(2);
    await first.prayers.acknowledgePrayer({ id, pressed: false });
    expect((await onlyPrayer()).count).toBe(1);
    expect(await first.prayers.getOwnPrayerAcknowledgements()).toEqual([]);
    await expect(
      anonymousCaller().prayers.acknowledgePrayer({ id, pressed: true })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("keeps new prayers private and exposes only published safe fields", async () => {
    const api = await signedIn();
    await api.prayers.addPrayer({
      ...validPrayer,
      prayerNames: ["Private participant"],
    });
    const { id } = await onlyPrayer();
    expect(await anonymousCaller().prayers.getPublishedPrayers()).toEqual([]);
    await api.prayers.setPrayerVisibility({ id, visibility: "published" });
    const publicRows = await anonymousCaller().prayers.getPublishedPrayers();
    expect(publicRows).toHaveLength(1);
    expect(publicRows.at(0)).not.toHaveProperty("prayerNames");
    await api.prayers.setPrayerVisibility({ id, visibility: "private" });
    expect(await anonymousCaller().prayers.getPublishedPrayers()).toEqual([]);
  });

  it("masks anonymous authors and rejects anonymous publication", async () => {
    const api = await signedIn();
    await api.prayers.addPrayer({ ...validPrayer, isAnonymous: true });
    const { id } = await onlyPrayer();
    await expect(
      anonymousCaller().prayers.setPrayerVisibility({
        id,
        visibility: "published",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await api.prayers.setPrayerVisibility({ id, visibility: "published" });
    expect(
      (await anonymousCaller().prayers.getPublishedPrayers()).at(0)?.name
    ).toBeNull();
  });
  it("adds a prayer with a zero count and lists it", async () => {
    const api = await signedIn();

    await api.prayers.addPrayer(validPrayer);

    const list = await api.prayers.getPrayers();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ ...validPrayer, count: 0 });
  });

  it("stores anonymous prayers without a name", async () => {
    const api = await signedIn();

    await api.prayers.addPrayer({
      content: "Pray for my family",
      isAnonymous: true,
      prayerNames: [],
    });

    expect(await onlyPrayer()).toMatchObject({
      isAnonymous: true,
      name: null,
    });
  });

  it("updates a prayer's content", async () => {
    const api = await signedIn();
    await api.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await api.prayers.updatePrayer({
      ...validPrayer,
      content: "Pray for my thesis",
      id,
    });

    expect((await onlyPrayer()).content).toBe("Pray for my thesis");
  });

  it("updates the prayer count and who prayed", async () => {
    const api = await signedIn();
    await api.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await api.prayers.updatePrayerCount({
      count: 2,
      id,
      prayerNames: ["Bob", "Carol"],
    });

    expect(await onlyPrayer()).toMatchObject({
      content: validPrayer.content,
      count: 2,
      prayerNames: ["Bob", "Carol"],
    });
  });

  it("deletes a prayer", async () => {
    const api = await signedIn();
    await api.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await api.prayers.deletePrayer({ id });

    expect(await api.prayers.getPrayers()).toEqual([]);
  });

  it("rejects content shorter than 2 characters with BAD_REQUEST", async () => {
    const api = await signedIn();

    await expect(
      api.prayers.addPrayer({ ...validPrayer, content: "x" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await testDb.select().from(prayers)).toEqual([]);
  });

  it("accepts 280 characters and rejects 281 with BAD_REQUEST", async () => {
    const api = await signedIn();

    await api.prayers.addPrayer({
      ...validPrayer,
      content: "x".repeat(PRAYER_MAX_LENGTH),
    });
    await expect(
      api.prayers.addPrayer({
        ...validPrayer,
        content: "x".repeat(PRAYER_MAX_LENGTH + 1),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await testDb.select().from(prayers)).toHaveLength(1);
  });

  it("rejects a non-numeric count with BAD_REQUEST", async () => {
    const api = await signedIn();

    await expect(
      api.prayers.updatePrayerCount({
        count: "1",
        id: 1,
        prayerNames: [],
      } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects every procedure for signed-out visitors", async () => {
    const api = anonymousCaller();
    const calls = [
      api.prayers.getPrayers(),
      api.prayers.addPrayer(validPrayer),
      api.prayers.updatePrayer({ ...validPrayer, id: 1 }),
      api.prayers.updatePrayerCount({ count: 1, id: 1, prayerNames: [] }),
      api.prayers.deletePrayer({ id: 1 }),
    ];

    await Promise.all(
      calls.map((call) =>
        expect(call).rejects.toMatchObject({ code: "UNAUTHORIZED" })
      )
    );
  });

  // Prayers have no owner column, so ownership cannot be enforced: any
  // signed-in account can edit or delete a prayer someone else posted. This
  // pins the current behaviour so a future ownership check is a conscious
  // change (see the test report for the security note).
  it("currently lets any signed-in user edit and delete anyone's prayer", async () => {
    const author = await signedIn();
    const other = await signedIn();
    await author.prayers.addPrayer(validPrayer);
    const { id } = await onlyPrayer();

    await other.prayers.updatePrayer({ ...validPrayer, content: "Edited", id });
    expect((await onlyPrayer()).content).toBe("Edited");

    await other.prayers.deletePrayer({ id });
    expect(await testDb.select().from(prayers)).toEqual([]);
  });
});
