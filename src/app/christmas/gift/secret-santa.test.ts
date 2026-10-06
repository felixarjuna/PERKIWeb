import secretSanta from "secret-santa-generator";
import { describe, expect, it } from "vitest";

/**
 * The gift page (`./page.tsx`) delegates the draw to
 * `secretSanta.buildSecretSantaTable(guestIds)`, which returns a map of
 * giver id -> receiver id. These tests pin down the properties a gift
 * exchange needs.
 */
const draw = (ids: number[]) => secretSanta.buildSecretSantaTable(ids);

const RUNS_PER_SIZE = 200;
const GROUP_SIZES = [2, 3, 4, 5, 10, 37];

const range = (size: number) => Array.from({ length: size }, (_, i) => i + 1);

const assertValidExchange = (ids: number[], table: Record<number, number>) => {
  // Everyone gives exactly once (keys are the giver ids).
  expect(
    Object.keys(table)
      .map(Number)
      .sort((a, b) => a - b)
  ).toEqual([...ids].sort((a, b) => a - b));

  // Everyone receives exactly once (values are a permutation of the ids).
  expect(Object.values(table).sort((a, b) => a - b)).toEqual(
    [...ids].sort((a, b) => a - b)
  );

  // Nobody draws themselves.
  for (const [giver, receiver] of Object.entries(table)) {
    expect(receiver).not.toBe(Number(giver));
  }
};

describe("secret santa draw", () => {
  it.each(GROUP_SIZES)(
    "with %i people: everyone gives once, receives once, never to themselves",
    (size) => {
      const ids = range(size);
      for (let run = 0; run < RUNS_PER_SIZE; run += 1) {
        assertValidExchange(ids, draw(ids));
      }
    }
  );

  it("works with non-contiguous database ids", () => {
    const ids = [7, 42, 3, 1001, 15];
    for (let run = 0; run < RUNS_PER_SIZE; run += 1) {
      assertValidExchange(ids, draw(ids));
    }
  });

  it("with 2 people they always swap", () => {
    expect(draw([10, 20])).toEqual({ 10: 20, 20: 10 });
  });

  it("returns an empty table for 0 people", () => {
    expect(draw([])).toEqual({});
  });

  it("does not mutate the input array", () => {
    const ids = range(6);
    draw(ids);
    expect(ids).toEqual(range(6));
  });

  it("is random: produces more than one distinct assignment for 4 people", () => {
    const seen = new Set<string>();
    for (let run = 0; run < RUNS_PER_SIZE; run += 1) {
      seen.add(JSON.stringify(draw(range(4))));
    }
    // 4 people have 9 possible derangements.
    expect(seen.size).toBeGreaterThan(1);
    expect(seen.size).toBeLessThanOrEqual(9);
  });

  it("can produce sub-cycles (it is a derangement, not a single gift chain)", () => {
    // With 4 people, 3 of the 9 derangements are two pairs swapping.
    const isTwoPairs = (table: Record<number, number>) =>
      Object.entries(table).every(
        ([giver, receiver]) => table[receiver] === Number(giver)
      );
    let pairs = 0;
    for (let run = 0; run < RUNS_PER_SIZE; run += 1) {
      if (isTwoPairs(draw(range(4)))) {
        pairs += 1;
      }
    }
    expect(pairs).toBeGreaterThan(0);
  });

  // BUG: with a single participant no valid draw exists, and the library
  // retries by unbounded recursion (shuffleArrayCompletely) until the stack
  // overflows with a RangeError. gift/page.tsx only guards against 0 guests, so
  // one attending guest makes RANDOMIZE throw "Maximum call stack size exceeded".
  it.fails("does not overflow the stack for a single participant", () => {
    expect(() => draw([1])).not.toThrow(RangeError);
  });

  it("[current behaviour] throws a RangeError for a single participant", () => {
    expect(() => draw([1])).toThrow(RangeError);
  });

  // NOTE: duplicate ids collapse into one key, so someone can be
  // dropped from the exchange. The guest list comes from the RSVP API, so this
  // only matters if that API ever returns a guest twice.
  it("[current behaviour] collapses duplicate ids", () => {
    const table = draw([1, 1, 2, 3]);
    expect(Object.keys(table).length).toBeLessThan(4);
  });
});
