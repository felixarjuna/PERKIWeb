import { describe, expect, it } from "vitest";
import { takeawaySamples } from "~/test/takeaway-samples";
import { editorRoundTrip, rendersTheSame } from "./takeaway-editor";

describe("editorRoundTrip", () => {
  it.each(Object.entries(takeawaySamples))(
    "keeps the %s takeaway reading the same after Markdown → Tiptap → Markdown",
    (_name, text) => {
      expect(rendersTheSame(text, editorRoundTrip(text))).toBe(true);
    }
  );

  it("keeps Markdown written in the editor byte for byte", () => {
    expect(editorRoundTrip(takeawaySamples.markdown)).toBe(
      takeawaySamples.markdown
    );
  });

  it("keeps lettered points as text instead of renumbering them", () => {
    const out = editorRoundTrip(takeawaySamples.letteredPoints);
    expect(out).toContain("a. Kasih karunia");
    expect(out).toContain("b. Satu pelanggaran");
  });

  it("drops tables, which the editor can't show", () => {
    const table = "| a | b |\n| - | - |\n| 1 | 2 |";
    expect(rendersTheSame(table, editorRoundTrip(table))).toBe(false);
  });
});

describe("rendersTheSame", () => {
  it("ignores escapes, emphasis markers and list spacing", () => {
    expect(rendersTheSame("_a_ 3 < 4", "*a* 3 &lt; 4")).toBe(true);
    expect(rendersTheSame("1. a\n\n2. b", "1. a\n2. b")).toBe(true);
  });

  it("notices changed text and structure", () => {
    expect(rendersTheSame("a", "b")).toBe(false);
    expect(rendersTheSame("a\nb", "a\n\nb")).toBe(false);
  });
});
