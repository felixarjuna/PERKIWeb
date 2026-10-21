import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profileCompletion } from "~/lib/profile-completion";
import ProfileReminder, { SNOOZE_KEY } from "./profile-reminder";

const DAY_MS = 86_400_000;
const state = vi.hoisted(() => ({
  pathname: "/schedule",
  profile: null as Record<string, unknown> | null,
}));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));
vi.mock("~/trpc/react", () => ({
  api: {
    profiles: {
      mine: {
        useQuery: () => ({
          data: {
            completion: profileCompletion(state.profile),
            profile: state.profile,
            welcomeDue: false,
          },
        }),
      },
    },
  },
}));

const reminder = () =>
  screen.queryByRole("complementary", { name: "Complete your profile" });

describe("profile reminder", () => {
  beforeEach(() => {
    window.localStorage.clear();
    state.pathname = "/schedule";
    state.profile = { location: "Aachen", major: "CS", phoneNumber: "+49" };
  });

  it("shows how far the profile is and links to it", () => {
    render(<ProfileReminder />);
    expect(screen.getByText("Your profile is 3 of 5 done")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Finish my profile" })
        .getAttribute("href")
    ).toBe("/account");
  });

  it("stays away once the profile is complete, and on the profile pages", () => {
    state.pathname = "/account";
    const { unmount } = render(<ProfileReminder />);
    expect(reminder()).toBeNull();
    unmount();
    state.pathname = "/schedule";
    state.profile = {
      address: "Street 1",
      birthday: new Date("1990-01-01"),
      location: "Aachen",
      major: "CS",
      phoneNumber: "+49",
    };
    render(<ProfileReminder />);
    expect(reminder()).toBeNull();
  });

  it("snoozes for seven days, then comes back", async () => {
    const { unmount } = render(<ProfileReminder />);
    await userEvent.click(
      screen.getByRole("button", { name: "Remind me later" })
    );
    expect(reminder()).toBeNull();
    const until = Number(window.localStorage.getItem(SNOOZE_KEY));
    expect(until - Date.now()).toBeGreaterThan(6.9 * DAY_MS);
    expect(until - Date.now()).toBeLessThanOrEqual(7 * DAY_MS);
    unmount();

    render(<ProfileReminder />);
    expect(reminder()).toBeNull();
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() - 1));
    render(<ProfileReminder />);
    expect(reminder()).toBeTruthy();
  });
});
