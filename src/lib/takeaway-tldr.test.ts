import { describe, expect, it } from "vitest";
import { normalizeTldr, tldrWords } from "./takeaway-tldr";

describe("takeaway TL;DR", () => {
  it("counts the words a reader sees", () => {
    expect(tldrWords("## Faith\n\n- **Abraham** believed")).toBe(3);
    expect(tldrWords("")).toBe(0);
  });

  it("stores nothing for an empty TL;DR", () => {
    expect(normalizeTldr(" \n\n ")).toBeNull();
    expect(normalizeTldr("\r\nShort.\r\n")).toBe("Short.");
  });
});
