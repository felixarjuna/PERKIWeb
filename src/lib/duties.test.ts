import { describe, expect, it } from "vitest";
import { dutyLabel } from "./duties";

describe("dutyLabel", () => {
  it("names a serving slot by its role", () => {
    expect(dutyLabel({ role: "note_writer" })).toBe("Note writer");
  });

  it("names a group duty with its group", () => {
    expect(dutyLabel({ group: "Group 3", role: "cooking" })).toBe(
      "Cooking · Group 3"
    );
    expect(dutyLabel({ group: "Group 3", role: "cleaning" })).toBe(
      "Cleaning · Group 3"
    );
  });
});
