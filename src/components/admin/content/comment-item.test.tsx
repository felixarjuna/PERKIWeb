import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommentItem } from "./comment-item";

const comment = {
  author: { image: null, name: "Felix Arjuna" },
  blocksSubmit: false,
  body: "Please add a reference.",
  createdAt: new Date("2026-10-22T12:00:00Z"),
  id: 1,
  mine: true,
  quote: "Abraham believed God",
  requestsChanges: false,
  resolvedAt: null,
  resolvedBy: null,
  target: "notes" as const,
};

describe("comment actions", () => {
  it("requires confirmation and keeps a failed deletion available to retry", async () => {
    let attempts = 0;
    render(
      <ol>
        <CommentItem
          canComment
          comment={comment}
          onDelete={async () => {
            attempts += 1;
            await Promise.resolve();
            if (attempts === 1) {
              throw new Error("Couldn’t delete. Try again.");
            }
          }}
          onResolve={() => null}
          pending={false}
        />
      </ol>
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog", {
      name: "Delete your comment?",
    });
    expect(attempts).toBe(0);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Keep comment" })
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete comment" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Couldn’t delete. Try again."
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete comment" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(attempts).toBe(2);
  });

  it("hides deletion for other authors and hides actions for read-only threads", () => {
    const { rerender } = render(
      <ol>
        <CommentItem
          canComment
          comment={{ ...comment, mine: false }}
          onDelete={async () => Promise.resolve()}
          onResolve={() => null}
          pending={false}
        />
      </ol>
    );
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.getByRole("button", { name: "Resolve" })).toBeTruthy();
    rerender(
      <ol>
        <CommentItem
          canComment={false}
          comment={comment}
          onDelete={async () => Promise.resolve()}
          onResolve={() => null}
          pending={false}
        />
      </ol>
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("marks mita's request for changes and the comments that block submitting", () => {
    render(
      <ol>
        <CommentItem
          canComment
          comment={{
            ...comment,
            blocksSubmit: true,
            mine: false,
            requestsChanges: true,
          }}
          onDelete={async () => Promise.resolve()}
          onResolve={() => null}
          pending={false}
        />
      </ol>
    );
    expect(screen.getByText("Changes requested")).toBeTruthy();
    expect(screen.getByText("Resolve before submitting")).toBeTruthy();
  });
});
