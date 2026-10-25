import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OpenSlots, { type OpenSlot } from "./open-slots";

const state = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("~/trpc/react", () => ({
  api: {
    schedules: {
      takeSlot: {
        useMutation: () => ({
          isPending: false,
          mutate: state.mutate,
          variables: undefined,
        }),
      },
    },
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const slot = (overrides: Partial<OpenSlot> = {}): OpenSlot => ({
  date: new Date("2026-10-31T14:30:00Z"),
  refusal: null,
  role: "musician",
  scheduleId: 1,
  title: "Saturday service",
  type: "church_service",
  warning: null,
  ...overrides,
});

describe("OpenSlots", () => {
  beforeEach(() => {
    state.mutate.mockReset();
  });

  it("shows nothing to members who aren't active in a role", () => {
    const { container } = render(<OpenSlots active={false} slots={[]} />);
    expect(container.textContent).toBe("");
  });

  it("says so when nothing is open in the member's roles", () => {
    render(<OpenSlots active slots={[]} />);
    expect(
      screen.getByText("No open slots in your roles in the next 8 weeks.")
    ).toBeTruthy();
  });

  it("lists open slots by gathering and takes one with a tap", () => {
    render(
      <OpenSlots
        active
        slots={[
          slot(),
          slot({ role: "note_writer" }),
          slot({
            date: new Date("2026-11-07T14:30:00Z"),
            scheduleId: 2,
            title: "Next service",
            warning: "You already serve as note writer that day.",
          }),
        ]}
      />
    );
    const region = screen.getByRole("region", { name: "Open slots" });
    const first = within(region).getByRole("listitem", {
      name: "Saturday service",
    });
    expect(
      within(first).getByRole("link", { name: "Saturday service" })
    ).toBeTruthy();
    fireEvent.click(
      within(first).getByRole("button", { name: "Take Note writer" })
    );
    expect(state.mutate).toHaveBeenCalledWith({
      role: "note_writer",
      scheduleId: 1,
    });
    expect(
      screen.getByText("You already serve as note writer that day.")
    ).toBeTruthy();
  });

  it("shows why a slot can't be taken, without a button", () => {
    render(
      <OpenSlots
        active
        slots={[
          slot({
            refusal:
              "Your group cooks that day, so you can't serve as musician too.",
          }),
        ]}
      />
    );
    expect(
      screen.getByText(
        "Your group cooks that day, so you can't serve as musician too."
      )
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Take Musician" })).toBeNull();
  });
});
