import { describe, expect, it } from "vitest";
import { readingMinutes } from "./reading-time";

describe("readingMinutes", () => {
  const words = (count: number) => new Array(count).fill("kata").join(" ");

  it("estimates at 200 words a minute, at least one minute", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes(words(50))).toBe(1);
    expect(readingMinutes(words(1000))).toBe(5);
    expect(readingMinutes(`${words(700)}\n\n${words(500)}`)).toBe(6);
  });

  it("doesn't count Markdown syntax as words", () => {
    // 300 one-word list items: 300 words, not 600 with the "-" markers.
    expect(readingMinutes("- kata\n".repeat(300))).toBe(2);
  });
});
