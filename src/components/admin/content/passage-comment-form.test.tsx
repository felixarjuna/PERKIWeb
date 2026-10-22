import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PassageCommentForm } from "./passage-comment-form";

describe("passage comment composer", () => {
  it("preserves feedback and its quote when submission fails, then retries", async () => {
    const submitted: { body: string; quote: string }[] = [];
    let attempts = 0;
    render(
      <PassageCommentForm
        body="My feedback"
        onBodyChange={() => null}
        onClose={() => null}
        onPendingChange={() => null}
        onSubmit={async (input) => {
          attempts += 1;
          await Promise.resolve();
          if (attempts === 1) {
            throw new Error("Try again.");
          }
          submitted.push(input);
        }}
        quote="Abraham believed God"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Add comment" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Try again.");
    expect(screen.getByLabelText<HTMLTextAreaElement>("Comment").value).toBe(
      "My feedback"
    );
    expect(screen.getByRole("blockquote").textContent).toBe(
      "Abraham believed God"
    );
    fireEvent.click(screen.getByRole("button", { name: "Add comment" }));
    await waitFor(() =>
      expect(submitted).toEqual([
        { body: "My feedback", quote: "Abraham believed God" },
      ])
    );
  });
});
