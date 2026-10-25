import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditScheduleForm from "./edit-schedule-form";

const state = vi.hoisted(() => ({
  mutate: vi.fn(),
  schedule: undefined as Record<string, unknown> | undefined,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("~/trpc/react", () => ({
  api: {
    groups: {
      getCurrent: {
        useQuery: () => ({ data: { groups: [{ name: "Group 1" }] } }),
      },
    },
    schedules: {
      getScheduleById: { useQuery: () => ({ data: state.schedule }) },
      updateSchedule: {
        useMutation: () => ({ isPending: false, mutate: state.mutate }),
      },
    },
    speakers: {
      active: { useQuery: () => ({ data: [{ name: "Pdt. Example" }] }) },
    },
    useUtils: () => ({}),
  },
}));

const STORED = {
  accommodation: null,
  bibleVerse: "John 3:16",
  cancelled: false,
  cleaningGroup: "Group 1",
  cookingGroup: null,
  date: new Date("2031-03-08T14:30:00Z"),
  description: "Weekly Bible study.",
  flags: [],
  id: 7,
  // Not in the picker list in src/lib/data.tsx.
  leader: "Someone Not Listed",
  multimedia: null,
  musician: "Danny Kurniawan",
  // A liturgist, but not in the note writer list.
  noteWriter: "Toni Setiawan",
  preacher: null,
  title: "Bible study",
  type: "bible_study",
};

describe("Edit schedule form", () => {
  beforeEach(() => {
    state.mutate.mockReset();
    state.schedule = undefined;
  });

  it("shows a stored name that isn't in the picker list and keeps it on save", async () => {
    // The schedule arrives after the first render, as it does from the query.
    const view = render(<EditScheduleForm />);
    state.schedule = STORED;
    view.rerender(<EditScheduleForm />);

    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Leader" }).textContent).toBe(
        "Someone Not Listed"
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(state.mutate).toHaveBeenCalled());
    expect(state.mutate.mock.calls[0]?.[0]).toMatchObject({
      id: 7,
      leader: "Someone Not Listed",
      musician: "Danny Kurniawan",
      noteWriter: "Toni Setiawan",
    });
  });
});
