import { describe, expect, it } from "vitest";
import { takeawaySamples } from "~/test/takeaway-samples";
import { markdownToPlainText, parseMarkdown, tidyMarkdown } from "./markdown";

describe("markdownToPlainText", () => {
  it("removes the syntax and keeps one line per block", () => {
    expect(markdownToPlainText(takeawaySamples.markdown)).toBe(
      [
        "Integritas Nuh",
        "Di Kejadian 8:20 kita melihat ketaatan Nuh.\nBaris kedua.",
        "Mezbah",
        "Korban bakaran",
        "Allah mencium persembahan yang harum.",
        "Baca Alkitab.",
      ].join("\n")
    );
  });

  it("keeps plain text as it was, without blank lines", () => {
    expect(markdownToPlainText(takeawaySamples.crlfParagraphs)).toBe(
      "Beware of Sin!\nInjil adalah kekuatan Allah.\nRoma 1:18 hingga pasal 3."
    );
    expect(markdownToPlainText("")).toBe("");
  });
});

describe("tidyMarkdown", () => {
  it("reads Word's padded list markers as list items, not code", () => {
    const root = parseMarkdown(takeawaySamples.paddedMarkers);
    expect(JSON.stringify(root)).not.toContain('"code"');
    expect(markdownToPlainText(takeawaySamples.paddedMarkers)).toContain(
      "Ada mindset yang berubah (ayat 5-8)"
    );
  });

  it("escapes lettered points without changing how they render", () => {
    expect(tidyMarkdown("a. Satu\niv) Dua\nKata. biasa")).toBe(
      "a\\. Satu\niv\\) Dua\nKata. biasa"
    );
    expect(markdownToPlainText("a. Satu")).toBe("a. Satu");
  });
});
