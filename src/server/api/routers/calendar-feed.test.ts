import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "~/app/api/calendar/[token]/route";
import { anonymousCaller, callerFor, insertUser } from "~/test/caller";

const gathering = {
  bibleVerse: "Roma 4:1-12",
  cleaningGroup: "Group 9",
  description: "Weekly gathering",
  leader: "Lia",
  musician: "Max",
  noteWriter: "Nia",
  type: "bible_study" as const,
};

const FEED_PATH = /^\/api\/calendar\/[\w-]{43}\.ics$/;

/** Fetches a feed link the way a calendar app does. */
const fetchFeed = (path: string) =>
  GET(new Request(`https://perki.example${path}`), {
    params: Promise.resolve({ token: path.split("/").at(-1) ?? "" }),
  });

describe("calendarFeed", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is only for signed-in members", async () => {
    await expect(anonymousCaller().calendarFeed.mine()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      anonymousCaller().calendarFeed.regenerate()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("has no link until the member makes one", async () => {
    const ana = await insertUser({ name: "Ana Putri" });
    expect(await callerFor(ana.id).calendarFeed.mine()).toBeNull();
    const made = await callerFor(ana.id).calendarFeed.regenerate();
    expect(made.path).toMatch(FEED_PATH);
    expect(await callerFor(ana.id).calendarFeed.mine()).toMatchObject({
      path: made.path,
    });
  });

  it("serves only the member's own upcoming duties, without other names", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-21T12:00:00Z"),
      toFake: ["Date"],
    });
    const ana = await insertUser({ name: "Ana Putri" });
    await insertUser({ name: "Budi Santoso" });
    const admin = callerFor((await insertUser({ role: "mita" })).id);
    await admin.schedules.addScheduleBatch([
      {
        ...gathering,
        date: new Date("2026-10-24T13:30:00Z"),
        musician: "Ana Putri",
        noteWriter: "Budi Santoso",
        title: "Hers",
      },
      {
        ...gathering,
        date: new Date("2026-10-31T14:30:00Z"),
        noteWriter: "Budi Santoso",
        title: "Not hers",
      },
      {
        ...gathering,
        cancelled: true,
        date: new Date("2026-11-07T14:30:00Z"),
        musician: "Ana Putri",
        title: "Called off",
      },
    ]);
    const { path } = await callerFor(ana.id).calendarFeed.regenerate();

    const response = await fetchFeed(path);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");
    const ics = await response.text();
    expect(ics).toContain("DTSTART:20261024T133000Z");
    expect(ics).toContain("SUMMARY:Musician · Bible study");
    expect(ics).toContain("DESCRIPTION:Hers");
    expect(ics).not.toContain("Not hers");
    expect(ics).not.toContain("Called off");
    expect(ics).not.toContain("Budi");
    expect(ics).not.toContain("Max");
    expect(ics).not.toContain(ana.id);
  });

  it("stops serving the old link once a new one is made", async () => {
    const ana = await insertUser({ name: "Ana Putri" });
    const first = await callerFor(ana.id).calendarFeed.regenerate();
    const second = await callerFor(ana.id).calendarFeed.regenerate();
    expect(second.path).not.toBe(first.path);

    expect((await fetchFeed(first.path)).status).toBe(404);
    expect((await fetchFeed(second.path)).status).toBe(200);
  });

  it("answers a wrong or malformed token with a plain 404", async () => {
    const ana = await insertUser({ name: "Ana Putri" });
    await callerFor(ana.id).calendarFeed.regenerate();

    const responses = await Promise.all(
      [
        `/api/calendar/${"a".repeat(43)}.ics`,
        "/api/calendar/short.ics",
        "/api/calendar/",
      ].map(fetchFeed)
    );
    for (const response of responses) {
      expect(response.status).toBe(404);
    }
    const bodies = await Promise.all(responses.map((r) => r.text()));
    expect(bodies).toEqual(["Not found", "Not found", "Not found"]);
  });

  it("gives every member their own link", async () => {
    const ana = await insertUser({ name: "Ana Putri" });
    const budi = await insertUser({ name: "Budi Santoso" });
    const hers = await callerFor(ana.id).calendarFeed.regenerate();
    const his = await callerFor(budi.id).calendarFeed.regenerate();
    expect(hers.path).not.toBe(his.path);
    // Making Budi's link leaves Ana's working.
    expect((await fetchFeed(hers.path)).status).toBe(200);
  });
});
