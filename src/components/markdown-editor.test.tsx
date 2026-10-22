import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { linkHref, MarkdownEditor } from "./markdown-editor";

// jsdom has no layout; ProseMirror measures text when it scrolls to the cursor.
const noRects = () => [] as unknown as DOMRectList;
Range.prototype.getClientRects ??= noRects;
Range.prototype.getBoundingClientRect ??= () => new DOMRect();

describe("MarkdownEditor", () => {
  const setup = (value: string) => {
    const onChange = vi.fn();
    const view = render(
      <>
        <span id="label">Key points</span>
        <MarkdownEditor
          aria-labelledby="label"
          onChange={onChange}
          value={value}
        />
      </>
    );
    return { ...view, onChange };
  };

  it("shows the takeaway's Markdown formatted, labelled as a text box", async () => {
    setup("## Integritas Nuh\n\nDi **Kejadian 8:20**.\n\n- Mezbah");
    const box = await screen.findByRole("textbox", { name: "Key points" });
    expect(box.querySelector("h2")?.textContent).toBe("Integritas Nuh");
    expect(box.querySelector("strong")?.textContent).toBe("Kejadian 8:20");
    expect(box.querySelector("ul li")?.textContent).toBe("Mezbah");
    expect(box.className).toContain("takeaway-prose");
  });

  it("loads a value that arrives later, without reporting it as an edit", async () => {
    const { onChange, rerender } = setup("");
    await screen.findByRole("textbox");
    rerender(
      <>
        <span id="label">Key points</span>
        <MarkdownEditor
          aria-labelledby="label"
          onChange={onChange}
          value={"1. Satu\n2. Dua"}
        />
      </>
    );
    await waitFor(() =>
      expect(
        screen.getByRole("textbox").querySelectorAll("ol li")
      ).toHaveLength(2)
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("puts the cursor in the editor when its label is clicked", async () => {
    render(
      <>
        <label htmlFor="notes" id="label">
          Key points
        </label>
        <MarkdownEditor
          aria-labelledby="label"
          id="notes"
          onChange={vi.fn()}
          value="Halo"
        />
      </>
    );
    const box = await screen.findByRole("textbox", { name: "Key points" });
    await userEvent.click(screen.getByText("Key points"));
    await waitFor(() => expect(document.activeElement).toBe(box));
  });

  it("keeps focus in the editor when a tool is pressed", async () => {
    setup("Halo");
    const toolbar = await screen.findByRole("toolbar", { name: "Formatting" });
    for (const tool of toolbar.querySelectorAll("button:enabled")) {
      // A mousedown that isn't prevented moves focus to the button, and
      // keys typed before the editor takes it back are lost.
      expect(fireEvent.mouseDown(tool)).toBe(false);
    }
  });

  it("offers the formatting tools by name", async () => {
    setup("");
    const toolbar = await screen.findByRole("toolbar", { name: "Formatting" });
    for (const name of [
      "Heading",
      "Subheading",
      "Bold",
      "Italic",
      "Bulleted list",
      "Numbered list",
      "Quote",
      "Link",
    ]) {
      expect(toolbar.querySelector(`[aria-label="${name}"]`)).not.toBeNull();
    }
  });
});

describe("linkHref", () => {
  it("adds https:// to bare addresses and keeps the rest", () => {
    expect(linkHref(" alkitab.mobi/tb ")).toBe("https://alkitab.mobi/tb");
    expect(linkHref("https://perki.de")).toBe("https://perki.de");
    expect(linkHref("mailto:a@b.de")).toBe("mailto:a@b.de");
    expect(linkHref("/schedule")).toBe("/schedule");
    expect(linkHref("")).toBe("");
  });
});
