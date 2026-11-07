import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { libraryBooks, libraryReservations } from "~/lib/db/schema/schema";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";
import { testDb } from "~/test/db";

// Saturday 7 Nov 2026, noon in Aachen.
const NOW = new Date("2026-11-07T11:00:00Z");
const DAY_MS = 86_400_000;

const provider = vi.fn();

const setup = async () => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  const mita = await insertUser({ name: "Mita", role: "mita" });
  const ana = await insertUser({ name: "Ana Putri" });
  const budi = await insertUser({ name: "Budi Santoso" });
  const citra = await insertUser({ name: "Citra Dewi" });
  const { id } = await callerFor(mita.id).library.add({
    author: "C. S. Lewis",
    ownerId: null,
    title: "Mere Christianity",
  });
  return { ana, budi, citra, id, mita };
};

/** Ana borrows the book; Budi, then Citra, join the queue. */
const borrowedWithQueue = async () => {
  const people = await setup();
  const { loanId } = await callerFor(people.ana.id).library.borrow({
    id: people.id,
  });
  await callerFor(people.budi.id).library.joinQueue({ id: people.id });
  vi.setSystemTime(NOW.getTime() + 60_000);
  await callerFor(people.citra.id).library.joinQueue({ id: people.id });
  return { ...people, loanId };
};

const stateFor = async (userId: string, id: number) => {
  const books = await callerFor(userId).library.list({});
  return books.find((book) => book.id === id)?.state;
};

const statusOf = async (id: number) => {
  const [row] = await testDb
    .select({ status: libraryBooks.status })
    .from(libraryBooks)
    .where(eq(libraryBooks.id, id));
  return row?.status;
};

const reservationsOf = (bookId: number) =>
  testDb
    .select()
    .from(libraryReservations)
    .where(eq(libraryReservations.bookId, bookId))
    .orderBy(libraryReservations.id);

describe("library queue", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", provider);
    provider.mockReset();
    provider.mockResolvedValue(Response.json({ id: "email-1" }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("is for signed-in members, and cancelling and accepting for staff only", async () => {
    const { ana, id } = await setup();
    const anonymous = anonymousCaller().library;
    await expect(anonymous.joinQueue({ id })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(anonymous.leaveQueue({ id })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      anonymous.offer({ author: "A", title: "B" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.myLentBooks()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    const member = callerFor(ana.id).library;
    await expect(member.accept({ id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      member.cancelReservation({ reservationId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("queues members behind the holder in the order they joined", async () => {
    const { ana, budi, citra, id } = await borrowedWithQueue();
    expect(await stateFor(budi.id, id)).toMatchObject({
      kind: "borrowed",
      position: 1,
    });
    expect(await stateFor(citra.id, id)).toMatchObject({ position: 2 });
    expect(await stateFor(ana.id, id)).toMatchObject({
      mine: true,
      position: null,
    });

    const mine = await callerFor(citra.id).library.mine();
    expect(mine.queue).toEqual([
      {
        author: "C. S. Lewis",
        bookId: id,
        holdEndsOn: null,
        position: 2,
        title: "Mere Christianity",
      },
    ]);

    await callerFor(budi.id).library.leaveQueue({ id });
    expect(await stateFor(citra.id, id)).toMatchObject({ position: 1 });
    expect(await stateFor(budi.id, id)).toMatchObject({ position: null });
    await expect(
      callerFor(budi.id).library.leaveQueue({ id })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses joining twice, the holder, and a book on the shelf", async () => {
    const { ana, budi, id, mita } = await borrowedWithQueue();
    await expect(
      callerFor(budi.id).library.joinQueue({ id })
    ).rejects.toMatchObject({
      message: "You're already in line for this book.",
    });
    await expect(
      callerFor(ana.id).library.joinQueue({ id })
    ).rejects.toMatchObject({ message: "You have this book." });
    const { id: free } = await callerFor(mita.id).library.add({
      author: "Henri Nouwen",
      ownerId: null,
      title: "The Return of the Prodigal Son",
    });
    await expect(
      callerFor(budi.id).library.joinQueue({ id: free })
    ).rejects.toMatchObject({ message: "It's on the shelf. Borrow it there." });
  });

  it("refuses the holder's extension while someone waits, with the reason", async () => {
    const { ana, loanId } = await borrowedWithQueue();
    const [held] = (await callerFor(ana.id).library.mine()).holding;
    expect(held?.extendRefusal).toBe("Someone is waiting for this book.");
    await expect(
      callerFor(ana.id).library.extend({ loanId })
    ).rejects.toMatchObject({ message: "Someone is waiting for this book." });
  });

  it("holds a returned book 7 days for the first in line, who borrows it", async () => {
    const { ana, budi, citra, id, mita } = await borrowedWithQueue();
    await callerFor(mita.id).library.markReturned({ id });
    expect(await statusOf(id)).toBe("reserved");
    const [first, second] = await reservationsOf(id);
    expect(first).toMatchObject({
      expiresOn: "2026-11-14",
      status: "ready",
      userId: budi.id,
    });
    expect(first?.readyAt).toBeInstanceOf(Date);
    expect(second).toMatchObject({ status: "waiting", userId: citra.id });

    expect(await stateFor(budi.id, id)).toMatchObject({
      holdEndsOn: "2026-11-14",
      kind: "reserved",
      mine: true,
    });
    expect((await callerFor(budi.id).library.mine()).queue).toEqual([
      expect.objectContaining({ holdEndsOn: "2026-11-14", position: null }),
    ]);
    // Nobody else can take it, not even its last holder.
    for (const other of [ana, citra]) {
      // biome-ignore lint/performance/noAwaitInLoops: one borrow at a time.
      await expect(
        callerFor(other.id).library.borrow({ id })
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "This book is held for the next in line.",
      });
    }

    await expect(callerFor(budi.id).library.borrow({ id })).resolves.toEqual({
      dueOn: "2026-12-07",
      loanId: expect.any(Number),
    });
    expect((await reservationsOf(id))[0]?.status).toBe("fulfilled");
    expect(await statusOf(id)).toBe("borrowed");
    expect(await stateFor(citra.id, id)).toMatchObject({ position: 1 });

    const history = await callerFor(mita.id).library.history({ id });
    expect(history.events.map((event) => event.type)).toEqual([
      "borrowed",
      "fulfilled",
      "ready",
      "returned",
      "queued",
      "queued",
      "borrowed",
      "added",
    ]);
    expect(history.queue).toEqual([
      {
        expiresOn: null,
        id: expect.any(Number),
        name: "Citra Dewi",
        position: 1,
        status: "waiting",
      },
    ]);
  });

  it("passes a run-out hold to the next in line when the book is next read", async () => {
    const { budi, citra, id, mita } = await borrowedWithQueue();
    await callerFor(mita.id).library.markReturned({ id });
    // Budi's hold ends on the 14th; on the 15th it's Citra's turn.
    vi.setSystemTime(NOW.getTime() + 8 * DAY_MS);
    expect(await stateFor(citra.id, id)).toMatchObject({
      holdEndsOn: "2026-11-22",
      kind: "reserved",
      mine: true,
    });
    const [first, second] = await reservationsOf(id);
    expect(first?.status).toBe("expired");
    expect(second).toMatchObject({ expiresOn: "2026-11-22", status: "ready" });
    await expect(
      callerFor(budi.id).library.borrow({ id })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    // Nobody after Citra: once hers runs out, the book is back on the shelf.
    vi.setSystemTime(NOW.getTime() + 16 * DAY_MS);
    expect(await stateFor(budi.id, id)).toMatchObject({ kind: "available" });
    expect(await statusOf(id)).toBe("available");
    const types = (await callerFor(mita.id).library.history({ id })).events
      .map((event) => event.type)
      .slice(0, 4);
    expect(types).toEqual(["expired", "ready", "expired", "ready"]);
  });

  it("emails the member whose turn it is, after the hold is saved", async () => {
    const { budi, citra, id, mita } = await borrowedWithQueue();
    vi.stubEnv("RESEND_API_KEY", "test-only-key");
    vi.stubEnv("NEXTAUTH_URL", "https://perki.example.com");
    await callerFor(mita.id).library.markReturned({ id });
    // Email is off by default: the hold stands without it.
    expect(provider).not.toHaveBeenCalled();

    await callerFor(mita.id).settings.setEmail({
      enabled: true,
      sender: "library@example.com",
    });
    vi.setSystemTime(NOW.getTime() + 8 * DAY_MS);
    await callerFor(budi.id).library.list({});
    expect(provider).toHaveBeenCalledTimes(1);
    const [, request] = provider.mock.calls.at(0) ?? [];
    const body = JSON.parse(request.body);
    expect(body).toMatchObject({
      subject: "Mere Christianity is ready for you",
      to: [citra.email],
    });
    expect(body.text).toContain("https://perki.example.com/library");
    expect(body.text).toContain("22 Nov");
    vi.unstubAllEnvs();
  });

  it("lets staff cancel a reservation, passing the hold on", async () => {
    const { budi, citra, id, mita } = await borrowedWithQueue();
    await callerFor(mita.id).library.markReturned({ id });
    const [first] = await reservationsOf(id);
    await callerFor(mita.id).library.cancelReservation({
      reservationId: first?.id ?? 0,
    });
    expect(await stateFor(budi.id, id)).toMatchObject({ mine: false });
    expect(await stateFor(citra.id, id)).toMatchObject({
      holdEndsOn: "2026-11-14",
      mine: true,
    });
    const shelf = await callerFor(mita.id).library.manage({
      state: "reserved",
    });
    expect(shelf).toEqual([
      expect.objectContaining({ holder: "Citra Dewi", id, queue: 0 }),
    ]);
    await expect(
      callerFor(mita.id).library.cancelReservation({
        reservationId: first?.id ?? 0,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("shows staff the queue length", async () => {
    const { id, mita } = await borrowedWithQueue();
    const [row] = await callerFor(mita.id).library.manage({});
    expect(row).toMatchObject({ id, queue: 2 });
  });
});

describe("offering and lending your own book", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists an offered book until the librarian accepts it", async () => {
    const { ana, budi, citra, mita } = await setup();
    const { id } = await callerFor(citra.id).library.offer({
      author: "Dietrich Bonhoeffer",
      description: "",
      language: "German",
      title: "Nachfolge",
    });
    expect(await stateFor(ana.id, id)).toMatchObject({
      kind: "offered",
      mine: false,
    });
    expect(await stateFor(citra.id, id)).toMatchObject({
      kind: "offered",
      mine: true,
    });
    await expect(
      callerFor(ana.id).library.borrow({ id })
    ).rejects.toMatchObject({ message: "This book isn't on the shelf yet." });
    const offered = await callerFor(mita.id).library.manage({
      state: "offered",
    });
    expect(offered).toEqual([
      expect.objectContaining({
        id,
        kind: "offered",
        owner: { id: citra.id, name: "Citra Dewi" },
      }),
    ]);

    await callerFor(mita.id).library.accept({ id });
    expect(await stateFor(ana.id, id)).toMatchObject({ kind: "available" });
    await expect(
      callerFor(mita.id).library.accept({ id })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await callerFor(budi.id).library.borrow({ id });
    const lent = await callerFor(citra.id).library.myLentBooks();
    expect(lent).toEqual([
      expect.objectContaining({
        dueOn: "2026-12-07",
        holder: "Budi Santoso",
        id,
        kind: "borrowed",
        title: "Nachfolge",
      }),
    ]);
    expect(lent[0]?.loans).toEqual([
      {
        borrowedAt: expect.any(Date),
        borrower: "Budi Santoso",
        returnedAt: null,
      },
    ]);
    // Others never learn who has it, and lend nothing themselves.
    const seen = await callerFor(ana.id).library.list({});
    expect(JSON.stringify(seen)).not.toContain("Budi");
    expect(await callerFor(ana.id).library.myLentBooks()).toEqual([]);

    const history = await callerFor(mita.id).library.history({ id });
    expect(history.events.map((event) => event.type)).toEqual([
      "borrowed",
      "accepted",
      "offered",
    ]);
  });
});
