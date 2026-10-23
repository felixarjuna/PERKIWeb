import { describe, expect, it } from "vitest";
import type { TakeawayStatus } from "./db/schema/schema";
import type { Role } from "./roles";
import {
  mayChangeText,
  mayReviseTakeaway,
  revisionActions,
  workingSubject,
} from "./takeaway-revisions";

const AUTHOR = "author";

const viewer = (role: Role, id = "someone") => ({ id, role });
const takeaway = (
  status: TakeawayStatus,
  authorId: string | null = AUTHOR
) => ({ authorId, status });
const moves = (...args: Parameters<typeof revisionActions>) =>
  revisionActions(...args).map(({ label, to }) => `${label} > ${to}`);

describe("workingSubject", () => {
  it("is the open correction while there is one, owned by the takeaway's writer", () => {
    expect(workingSubject(takeaway("published"), "in_review")).toEqual({
      authorId: AUTHOR,
      status: "in_review",
    });
    expect(workingSubject(takeaway("published"), null)).toEqual(
      takeaway("published")
    );
  });
});

describe("mayReviseTakeaway", () => {
  it("lets the writer and staff start a correction of a published takeaway", () => {
    const published = takeaway("published");
    expect(mayReviseTakeaway(published, viewer("writer", AUTHOR))).toBe(true);
    expect(mayReviseTakeaway(published, viewer("mita"))).toBe(true);
    expect(mayReviseTakeaway(published, viewer("owner"))).toBe(true);
    expect(mayReviseTakeaway(published, viewer("writer"))).toBe(false);
    expect(mayReviseTakeaway(published, viewer("member", AUTHOR))).toBe(false);
  });

  it("is only for published takeaways; the others are edited directly", () => {
    expect(mayReviseTakeaway(takeaway("draft"), viewer("mita"))).toBe(false);
    expect(mayReviseTakeaway(takeaway("in_review"), viewer("mita"))).toBe(
      false
    );
  });
});

describe("mayChangeText", () => {
  const author = viewer("writer", AUTHOR);

  it("lets the writer and staff change a published takeaway through a correction", () => {
    expect(mayChangeText(takeaway("published"), null, author)).toBe(true);
    expect(mayChangeText(takeaway("published"), "draft", author)).toBe(true);
    expect(mayChangeText(takeaway("published"), "in_review", author)).toBe(
      true
    );
    expect(mayChangeText(takeaway("published"), "draft", viewer("mita"))).toBe(
      true
    );
    expect(
      mayChangeText(takeaway("published"), "in_review", viewer("writer"))
    ).toBe(false);
  });

  it("keeps the edit rule for unpublished takeaways", () => {
    expect(mayChangeText(takeaway("draft"), null, author)).toBe(true);
    expect(mayChangeText(takeaway("draft"), null, viewer("writer"))).toBe(
      false
    );
  });
});

describe("revisionActions", () => {
  const author = viewer("writer", AUTHOR);
  const mita = viewer("mita");

  it("lets the writer send a correction to review or discard it", () => {
    expect(moves(takeaway("published"), "draft", author)).toEqual([
      "Send changes to review > in_review",
      "Discard changes > discarded",
    ]);
    expect(moves(takeaway("published"), "draft", mita)).toEqual([
      "Discard changes > discarded",
    ]);
    expect(moves(takeaway("published"), "draft", viewer("writer"))).toEqual([]);
  });

  it("lets only staff publish a correction in review or send it back", () => {
    expect(moves(takeaway("published"), "in_review", mita)).toEqual([
      "Publish changes > published",
      "Request changes > draft",
      "Discard changes > discarded",
    ]);
    expect(moves(takeaway("published"), "in_review", author)).toEqual([
      "Withdraw changes from review > draft",
      "Discard changes > discarded",
    ]);
    expect(moves(takeaway("published"), "in_review", viewer("writer"))).toEqual(
      []
    );
  });

  it("lets staff act as the writer of an authorless takeaway", () => {
    expect(moves(takeaway("published", null), "draft", mita)).toEqual([
      "Send changes to review > in_review",
      "Discard changes > discarded",
    ]);
  });

  it("makes sending and publishing the main step and confirms discarding", () => {
    const [publish, , discard] = revisionActions(
      takeaway("published"),
      "in_review",
      mita
    );
    expect(publish).toMatchObject({ primary: true, revision: true });
    expect(discard?.confirm?.title).toBe("Discard these changes?");
  });
});
