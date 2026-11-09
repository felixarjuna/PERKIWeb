import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  libraryBooks,
  libraryHistory,
  libraryLoans,
  libraryQueue,
} from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

// Saturday 7 Nov 2026, noon in Aachen.
const NOW = new Date("2026-11-07T11:00:00Z");

const setup = async () => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  const mita = await insertUser({ name: "Mita", role: "mita" });
  const ana = await insertUser({ name: "Ana Putri" });
  const budi = await insertUser({ name: "Budi Santoso" });
  return { ana, budi, mita };
};

const book = {
  author: "C. S. Lewis",
  description: "",
  language: "en" as const,
  ownerId: null,
  title: "Mere Christianity",
};

describe("library", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is for signed-in members, and the shelf for staff only", async () => {
    const { ana } = await setup();
    await expect(anonymousCaller().library.list({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    const member = callerFor(ana.id).library;
    await expect(member.manage({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(member.add(book)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(member.update({ ...book, id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(member.withdraw({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(member.restore({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(member.history({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("lets staff add a member's book that members then find by part of the title", async () => {
    const { ana, budi, mita } = await setup();
    const staff = callerFor(mita.id).library;
    const { id } = await staff.add({ ...book, ownerId: budi.id });
    await staff.add({
      author: "Dietrich Bönhoeffer",
      ownerId: null,
      title: "The Cost of Discipleship",
    });

    const found = await callerFor(ana.id).library.list({ q: "MERE" });
    expect(found).toEqual([
      {
        addedAt: expect.any(Date),
        author: "C. S. Lewis",
        category: null,
        description: null,
        format: "physical",
        id,
        language: "en",
        publisher: null,
        state: {
          askName: null,
          dueOn: null,
          holdEndsOn: null,
          kind: "available",
          mine: false,
          overdue: false,
          position: null,
        },
        title: "Mere Christianity",
      },
    ]);
    // Accents don't matter, and the author is searched too.
    expect(
      (await callerFor(ana.id).library.list({ q: "bonhoeffer" })).map(
        (item) => item.title
      )
    ).toEqual(["The Cost of Discipleship"]);

    const [shelf] = await staff.manage({ q: "mere" });
    expect(shelf).toMatchObject({
      kind: "available",
      owner: { id: budi.id, name: "Budi Santoso" },
    });
  });

  it("never tells members who holds a book", async () => {
    const { ana, budi, mita } = await setup();
    const { id } = await callerFor(mita.id).library.add(book);
    await testDb
      .insert(libraryLoans)
      .values({ bookId: id, borrowerId: budi.id, dueOn: "2026-12-07" });

    const [seen] = await callerFor(ana.id).library.list({});
    expect(seen?.state).toEqual({
      askName: null,
      dueOn: "2026-12-07",
      holdEndsOn: null,
      kind: "borrowed",
      mine: false,
      overdue: false,
      position: null,
    });
    const sent = JSON.stringify(seen);
    expect(sent).not.toContain(budi.id);
    expect(sent).not.toContain("Budi");

    const [held] = await callerFor(budi.id).library.list({});
    expect(held?.state.mine).toBe(true);

    expect(await callerFor(ana.id).library.list({ show: "available" })).toEqual(
      []
    );
    const [out] = await callerFor(mita.id).library.manage({
      state: "borrowed",
    });
    expect(out).toMatchObject({ dueOn: "2026-12-07", holder: "Budi Santoso" });
  });

  it("sorts what can be taken first", async () => {
    const { ana, budi, mita } = await setup();
    const staff = callerFor(mita.id).library;
    const lent = await staff.add({ ...book, title: "A borrowed book" });
    await staff.add({ ...book, title: "Zephaniah notes" });
    await testDb
      .insert(libraryLoans)
      .values({ bookId: lent.id, borrowerId: budi.id, dueOn: "2026-12-07" });
    const titles = async (sort: "available" | "title") =>
      (await callerFor(ana.id).library.list({ sort })).map(
        (item) => item.title
      );
    expect(await titles("available")).toEqual([
      "Zephaniah notes",
      "A borrowed book",
    ]);
    expect(await titles("title")).toEqual([
      "A borrowed book",
      "Zephaniah notes",
    ]);
  });

  it("takes a language from the list, or none, never free text", async () => {
    const { ana, mita } = await setup();
    const staff = callerFor(mita.id).library;
    await expect(
      staff.add({ ...book, language: "Indonesian" } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      callerFor(ana.id).library.offer({
        author: "A",
        language: "German",
        title: "B",
      } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const { id } = await staff.add({ ...book, language: null });
    await expect(
      staff.update({ ...book, id, language: "fr" } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await staff.update({ ...book, id, language: "de" });
    expect(await staff.manage({})).toMatchObject([{ id, language: "de" }]);
    await staff.update({ ...book, id, language: null });
    expect(await staff.manage({})).toMatchObject([{ id, language: null }]);
  });

  it("hides withdrawn books by default, keeps their history and brings them back", async () => {
    const { ana, mita } = await setup();
    const staff = callerFor(mita.id).library;
    const { id } = await staff.add(book);
    await staff.update({ ...book, id, language: "id" });
    await staff.withdraw({ id });

    expect(await callerFor(ana.id).library.list({ q: "mere" })).toEqual([]);
    expect(await staff.manage({})).toEqual([]);
    expect(await staff.manage({ state: "withdrawn" })).toMatchObject([
      { id, kind: "withdrawn" },
    ]);
    await expect(staff.withdraw({ id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    const history = await staff.history({ id });
    expect(history.title).toBe("Mere Christianity");
    expect(history.events.map((event) => [event.type, event.actor])).toEqual([
      ["withdrawn", "Mita"],
      ["edited", "Mita"],
      ["added", "Mita"],
    ]);
    expect(history.events[1]?.details).toEqual({ changed: ["language"] });

    await staff.restore({ id });
    expect(
      (await callerFor(ana.id).library.list({ q: "mere" })).map(
        (item) => item.state.kind
      )
    ).toEqual(["available"]);
    const events = await testDb.select().from(libraryHistory);
    expect(events.map((event) => event.type)).toContain("restored");
  });

  it("brings a book back as borrowed while its loan is still open", async () => {
    const { budi, mita } = await setup();
    const staff = callerFor(mita.id).library;
    const { id } = await staff.add(book);
    await staff.withdraw({ id });
    // A loan left open on a withdrawn book (withdraw now refuses that).
    await testDb
      .insert(libraryLoans)
      .values({ bookId: id, borrowerId: budi.id, dueOn: "2026-12-07" });
    await expect(staff.restore({ id })).resolves.toEqual({
      id,
      status: "borrowed",
    });
    const [row] = await testDb.select().from(libraryBooks);
    expect(row?.status).toBe("borrowed");
  });

  it("logs an edit only when something changed, naming a new owner", async () => {
    const { budi, mita } = await setup();
    const staff = callerFor(mita.id).library;
    const { id } = await staff.add(book);
    await staff.update({ ...book, id });
    await staff.update({ ...book, id, ownerId: budi.id });
    const history = await staff.history({ id });
    expect(history.events.map((event) => [event.type, event.subject])).toEqual([
      ["edited", "Budi Santoso"],
      ["added", null],
    ]);
    await expect(
      staff.update({ ...book, id, ownerId: "missing" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("allows one open loan and one place in line per member per book", async () => {
    const { ana, budi, mita } = await setup();
    const { id } = await callerFor(mita.id).library.add(book);
    await testDb
      .insert(libraryLoans)
      .values({ bookId: id, borrowerId: budi.id, dueOn: "2026-12-07" });
    await expect(
      testDb
        .insert(libraryLoans)
        .values({ bookId: id, borrowerId: ana.id, dueOn: "2026-12-07" })
    ).rejects.toThrow();
    await testDb.insert(libraryQueue).values({ bookId: id, userId: ana.id });
    await expect(
      testDb.insert(libraryQueue).values({ bookId: id, userId: ana.id })
    ).rejects.toThrow();
  });

  it("lists ebooks with whom to ask, and refuses to lend them", async () => {
    const { ana, budi, mita } = await setup();
    const staff = callerFor(mita.id).library;
    const shared = await staff.add({
      ...book,
      format: "ebook",
      ownerId: budi.id,
      title: "Shared Ebook",
    });
    const perki = await staff.add({
      ...book,
      format: "ebook",
      title: "PERKI Ebook",
    });
    const member = callerFor(ana.id).library;
    const list = await member.list({ sort: "title" });
    expect(
      list.map((item) => ({
        askName: item.state.askName,
        format: item.format,
        kind: item.state.kind,
        title: item.title,
      }))
    ).toEqual([
      { askName: null, format: "ebook", kind: "ebook", title: "PERKI Ebook" },
      {
        askName: "Budi Santoso",
        format: "ebook",
        kind: "ebook",
        title: "Shared Ebook",
      },
    ]);
    const refused = { message: "Ebooks aren't lent from the shelf." };
    await expect(member.borrow({ id: shared.id })).rejects.toMatchObject(
      refused
    );
    await expect(member.joinQueue({ id: perki.id })).rejects.toMatchObject(
      refused
    );
    await expect(
      staff.lend({ id: shared.id, userId: ana.id })
    ).rejects.toMatchObject(refused);
    await expect(staff.markReturned({ id: shared.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(await member.list({ show: "available" })).toEqual([]);
    const [stored] = await testDb
      .select({ status: libraryBooks.status })
      .from(libraryBooks)
      .where(eq(libraryBooks.id, shared.id));
    expect(stored?.status).toBe("available");
  });

  it("never names a physical book's owner to members", async () => {
    const { ana, budi, mita } = await setup();
    await callerFor(mita.id).library.add({
      ...book,
      ownerId: budi.id,
      publisher: "HarperOne",
    });
    const [listed] = await callerFor(ana.id).library.list({});
    expect(listed?.state.askName).toBeNull();
    expect(listed?.publisher).toBe("HarperOne");
    expect(JSON.stringify(listed)).not.toContain(budi.id);
    expect(JSON.stringify(listed)).not.toContain("Budi");
  });

  it("won't turn a borrowed book into an ebook", async () => {
    const { ana, mita } = await setup();
    const staff = callerFor(mita.id).library;
    const { id } = await staff.add(book);
    await staff.lend({ id, userId: ana.id });
    await expect(
      staff.update({ ...book, format: "ebook", id })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("lists the categories in use, A to Z", async () => {
    const { ana, mita } = await setup();
    const staff = callerFor(mita.id).library;
    await staff.add({ ...book, category: "Theology" });
    await staff.add({ ...book, category: "apologetics" });
    await staff.add({ ...book, category: "Theology", title: "Again" });
    await staff.add({ ...book, title: "No category" });
    expect(await callerFor(ana.id).library.categories()).toEqual([
      "apologetics",
      "Theology",
    ]);
    await expect(
      callerFor(ana.id).library.offer({
        ...book,
        category: "Biography",
        format: "ebook",
        publisher: " IVP ",
      })
    ).resolves.toMatchObject({ id: expect.any(Number) });
    const offered = await testDb
      .select()
      .from(libraryBooks)
      .where(eq(libraryBooks.ownerId, ana.id));
    expect(offered[0]).toMatchObject({
      category: "Biography",
      format: "ebook",
      publisher: "IVP",
      status: "offered",
    });
  });
});
