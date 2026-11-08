import { describe, expect, it, vi } from "vitest";
import { orNothing } from "./books-card";

describe("orNothing", () => {
  it("passes the result through", async () => {
    await expect(orNothing(async () => ({ holding: [] }))).resolves.toEqual({
      holding: [],
    });
  });

  it("gives null when the query fails, e.g. before the library tables exist", async () => {
    const error = vi.spyOn(console, "error");
    await expect(
      orNothing(() => Promise.reject(new Error('relation "library_loans"')))
    ).resolves.toBeNull();
    expect(error).not.toHaveBeenCalled();
  });
});
