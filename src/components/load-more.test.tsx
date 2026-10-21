import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LoadMore from "./load-more";

const props = {
  count: 10,
  hasNextPage: true,
  loading: false,
  noun: "takeaways",
};

describe("LoadMore", () => {
  it("shows nothing when the first page is the whole list", () => {
    const { container } = render(
      <LoadMore {...props} hasNextPage={false} onLoadMore={vi.fn()} />
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("keeps focus on the button while the next page loads", async () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <LoadMore {...props} onLoadMore={onLoadMore} />
    );
    const button = screen.getByRole("button", {
      name: "Load more takeaways",
    });
    await userEvent.click(button);
    rerender(<LoadMore {...props} loading onLoadMore={onLoadMore} />);

    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.textContent).toBe("Loading…");
    expect(document.activeElement).toBe(button);
    await userEvent.click(button);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("announces the new count and moves focus to the end note", async () => {
    const { rerender } = render(<LoadMore {...props} onLoadMore={vi.fn()} />);
    await userEvent.click(screen.getByRole("button"));
    rerender(
      <LoadMore
        {...props}
        count={14}
        hasNextPage={false}
        onLoadMore={vi.fn()}
      />
    );

    const end = screen.getByText("That’s everything: 14 takeaways.");
    expect(document.activeElement).toBe(end);
    expect(
      screen.getByText("Showing 14 takeaways.").getAttribute("aria-live")
    ).toBe("polite");
  });
});
