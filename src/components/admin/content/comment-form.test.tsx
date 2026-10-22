import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CommentForm } from "./comment-form";

describe("comment form", () => {
  it("inserts a selected quote, preserves the comment draft and focuses its field", () => {
    const submit = async () => {
      await Promise.resolve();
    };
    const view = render(<CommentForm onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "My feedback" },
    });
    view.rerender(
      <CommentForm
        onSubmit={submit}
        quoteRequest={{ text: "Abraham believed God" }}
      />
    );
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Quoted passage (optional)")
        .value
    ).toBe("Abraham believed God");
    expect(screen.getByLabelText<HTMLTextAreaElement>("Comment").value).toBe(
      "My feedback"
    );
    expect(document.activeElement).toBe(screen.getByLabelText("Comment"));
  });

  it("keeps the draft on failure and clears it after a successful retry", async () => {
    let attempts = 0;
    const submitted: { body: string; quote: string }[] = [];
    render(
      <CommentForm
        onSubmit={async (input) => {
          attempts += 1;
          await Promise.resolve();
          if (attempts === 1) {
            throw new Error("Please try again.");
          }
          submitted.push(input);
        }}
      />
    );
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Comment"),
      "Add the verse reference."
    );
    await user.type(
      screen.getByLabelText("Quoted passage (optional)"),
      "Abraham believed God"
    );
    await user.click(screen.getByRole("button", { name: "Add comment" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Please try again."
    );
    expect(screen.getByLabelText<HTMLTextAreaElement>("Comment").value).toBe(
      "Add the verse reference."
    );
    await user.click(screen.getByRole("button", { name: "Add comment" }));
    await waitFor(() =>
      expect(screen.getByLabelText<HTMLTextAreaElement>("Comment").value).toBe(
        ""
      )
    );
    expect(submitted).toEqual([
      { body: "Add the verse reference.", quote: "Abraham believed God" },
    ]);
  });

  it("does not submit whitespace-only comments", () => {
    const submitted: string[] = [];
    render(
      <CommentForm
        onSubmit={async ({ body }) => {
          await Promise.resolve();
          submitted.push(body);
        }}
      />
    );
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "   " },
    });
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Add comment" })
        .disabled
    ).toBe(true);
    expect(submitted).toEqual([]);
  });
});
