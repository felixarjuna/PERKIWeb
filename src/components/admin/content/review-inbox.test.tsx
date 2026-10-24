import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type InboxData, InboxSections } from "./review-inbox";

type Item = InboxData["needsReview"][number];

const item = (overrides: Partial<Item> = {}): Item => ({
  authorName: "Writer",
  date: new Date("2026-03-01T14:30:00Z"),
  id: 7,
  openComments: 0,
  openSuggestions: 0,
  revision: null,
  status: "in_review",
  title: "Faith",
  type: "bible_study",
  ...overrides,
});

const empty: InboxData = {
  needsReview: [],
  openFeedback: [],
  readyToPublish: [],
};

describe("InboxSections", () => {
  it("lists open feedback with its counts and links to the review page", () => {
    render(
      <InboxSections
        data={{
          ...empty,
          openFeedback: [item({ openComments: 2, openSuggestions: 1 })],
        }}
      />
    );
    const section = screen.getByRole("region", { name: "Open feedback" });
    expect(within(section).getByText("(1)")).toBeTruthy();
    expect(
      within(section).getByText("2 open comments · 1 open suggestion")
    ).toBeTruthy();
    expect(
      within(section)
        .getByRole("link", { name: "Review Faith" })
        .getAttribute("href")
    ).toBe("/admin/takeaways/7");
  });

  it("names the writer on takeaways to review or publish", () => {
    render(
      <InboxSections
        data={{
          ...empty,
          needsReview: [item({ authorName: "Ana", openComments: 1 })],
          readyToPublish: [item({ authorName: "Budi", id: 8, title: "Hope" })],
        }}
      />
    );
    const ready = screen.getByRole("region", { name: "Ready to publish" });
    expect(within(ready).getByText("By Budi · No open feedback")).toBeTruthy();
    const review = screen.getByRole("region", { name: "Needs review" });
    expect(within(review).getByText("By Ana · 1 open comment")).toBeTruthy();
  });

  it("marks a correction of a published takeaway and opens its review page", () => {
    render(
      <InboxSections
        data={{
          ...empty,
          readyToPublish: [
            item({ revision: "in_review", status: "published" }),
          ],
        }}
      />
    );
    const ready = screen.getByRole("region", { name: "Ready to publish" });
    expect(within(ready).getByText("Published")).toBeTruthy();
    expect(within(ready).getByText("Changes submitted")).toBeTruthy();
    expect(
      within(ready)
        .getByRole("link", { name: "Review changes to Faith" })
        .getAttribute("href")
    ).toBe("/admin/takeaways/7");
  });

  it("renders nothing when nothing waits", () => {
    const { container } = render(<InboxSections data={empty} />);
    expect(container.innerHTML).toBe("");
  });
});
