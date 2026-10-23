import { describe, expect, it } from "vitest";
import { dutyLabel, yourPartLabel } from "./duties";

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

describe("yourPartLabel", () => {
  it("names a slot by its role and a group duty by what the group does", () => {
    expect(yourPartLabel({ role: "musician" })).toBe("Musician");
    expect(yourPartLabel({ group: "Group 3", role: "cooking" })).toBe(
      "Your group cooks"
    );
    expect(yourPartLabel({ group: "Group 3", role: "cleaning" })).toBe(
      "Your group cleans"
    );
  });
});
