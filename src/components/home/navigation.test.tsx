import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profileCompletion } from "~/lib/profile-completion";
import Navigation from "./navigation";

const state = vi.hoisted(() => ({
  pathname: "/schedule",
  profile: null as Record<string, unknown> | null,
  session: { user: { id: "u1" } } as object | null,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: state.session }),
}));
vi.mock("~/trpc/react", () => ({
  api: {
    profiles: {
      mine: {
        useQuery: () => ({
          data: state.session
            ? { completion: profileCompletion(state.profile) }
            : undefined,
        }),
      },
    },
  },
}));

const complete = {
  address: "Street 1",
  birthday: new Date("1990-01-01"),
  location: "Aachen",
  major: "CS",
  phoneNumber: "+49",
};

describe("navigation account item", () => {
  beforeEach(() => {
    state.pathname = "/schedule";
    state.session = { user: { id: "u1" } };
  });

  it("is highlighted on the account page like the other items", () => {
    state.profile = complete;
    state.pathname = "/account";
    render(<Navigation />);
    const account = screen.getByRole("button", { name: "Account" });
    expect(account.getAttribute("aria-current")).toBe("page");
    expect(account.querySelector("span")?.className).toContain("bg-primary");
    expect(
      screen
        .getByRole("link", { name: "Schedule" })
        .getAttribute("aria-current")
    ).toBeNull();
  });

  it("marks an unfinished profile", () => {
    state.profile = { location: "Aachen" };
    render(<Navigation />);
    expect(
      screen.getByRole("button", { name: "Account, profile incomplete" })
    ).toBeTruthy();
  });

  it("is plain once the profile is complete", () => {
    state.profile = complete;
    render(<Navigation />);
    expect(screen.getByRole("button", { name: "Account" })).toBeTruthy();
  });

  it("offers sign-in to visitors", () => {
    state.session = null;
    render(<Navigation />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });

  it("links members, not visitors, to their duties", () => {
    render(<Navigation />);
    expect(
      screen.getByRole("link", { name: "Duties" }).getAttribute("href")
    ).toBe("/duties");
    cleanup();
    state.session = null;
    render(<Navigation />);
    expect(screen.queryByRole("link", { name: "Duties" })).toBeNull();
  });
});
