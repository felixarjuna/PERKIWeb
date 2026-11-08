import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  libraryBooks,
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
  const { id } = await callerFor(mita.id).library.add({
    author: "C. S. Lewis",
    ownerId: null,
    title: "Mere Christianity",
  });
  return { ana, budi, id, mita };
};

const statusOf = async (id: number) => {
  const [row] = await testDb
    .select({ status: libraryBooks.status })
    .from(libraryBooks)
    .where(eq(libraryBooks.id, id));
  return row?.status;
};

describe("library lending", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is for signed-in members, and the librarian's tools for staff only", async () => {
    const { ana, id } = await setup();
    const anonymous = anonymousCaller().library;
    await expect(anonymous.borrow({ id })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(anonymous.mine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(anonymous.extend({ loanId: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    const member = callerFor(ana.id).library;
    await expect(member.markReturned({ id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(member.lend({ id, userId: ana.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      member.setDueOn({ dueOn: "2027-03-01", id, note: "" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lends a book for 30 days and refuses a second borrow", async () => {
    const { ana, budi, id } = await setup();
    await expect(callerFor(ana.id).library.borrow({ id })).resolves.toEqual({
      dueOn: "2026-12-07",
      loanId: expect.any(Number),
    });
    expect(await statusOf(id)).toBe("borrowed");

    await expect(
      callerFor(budi.id).library.borrow({ id })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("borrowed"),
    });
    await expect(callerFor(ana.id).library.borrow({ id })).rejects.toThrow();
    const loans = await testDb.select().from(libraryLoans);
    expect(loans).toHaveLength(1);
  });

  it("refuses a book that isn't on the shelf", async () => {
    const { ana, id, mita } = await setup();
    await callerFor(mita.id).library.withdraw({ id });
    await expect(
      callerFor(ana.id).library.borrow({ id })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("left"),
    });
    await expect(
      callerFor(ana.id).library.borrow({ id: 9999 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("shows other members only the due date, never the holder", async () => {
    const { ana, budi, id } = await setup();
    await callerFor(ana.id).library.borrow({ id });
    const [seen] = await callerFor(budi.id).library.list({});
    expect(seen?.state).toMatchObject({
      dueOn: "2026-12-07",
      kind: "borrowed",
      mine: false,
    });
    const sent = JSON.stringify(seen);
    expect(sent).not.toContain(ana.id);
    expect(sent).not.toContain("Ana");
    expect(await callerFor(budi.id).library.mine()).toEqual({
      holding: [],
      past: [],
      queue: [],
    });
  });

  it("lists the member's books with due date and extensions", async () => {
    const { ana, id } = await setup();
    const { loanId } = await callerFor(ana.id).library.borrow({ id });
    expect(await callerFor(ana.id).library.mine()).toEqual({
      holding: [
        {
          author: "C. S. Lewis",
          bookId: id,
          dueOn: "2026-12-07",
          extendRefusal: null,
          extensions: 0,
          loanId,
          overdue: false,
          title: "Mere Christianity",
        },
      ],
      past: [],
      queue: [],
    });
  });

  it("extends twice by 30 days, then refuses", async () => {
    const { ana, budi, id, mita } = await setup();
    const { loanId } = await callerFor(ana.id).library.borrow({ id });
    const member = callerFor(ana.id).library;
    await expect(
      callerFor(budi.id).library.extend({ loanId })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(member.extend({ loanId })).resolves.toEqual({
      dueOn: "2027-01-06",
    });
    await expect(member.extend({ loanId })).resolves.toEqual({
      dueOn: "2027-02-05",
    });
    await expect(member.extend({ loanId })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Already extended 2 times. Ask the librarian.",
    });
    const [held] = (await member.mine()).holding;
    expect(held).toMatchObject({
      dueOn: "2027-02-05",
      extendRefusal: "Already extended 2 times. Ask the librarian.",
      extensions: 2,
    });

    const history = await callerFor(mita.id).library.history({ id });
    expect(history.events.map((event) => event.type)).toEqual([
      "extended",
      "extended",
      "borrowed",
      "added",
    ]);
    expect(history.events[0]).toMatchObject({
      actor: "Ana Putri",
      details: { dueOn: "2027-02-05", from: "2027-01-06" },
    });
  });

  it("refuses an extension after the due date", async () => {
    const { ana, id } = await setup();
    const { loanId } = await callerFor(ana.id).library.borrow({ id });
    vi.setSystemTime(new Date("2026-12-08T11:00:00Z"));
    await expect(
      callerFor(ana.id).library.extend({ loanId })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "It's past the due date. Ask the librarian.",
    });
    const [held] = (await callerFor(ana.id).library.mine()).holding;
    expect(held?.overdue).toBe(true);
  });

  it("refuses an extension while someone waits", async () => {
    const { ana, budi, id } = await setup();
    const { loanId } = await callerFor(ana.id).library.borrow({ id });
    await testDb.insert(libraryQueue).values({ bookId: id, userId: budi.id });
    await expect(
      callerFor(ana.id).library.extend({ loanId })
    ).rejects.toMatchObject({ message: "Someone is waiting for this book." });
  });

  it("frees the book only when the librarian marks it returned", async () => {
    const { ana, budi, id, mita } = await setup();
    const staff = callerFor(mita.id).library;
    await expect(staff.markReturned({ id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await callerFor(ana.id).library.borrow({ id });
    await staff.markReturned({ id });
    expect(await statusOf(id)).toBe("available");

    const [loan] = await testDb.select().from(libraryLoans);
    expect(loan).toMatchObject({ returnedById: mita.id });
    expect(loan?.returnedAt).toBeInstanceOf(Date);

    const mine = await callerFor(ana.id).library.mine();
    expect(mine.holding).toEqual([]);
    expect(mine.past).toEqual([
      {
        author: "C. S. Lewis",
        borrowedAt: expect.any(Date),
        returnedAt: expect.any(Date),
        title: "Mere Christianity",
      },
    ]);

    await callerFor(budi.id).library.borrow({ id });
    const history = await staff.history({ id });
    expect(
      history.events.map((event) => [event.type, event.actor, event.subject])
    ).toEqual([
      ["borrowed", "Budi Santoso", "Budi Santoso"],
      ["returned", "Mita", "Ana Putri"],
      ["borrowed", "Ana Putri", "Ana Putri"],
      ["added", "Mita", null],
    ]);
  });

  it("lets staff lend by hand and extend past the limit", async () => {
    const { ana, budi, id, mita } = await setup();
    const staff = callerFor(mita.id).library;
    await staff.lend({ id, userId: ana.id });
    await expect(staff.lend({ id, userId: budi.id })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    const [borrowed] = await staff.manage({ state: "borrowed" });
    expect(borrowed).toMatchObject({
      dueOn: "2026-12-07",
      extensions: 0,
      holder: "Ana Putri",
    });

    await expect(
      staff.setDueOn({ dueOn: "2026-11-06", id, note: "" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    // A day that doesn't exist is a bad request, not a database error.
    await expect(
      staff.setDueOn({ dueOn: "2027-02-30", id, note: "" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await staff.setDueOn({ dueOn: "2027-04-01", id, note: "Long study" });
    const [loan] = await testDb.select().from(libraryLoans);
    expect(loan).toMatchObject({
      dueOn: "2027-04-01",
      extensions: 0,
      note: "Long study",
    });

    const history = await staff.history({ id });
    expect(history.events.slice(0, 2)).toMatchObject([
      {
        actor: "Mita",
        details: {
          dueOn: "2027-04-01",
          from: "2026-12-07",
          note: "Long study",
        },
        subject: "Ana Putri",
        type: "extended",
      },
      {
        actor: "Mita",
        details: { byHand: true, dueOn: "2026-12-07" },
        subject: "Ana Putri",
        type: "borrowed",
      },
    ]);
    await expect(staff.lend({ id, userId: "missing" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("lends by hand only to an existing member", async () => {
    const { id, mita } = await setup();
    await expect(
      callerFor(mita.id).library.lend({ id, userId: "missing" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      callerFor(mita.id).library.setDueOn({ dueOn: "2027-01-01", id, note: "" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("shows staff an overdue book under the overdue filter", async () => {
    const { ana, id, mita } = await setup();
    await callerFor(ana.id).library.borrow({ id });
    const staff = callerFor(mita.id).library;
    expect(await staff.manage({ state: "overdue" })).toEqual([]);
    vi.setSystemTime(new Date("2026-12-09T11:00:00Z"));
    expect(await staff.manage({ state: "overdue" })).toMatchObject([
      { holder: "Ana Putri", id, overdue: true },
    ]);
  });

  it("refuses to withdraw a book while it's borrowed", async () => {
    const { ana, id, mita } = await setup();
    const staff = callerFor(mita.id).library;
    await callerFor(ana.id).library.borrow({ id });
    await expect(staff.withdraw({ id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "This book is borrowed by a member. Mark it returned first.",
    });
    expect(await statusOf(id)).toBe("borrowed");
    await staff.markReturned({ id });
    await staff.withdraw({ id });
    expect(await statusOf(id)).toBe("withdrawn");
  });
});
