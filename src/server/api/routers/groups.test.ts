import { afterEach, describe, expect, it, vi } from "vitest";
import { groupMembers, groups, groupTerms } from "~/lib/db/schema/schema";
import { anonymousCaller } from "~/test/caller";
import { testDb } from "~/test/db";

const insertTerm = async (
  startsOn: string,
  group: string,
  members: string[]
) => {
  const [term] = await testDb
    .insert(groupTerms)
    .values({ startsOn })
    .returning();
  const [row] = await testDb
    .insert(groups)
    .values({ name: group, termId: term?.id ?? 0 })
    .returning();
  await testDb.insert(groupMembers).values(
    members.map((name, position) => ({
      groupId: row?.id ?? 0,
      name,
      position,
    }))
  );
};

describe("groups router", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null before the first term", async () => {
    expect(await anonymousCaller().groups.getCurrent()).toBeNull();
  });

  it("returns the latest term that has started, members in order", async () => {
    vi.useFakeTimers({
      now: new Date("2026-10-21T12:00:00Z"),
      toFake: ["Date"],
    });
    await insertTerm("2025-10-01", "Group 1", ["Old"]);
    await insertTerm("2026-04-01", "Group 1", ["Wynnona", "Toni"]);
    await insertTerm("2027-04-01", "Group 1", ["Future"]);

    expect(await anonymousCaller().groups.getCurrent()).toEqual({
      groups: [
        {
          members: [
            { image: null, name: "Wynnona" },
            { image: null, name: "Toni" },
          ],
          name: "Group 1",
        },
      ],
      startsOn: "2026-04-01",
    });
  });
});
