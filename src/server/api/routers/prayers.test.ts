import { describe, expect, it } from "vitest";
import { prayers } from "~/lib/db/schema/schema";
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

  it("rejects content longer than 50 characters with BAD_REQUEST", async () => {
    const api = await signedIn();

    await expect(
      api.prayers.addPrayer({ ...validPrayer, content: "x".repeat(51) })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
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
