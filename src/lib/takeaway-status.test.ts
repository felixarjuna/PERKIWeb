import { describe, expect, it } from "vitest";
import { statusActions, statusLabels } from "./takeaway-status";

const names = (
  ...args: Parameters<typeof statusActions>
): { label: string; to: string }[] =>
  statusActions(...args).map(({ label, to }) => ({ label, to }));

describe("statusLabels", () => {
  it("names every status for readers", () => {
    expect(statusLabels).toEqual({
      draft: "Draft",
      in_review: "In review",
      published: "Published",
    });
  });
});

describe("statusActions", () => {
  const author = { canManage: true, canPublish: false };
  const staff = { canManage: true, canPublish: true };
  const reader = { canManage: false, canPublish: false };

  it("lets the author send a draft to review and take it back", () => {
    expect(names("draft", author)).toEqual([
      { label: "Send to review", to: "in_review" },
    ]);
    expect(names("in_review", author)).toEqual([
      { label: "Back to draft", to: "draft" },
    ]);
  });

  it("lets staff publish from any unpublished status and send back", () => {
    expect(names("draft", staff)).toEqual([
      { label: "Publish", to: "published" },
      { label: "Send to review", to: "in_review" },
    ]);
    expect(names("in_review", staff)).toEqual([
      { label: "Publish", to: "published" },
      { label: "Send back", to: "draft" },
    ]);
    expect(names("published", staff)).toEqual([
      { label: "Send back", to: "draft" },
    ]);
  });

  it("offers nothing to readers or to the author of a published takeaway", () => {
    expect(names("in_review", reader)).toEqual([]);
    expect(names("published", author)).toEqual([]);
  });

  it("marks publishing as the primary action", () => {
    expect(statusActions("in_review", staff).map((a) => a.primary)).toEqual([
      true,
      false,
    ]);
  });
});
