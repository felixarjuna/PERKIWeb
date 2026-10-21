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
          data: { email: "maria@gmail.com", name: "Maria Santoso" },
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
    expect(screen.queryByText("5 of 5")).toBeNull();
  });

  it("shows progress and each detail, with Add for what's missing", () => {
    render(<ProfileSummary />);
    expect(screen.getByText("4 of 5")).toBeTruthy();
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

  it("shows the Google name and email as locked, with an optional nickname", async () => {
    render(<ProfileSummary />);
    for (const [label, value] of [
      ["Name", "Maria Santoso"],
      ["Email", "maria@gmail.com"],
    ] as const) {
      const row = screen.getByText(label).closest("li");
      expect(row?.textContent).toContain(value);
      expect(row?.textContent).toContain("From Google");
      expect(row?.querySelector("button")).toBeNull();
      expect(row?.querySelector(".lucide-lock")).toBeTruthy();
    }
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
