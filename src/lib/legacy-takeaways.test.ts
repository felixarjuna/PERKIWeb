import { describe, expect, it } from "vitest";
import { takeawaySamples } from "~/test/takeaway-samples";
import { markdownChanges, sections } from "./legacy-takeaways";

describe("sections", () => {
  it("splits off a writer's section title, as the page did before #35", () => {
    expect(sections(takeawaySamples.sectionTitle)).toEqual([
      { body: "Intro sentence.", heading: null },
      {
        body: "Di Kejadian 8:20 kita bisa melihat.\nLine two.",
        heading: "1. Integritas Nuh",
      },
    ]);
  });

  it("keeps prose line breaks and lone short lines as body text", () => {
    const prose = "Allah pun senang akan persembahan Nuh,\nIa melihat korban.";
    expect(sections(prose)).toEqual([{ body: prose, heading: null }]);
    expect(sections("ay.14: Paulus mencoba\nmenjelaskan")[0]?.heading).toBe(
      null
    );
  });
});

describe("markdownChanges", () => {
  it("is empty for plain paragraphs that read the same", () => {
    expect(markdownChanges(takeawaySamples.crlfParagraphs)).toEqual([]);
  });

  it("names what Markdown changes", () => {
    expect(markdownChanges(takeawaySamples.sectionTitle)).toEqual([
      "section title",
      "numbered list",
    ]);
    expect(markdownChanges(takeawaySamples.introThenList)).toEqual([
      "numbered list",
    ]);
    expect(markdownChanges("Kata *penting* di [sini](https://x.org)")).toEqual([
      "emphasis",
      "link",
    ]);
  });

  it("finds features nested in lists", () => {
    expect(markdownChanges("- a\n\n      kode")).toContain("code block");
  });

  it("notices text that changes without new structure", () => {
    expect(markdownChanges("Satu \\* dua")).toEqual(["text"]);
  });
});
