import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TakeawaySourceSettings from "./takeaway-source-settings";

const { saveSource } = vi.hoisted(() => ({ saveSource: vi.fn() }));
vi.mock("~/trpc/react", () => ({
  api: {
    settings: {
      removeTakeawaySource: {
        useMutation: () => ({ isPending: false, mutate: vi.fn() }),
      },
      saveTakeawaySource: {
        useMutation: () => ({ isPending: false, mutate: saveSource }),
      },
      takeawaySources: {
        useQuery: () => ({
          data: {
            changed: null,
            sources: [
              {
                id: "a",
                label: "2025",
                notes: {
                  id: "n",
                  url: "https://docs.google.com/document/d/n/edit",
                },
                tldr: null,
              },
            ],
          },
          isError: false,
          isPending: false,
        }),
      },
    },
    useUtils: () => ({
      settings: { takeawaySources: { invalidate: () => Promise.resolve() } },
      takeawayImport: { invalidate: () => Promise.resolve() },
    }),
  },
}));

describe("takeaway source settings", () => {
  it("lists the sources and adds another", async () => {
    render(<TakeawaySourceSettings />);
    expect(screen.getByText("Notes only, no TL;DR document")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Add source" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Name"), "2026");
    await userEvent.click(within(dialog).getByLabelText("Notes document"));
    await userEvent.paste("https://docs.google.com/document/d/abc/edit");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(saveSource).toHaveBeenCalledWith({
      id: null,
      label: "2026",
      notes: "https://docs.google.com/document/d/abc/edit",
      tldr: "",
    });
  });

  it("edits a source with its links filled in", async () => {
    render(<TakeawaySourceSettings />);
    await userEvent.click(
      screen.getByRole("button", { name: "Edit the source 2025" })
    );
    const dialog = screen.getByRole("dialog");
    expect(
      (within(dialog).getByLabelText("Notes document") as HTMLInputElement)
        .value
    ).toBe("https://docs.google.com/document/d/n/edit");
    expect(
      within(dialog).getByRole("button", { name: "Remove source" })
    ).toBeTruthy();
  });
});
