import { describe, expect, it } from "vitest";
import { sheetIdFrom } from "./settings";

const ID = "1McH8SoN1ut6CfERNi6BSh45O8vhshfZElDA42FbTZMs";

describe("sheetIdFrom", () => {
  it("reads the id from a pasted link, whatever follows it", () => {
    expect(
      sheetIdFrom(
        `https://docs.google.com/spreadsheets/d/${ID}/edit?gid=960415741#gid=960415741`
      )
    ).toBe(ID);
    expect(
      sheetIdFrom(`  https://docs.google.com/spreadsheets/d/${ID}  `)
    ).toBe(ID);
  });

  it("accepts a bare id", () => {
    expect(sheetIdFrom(ID)).toBe(ID);
  });

  it("rejects anything else", () => {
    expect(sheetIdFrom("https://example.com/sheet")).toBeNull();
    expect(sheetIdFrom("2026")).toBeNull();
    expect(sheetIdFrom("")).toBeNull();
  });
});
