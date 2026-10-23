import { describe, expect, it } from "vitest";
import { countWords } from "./markdown";
import { normalizeTldr } from "./takeaway-tldr";

describe("takeaway TL;DR", () => {
  it("counts the words a reader sees", () => {
    expect(countWords("## Faith\n\n- **Abraham** believed")).toBe(3);
    expect(countWords("")).toBe(0);
  });

  it("stores nothing for an empty TL;DR", () => {
    expect(normalizeTldr(" \n\n ")).toBeNull();
    expect(normalizeTldr("\r\nShort.\r\n")).toBe("Short.");
  });
});
