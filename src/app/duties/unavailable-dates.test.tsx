import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UnavailableDates, { stillServing } from "./unavailable-dates";

const state = vi.hoisted(() => ({ add: vi.fn(), remove: vi.fn() }));
vi.mock("~/trpc/react", () => ({
  api: {
    unavailability: {
      add: { useMutation: () => ({ isPending: false, mutate: state.add }) },
      remove: {
        useMutation: () => ({ isPending: false, mutate: state.remove }),
      },
    },
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("UnavailableDates", () => {
  beforeEach(() => {
    state.add.mockReset();
    state.remove.mockReset();
  });

  it("lists the member's days with their note and removes one", () => {
    render(
      <UnavailableDates
        ranges={[
          {
            endsOn: "2026-10-31",
            id: 1,
            note: "Family visit",
            startsOn: "2026-10-31",
          },
          { endsOn: "2026-11-08", id: 2, note: null, startsOn: "2026-11-02" },
        ]}
      />
    );
    const list = screen.getByRole("list", { name: "Days you can't serve" });
    expect(within(list).getByText("Sat 31 Oct")).toBeTruthy();
    expect(within(list).getByText("Family visit")).toBeTruthy();
    expect(within(list).getByText("Mon 2 Nov – Sun 8 Nov")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Mon 2 Nov – Sun 8 Nov" })
    );
    expect(state.remove).toHaveBeenCalledWith({ id: 2 });
  });

  it("offers marking days when there are none yet", () => {
    render(<UnavailableDates ranges={[]} />);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByRole("button", { name: "Mark days" })).toBeTruthy();
  });
});

describe("stillServing", () => {
  it("names the slots the member keeps on those days", () => {
    expect(
      stillServing([
        { date: new Date("2026-11-21T14:30:00Z"), role: "musician", title: "" },
        {
          date: new Date("2026-11-22T14:30:00Z"),
          role: "note_writer",
          title: "",
        },
      ])
    ).toBe("musician on Sat 21 Nov, note writer on Sun 22 Nov");
  });
});
