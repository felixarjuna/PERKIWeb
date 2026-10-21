import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WelcomeGate from "./welcome-gate";

const state = vi.hoisted(() => ({
  pathname: "/schedule",
  replace: vi.fn(),
  session: { user: { id: "u1" } } as object | null,
  welcomeDue: true as boolean | undefined,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ replace: state.replace }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: state.session }),
}));
vi.mock("~/trpc/react", () => ({
  api: {
    profiles: {
      mine: {
        useQuery: () => ({
          data:
            state.welcomeDue === undefined
              ? undefined
              : { welcomeDue: state.welcomeDue },
        }),
      },
    },
  },
}));

describe("welcome gate", () => {
  beforeEach(() => {
    state.pathname = "/schedule";
    state.replace.mockReset();
    state.session = { user: { id: "u1" } };
    state.welcomeDue = true;
    window.history.replaceState(null, "", "/schedule?week=2");
  });

  it("sends a person who hasn't seen the welcome step there", () => {
    render(<WelcomeGate />);
    expect(state.replace).toHaveBeenCalledWith(
      "/welcome?callbackUrl=%2Fschedule%3Fweek%3D2"
    );
  });

  it.each(["/", "/welcome", "/admin/members", "/auth/signin"])(
    "never redirects from %s",
    (pathname) => {
      state.pathname = pathname;
      render(<WelcomeGate />);
      expect(state.replace).not.toHaveBeenCalled();
    }
  );

  it("leaves people alone once the welcome is done or while loading", () => {
    state.welcomeDue = false;
    render(<WelcomeGate />);
    state.welcomeDue = undefined;
    render(<WelcomeGate />);
    state.session = null;
    state.welcomeDue = true;
    render(<WelcomeGate />);
    expect(state.replace).not.toHaveBeenCalled();
  });
});
