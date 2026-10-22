import { render, screen, waitFor } from "@testing-library/react";
import { Editor } from "@tiptap/react";
import { describe, expect, it } from "vitest";
import { QuoteablePassage } from "./quoteable-passage";
import { passageText, reviewReaderExtensions } from "./review-reader";

describe("quoteable passage", () => {
  it("quotes hard line breaks and paragraph breaks without joining words", () => {
    const editor = new Editor({
      content: "<p>First<br>second</p><p>Third</p>",
      extensions: reviewReaderExtensions,
    });
    try {
      expect(
        passageText(editor.state.doc, 0, editor.state.doc.content.size)
      ).toBe("First\nsecond\nThird");
    } finally {
      editor.destroy();
    }
  });
  it("keeps task completion and internal link behavior from the reading view", async () => {
    const { container } = render(
      <QuoteablePassage
        onSubmit={async () => {
          await Promise.resolve();
        }}
      >
        <div>
          <ul>
            <li>
              <input checked disabled readOnly type="checkbox" /> Done
            </li>
          </ul>
          <p>
            <a href="/schedule">Schedule</a>
            <a
              href="https://example.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              External
            </a>
          </p>
        </div>
      </QuoteablePassage>
    );
    await waitFor(() =>
      expect(container.querySelector(".tiptap a")?.textContent).toBe("Schedule")
    );
    expect(
      container.querySelector<HTMLInputElement>(".tiptap input")?.checked
    ).toBe(true);
    expect(
      container.querySelector<HTMLInputElement>(".tiptap input")?.disabled
    ).toBe(true);
    expect(
      screen.getByRole("link", { name: "Schedule" }).getAttribute("target")
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "External" }).getAttribute("target")
    ).toBe("_blank");
  });
  it("preserves formatted reading content in a read-only view without a static toolbar", async () => {
    const { container } = render(
      <QuoteablePassage
        onSubmit={async () => {
          await Promise.resolve();
        }}
      >
        <div className="takeaway-prose">
          <h2>The promise</h2>
          <p>
            Abraham <strong>believed</strong> God
          </p>
        </div>
      </QuoteablePassage>
    );
    await waitFor(() =>
      expect(container.querySelector(".tiptap strong")?.textContent).toBe(
        "believed"
      )
    );
    expect(
      container.querySelector(".tiptap")?.getAttribute("contenteditable")
    ).toBe("false");
    expect(screen.getByRole("heading", { name: "The promise" })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Quote selection" })
    ).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
