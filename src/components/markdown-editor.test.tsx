import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { linkHref, MarkdownEditor } from "./markdown-editor";

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
