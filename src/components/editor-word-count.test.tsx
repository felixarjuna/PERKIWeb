import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorWordCount } from "./editor-word-count";

describe("editor word count", () => {
  it("counts the words a reader sees, without a limit", () => {
    render(<EditorWordCount markdown="## Faith\n\n- **Abraham** believed" />);
    expect(screen.getByText("3 words")).toBeTruthy();
  });

  it("says one word in the singular", () => {
    render(<EditorWordCount markdown="Faith" />);
    expect(screen.getByText("1 word")).toBeTruthy();
  });

  it("measures against a hint and stands out past it", () => {
    const { rerender } = render(
      <EditorWordCount hint={3} markdown="one two three" />
    );
    const count = screen.getByText("3 / about 3 words");
    expect(count.className).not.toContain("text-destructive-text");
    rerender(<EditorWordCount hint={3} markdown="one two three four" />);
    expect(screen.getByText("4 / about 3 words").className).toContain(
      "text-destructive-text"
    );
  });
});
