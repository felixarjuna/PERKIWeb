import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QUOTE_MAX_LENGTH } from "~/lib/takeaway-comments";
import { QuoteablePassage } from "./quoteable-passage";

const select = (start: Node, end = start) => {
  act(() => {
    const range = document.createRange();
    range.setStart(start, 0);
    range.setEnd(end, end.childNodes.length);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
};

describe("quoteable passage", () => {
  it("quotes selected formatted text without its markup", () => {
    const quotes: string[] = [];
    render(
      <QuoteablePassage onQuote={(quote) => quotes.push(quote)}>
        <p data-testid="passage">
          Abraham <strong>believed</strong> God
        </p>
      </QuoteablePassage>
    );
    select(screen.getByTestId("passage"));
    fireEvent.click(screen.getByRole("button", { name: "Quote selection" }));
    expect(quotes).toEqual(["Abraham believed God"]);
  });

  it("ignores selections outside or crossing the takeaway boundary", () => {
    const quotes: string[] = [];
    render(
      <>
        <p data-testid="outside">Outside text</p>
        <QuoteablePassage onQuote={(quote) => quotes.push(quote)}>
          <p data-testid="passage">The takeaway</p>
        </QuoteablePassage>
      </>
    );
    const button = screen.getByRole<HTMLButtonElement>("button", {
      name: "Quote selection",
    });
    select(screen.getByTestId("outside"));
    expect(button.disabled).toBe(true);
    select(screen.getByTestId("outside"), screen.getByTestId("passage"));
    expect(button.disabled).toBe(true);
    expect(quotes).toEqual([]);
  });

  it("explains oversized selections without truncating them", () => {
    render(
      <QuoteablePassage onQuote={() => null}>
        <p data-testid="passage">{"x".repeat(QUOTE_MAX_LENGTH + 1)}</p>
      </QuoteablePassage>
    );
    select(screen.getByTestId("passage"));
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Quote selection" })
        .disabled
    ).toBe(true);
    expect(screen.getByRole("status").textContent).toContain(
      "Select up to 1000 characters"
    );
  });
});
