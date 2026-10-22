import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CircleCheck, CircleDot } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "./badge";

describe("shared Badge composition", () => {
  it("keeps decorative icons out of a containing button's accessible name", () => {
    render(
      <button type="button">
        <Badge icon={CircleCheck} size="status" variant="published">
          Verified
        </Badge>
      </button>
    );
    expect(
      screen.getByRole("button", { exact: true, name: "Verified" })
    ).toBeTruthy();
  });

  it.each(["draft", "review"] as const)(
    "preserves inline icon/text composition for %s comments",
    (variant) => {
      const { container } = render(
        <Badge size="status" variant={variant}>
          <CircleDot aria-hidden="true">
            <title>Comment status</title>
          </CircleDot>
          <span>Open comment</span>
        </Badge>
      );
      expect(screen.getByText("Open comment", { exact: true })).toBeTruthy();
      expect(container.querySelectorAll("svg")).toHaveLength(1);
    }
  );

  it("retains keyboard access to a composed removal action", async () => {
    const remove = vi.fn();
    const user = userEvent.setup();
    render(
      <Badge variant="secondary">
        Alias
        <button onClick={remove} type="button">
          Remove alias
        </button>
      </Badge>
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Remove alias" })
    );
    await user.keyboard("{Enter}");
    expect(remove).toHaveBeenCalledOnce();
  });
});
