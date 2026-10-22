import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profileCompletion } from "~/lib/profile-completion";
import ProfileSummary from "./profile-summary";

const { saveMine } = vi.hoisted(() => ({ saveMine: vi.fn() }));
let profile: Record<string, string | Date | null>;
const incomplete = {
  address: "Roermonder Str. 110",
  birthday: new Date("2000-03-12T00:00:00.000Z"),
  location: "Aachen",
  major: "Informatik",
  nickname: null,
  phoneNumber: null,
};

// The role row has its own test.
vi.mock("./role-row", () => ({ default: () => null }));
vi.mock("~/trpc/react", () => ({
  api: {
    profiles: {
      mine: {
        useQuery: () => ({
          data: {
            completion: profileCompletion(profile),
            profile,
            welcomeDue: false,
          },
          isLoading: false,
        }),
      },
      saveMine: {
        useMutation: () => ({ isPending: false, mutate: saveMine }),
      },
    },
    users: {
      getUserById: {
        useQuery: () => ({
          data: {
            email: "maria@gmail.com",
            image: "https://lh3.googleusercontent.com/a/photo",
            name: "Maria Santoso",
          },
        }),
      },
    },
    useUtils: () => ({ profiles: { invalidate: () => Promise.resolve() } }),
  },
}));

describe("profile summary", () => {
  beforeEach(() => {
    saveMine.mockReset();
    profile = incomplete;
  });

  it("says Completed once every detail is filled in", () => {
    profile = { ...incomplete, phoneNumber: "+49 151 1234" };
    render(<ProfileSummary />);
    expect(screen.getByText("Completed")).toBeTruthy();
    // Filled: a solid circle with the check cut out of it.
    const icon = screen.getByText("Completed").querySelector("svg");
    expect(icon?.classList.contains("fill-current")).toBe(true);

    expect(screen.queryByText("5 of 5")).toBeNull();
  });

  it("shows progress and each detail, with Add for what's missing", () => {
    render(<ProfileSummary />);
    expect(screen.getByText("4 of 5")).toBeTruthy();
    // Says what's left rather than repeating the page subtitle.
    expect(screen.getByText("1 more to go.")).toBeTruthy();
    expect(
      screen
        .getByRole("progressbar", { name: "Profile" })
        .getAttribute("aria-valuenow")
    ).toBe("4");
    expect(
      screen.getByRole("button", { name: "Birthday 12 March" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Phone Add" })).toBeTruthy();
  });

  it("shows the Google name and email as locked, explained on tap", async () => {
    render(<ProfileSummary />);
    for (const [label, value] of [
      ["Name", "Maria Santoso"],
      ["Email", "maria@gmail.com"],
    ] as const) {
      const row = screen.getByText(label).closest("li");
      expect(row?.textContent).toContain(value);
      // The lock follows the label, close to it.
      const lock = within(row as HTMLElement).getByRole("button", {
        name: `${label} comes from Google`,
      });
      const labelText = screen.getByText(label);
      expect(labelText.parentElement?.lastElementChild?.contains(lock)).toBe(
        true
      );
      expect(labelText.parentElement?.classList.contains("gap-1")).toBe(true);
      // Long emails wrap instead of being cut off: the row can't be opened.
      const shown = within(row as HTMLElement).getByText(value);
      expect(shown.classList).not.toContain("truncate");
      expect(shown.classList).toContain("break-all");
    }
    await userEvent.click(
      screen.getByRole("button", { name: "Name comes from Google" })
    );
    expect(
      (
        await screen.findAllByText(
          "From your Google account. It can't be changed here."
        )
      ).length
    ).toBeGreaterThan(0);
  });

  it("shows the Google photo first, locked like the name", () => {
    render(<ProfileSummary />);
    const row = screen.getByText("Photo").closest("li") as HTMLElement;
    expect(screen.getAllByRole("listitem")[0]).toBe(row);
    expect(
      within(row).getByRole("button", { name: "Photo comes from Google" })
    ).toBeTruthy();
    // Initials stand in until (or unless) the photo loads.
    expect(within(row).getByText("MS")).toBeTruthy();
    // 32px, so the Photo row is as tall as Name and Email.
    expect(within(row).getByText("MS").parentElement?.classList).toContain(
      "size-8"
    );
  });

  it("keeps the optional nickname at the bottom of the details", async () => {
    render(<ProfileSummary />);
    const rows = screen.getAllByRole("listitem");
    expect(rows.at(-1)?.textContent).toContain("Nickname");
    // Optional is quiet text, not the cream chip that marks what's missing.
    const optional = screen.getByText("Optional");
    expect(optional.classList).not.toContain("bg-paper");
    expect(optional.classList).toContain("text-muted-foreground");
    await userEvent.click(
      screen.getByRole("button", { name: "Nickname Optional" })
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Nickname"), "Mimi");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(saveMine).toHaveBeenCalledWith(
      { nickname: "Mimi" },
      expect.anything()
    );
  });

  it("edits one field in a dialog that says why we ask", async () => {
    render(<ProfileSummary />);
    await userEvent.click(
      screen.getByRole("button", { name: "Studies Informatik" })
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("So we know what you study")).toBeTruthy();
    const input = within(dialog).getByLabelText("Studies");
    await userEvent.clear(input);
    await userEvent.type(input, "Physik");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(saveMine).toHaveBeenCalledWith(
      { major: "Physik" },
      expect.anything()
    );
  });
});
