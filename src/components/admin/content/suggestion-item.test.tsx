import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RouterOutputs } from "~/trpc/react";
import { PassageSuggestionForm } from "./passage-suggestion-form";
import { SuggestionItem } from "./suggestion-item";

const STALE = /Apply it by hand/;

type Suggestion =
  RouterOutputs["takeawaySuggestions"]["list"]["suggestions"][number];

const suggestion: Suggestion = {
  applicationReason: null,
  applies: true,
  author: { image: null, name: "Reviewer" },
  createdAt: new Date("2026-10-22T12:00:00Z"),
  decidedAt: null,
  decidedBy: null,
  id: 7,
  mine: false,
  original: "Abraham believed God",
  replacement: "Abraham trusted God",
  revisionId: null,
  status: "open",
  target: "notes",
};

const renderItem = (
  overrides: Partial<Suggestion> = {},
  acceptBlocked?: string
) => {
  const accepted: [number, boolean][] = [];
  render(
    <ol>
      <SuggestionItem
        acceptBlocked={acceptBlocked}
        canDecide
        onAccept={(id, byHand) => accepted.push([id, byHand])}
        onReject={() => null}
        onWithdraw={() => null}
        pending={false}
        suggestion={{ ...suggestion, ...overrides }}
      />
    </ol>
  );
  return accepted;
};

describe("suggestion item", () => {
  it("accepts a suggestion whose passage is still in the text", () => {
    const accepted = renderItem();
    expect(screen.getByText("Abraham believed God").tagName).toBe("DEL");
    expect(screen.getByText("Abraham trusted God").tagName).toBe("INS");
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(accepted).toEqual([[7, false]]);
  });

  it("asks the writer to apply a stale suggestion by hand", () => {
    const accepted = renderItem(
      {
        applicationReason:
          "This passage changed. Apply it by hand in the editor, then mark it as applied.",
        applies: false,
      },
      "Save your changes before accepting a suggestion."
    );
    expect(screen.getByText(STALE)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mark as applied" }));
    expect(accepted).toEqual([[7, true]]);
  });

  it("waits for unsaved edits before replacing the passage", () => {
    const accepted = renderItem(
      {},
      "Save your changes before accepting a suggestion."
    );
    const accept = screen.getByRole<HTMLButtonElement>("button", {
      name: "Accept",
    });
    expect(accept.disabled).toBe(true);
    expect(
      screen.getByText("Save your changes before accepting a suggestion.")
    ).toBeTruthy();
    fireEvent.click(accept);
    expect(accepted).toEqual([]);
  });

  it("shows who decided and offers no actions afterwards", () => {
    renderItem({ decidedBy: { name: "Writer" }, status: "rejected" });
    expect(screen.getByText("Rejected")).toBeTruthy();
    expect(screen.getByText("by Writer")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("passage suggestion composer", () => {
  it("only sends a changed passage and keeps it when sending fails", async () => {
    const sent: { original: string; replacement: string }[] = [];
    let replacement = "Abraham believed God";
    const { rerender } = render(
      <PassageSuggestionForm
        onClose={() => null}
        onPendingChange={() => null}
        onReplacementChange={(next) => {
          replacement = next;
        }}
        onSubmit={async () => {
          await Promise.resolve();
          throw new Error("Try again.");
        }}
        original="Abraham believed God"
        replacement={replacement}
      />
    );
    const submit = screen.getByRole<HTMLButtonElement>("button", {
      name: "Suggest edit",
    });
    expect(submit.disabled).toBe(true);
    rerender(
      <PassageSuggestionForm
        onClose={() => null}
        onPendingChange={() => null}
        onReplacementChange={() => null}
        onSubmit={async (input) => {
          await Promise.resolve();
          sent.push(input);
          throw new Error("Try again.");
        }}
        original="Abraham believed God"
        replacement="  Abraham trusted God "
      />
    );
    fireEvent.click(submit);
    expect((await screen.findByRole("alert")).textContent).toBe("Try again.");
    expect(sent).toEqual([
      { original: "Abraham believed God", replacement: "Abraham trusted God" },
    ]);
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Suggested text").value
    ).toBe("  Abraham trusted God ");
  });
});
