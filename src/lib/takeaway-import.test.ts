import { describe, expect, it } from "vitest";
import {
  assertLocalImportDatabase,
  pairTakeawaySources,
  parseTakeawaySource,
  planTakeawayImport,
} from "./takeaway-import";

const source = (heading: string, body = "Original text.") =>
  `<html><body><h3>${heading}</h3><p>${body}</p></body></html>`;
const DUPLICATE = /duplicate/i;
const EMPTY = /empty/i;
const UNMATCHED = /unmatched/i;
const LOCAL = /local/i;

describe("takeaway document import", () => {
  it("separates instructions and preserves headings, paragraphs, emphasis and lists", () => {
    const parsed = parseTakeawaySource(
      "<html><body><p>Instructions</p><h3>03-01-2026: Title</h3><p>One <strong>important</strong> point.</p><ul><li>First</li><li>Second</li></ul><h3>10.01.2026 Other</h3><p>Next.</p></body></html>"
    );
    expect(parsed.instructions).toBe("Instructions");
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0]).toMatchObject({
      date: "2026-01-03",
      heading: "03-01-2026: Title",
    });
    expect(parsed.entries[0]?.content).toContain("One **important** point.");
    expect(parsed.entries[0]?.content).toContain("- First\n- Second");
  });

  it("retains literal Markdown punctuation and Google Docs CSS emphasis", () => {
    const parsed = parseTakeawaySource(
      '<style>.bold{font-weight:700}.italic{font-style:italic}</style><h3>03-01-2026 Title</h3><p><span class="bold">Bold</span> <span class="italic">emphasis</span> [literal] *stars*</p>'
    );
    expect(parsed.entries[0]?.content).toContain(
      "**Bold** *emphasis* \\[literal\\] \\*stars\\*"
    );
  });

  it("merges adjacent Google Docs style runs without inserting visible Markdown", () => {
    const parsed = parseTakeawaySource(
      '<style>.italic{font-style:italic}</style><h3>03-01-2026 Title</h3><p>(<span class="italic">g</span><span class="italic">entiles</span>) <strong>word </strong>next</p>'
    );
    expect(parsed.entries[0]?.content).toContain("(*gentiles*) **word** next");
  });

  it("rejects duplicate dates, invalid dates and entries without a body", () => {
    expect(() => parseTakeawaySource(source("31-02-2026 Bad"))).toThrow();
    expect(() =>
      parseTakeawaySource(source("03-01-2026 A") + source("03-01-2026 B"))
    ).toThrow(DUPLICATE);
    expect(() => parseTakeawaySource(source("03-01-2026 A", ""))).toThrow(
      EMPTY
    );
  });

  it("requires explicit date corrections and retains the source date", () => {
    const notes = parseTakeawaySource(source("01-08-2026 Assurance"));
    const tldr = parseTakeawaySource(source("TL;DR 02.08.2026 Assurance"));
    expect(() => pairTakeawaySources(notes, tldr)).toThrow(UNMATCHED);
    const pairs = pairTakeawaySources(notes, tldr, {
      "2026-08-02": "2026-08-01",
    });
    expect(pairs[0]).toMatchObject({
      date: "2026-08-01",
      tldr: { date: "2026-08-02" },
    });
  });

  it("does not guess missing schedules or overwrite existing notes", () => {
    const parsed = parseTakeawaySource(source("03-01-2026 Title"));
    const pairs = pairTakeawaySources(parsed, parsed);
    expect(planTakeawayImport(pairs, [], [])[0]?.action).toBe("blocked");
    const schedules = [{ date: "2026-01-03", id: 12 }];
    expect(planTakeawayImport(pairs, schedules, [])[0]?.action).toBe("insert");
    expect(
      planTakeawayImport(pairs, schedules, [
        { id: 8, keypoints: "Existing", scheduleId: 12, tldr: null },
      ])[0]?.action
    ).toBe("blocked");
    expect(
      planTakeawayImport(pairs, schedules, [
        {
          id: 8,
          keypoints: pairs[0]?.notes.content ?? "",
          scheduleId: 12,
          tldr: pairs[0]?.tldr.content ?? "",
        },
      ])[0]?.action
    ).toBe("skip");
    expect(
      planTakeawayImport(pairs, [...schedules, ...schedules], [])[0]?.action
    ).toBe("blocked");
  });

  it("refuses remote databases and any database except the local dev instance", () => {
    expect(() =>
      assertLocalImportDatabase(
        "postgres://postgres:secret@127.0.0.1:54320/perkiweb_dev"
      )
    ).not.toThrow();
    for (const url of [
      "postgres://postgres:secret@production.example:54320/perkiweb_dev",
      "postgres://postgres:secret@localhost:54329/perkiweb_dev",
      "postgres://postgres:secret@localhost:54320/production",
    ]) {
      expect(() => assertLocalImportDatabase(url)).toThrow(LOCAL);
    }
  });
});
