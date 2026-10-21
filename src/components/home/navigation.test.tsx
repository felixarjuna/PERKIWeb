import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profileCompletion } from "~/lib/profile-completion";
import Navigation from "./navigation";

const state = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  session: { user: { id: "u1" } } as object | null,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/schedule",
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
    state.session = { user: { id: "u1" } };
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
});
