import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WelcomeForm from "./welcome-form";

const calls = vi.hoisted(() => ({
  markWelcomeSeen: vi.fn(),
  replace: vi.fn(),
  saveMine: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: calls.replace }),
}));
vi.mock("~/trpc/react", () => {
  const mutation =
    (fn: (input: unknown) => void) =>
    (options?: { onSuccess?: () => unknown }) => ({
      isPending: false,
      mutate: (input: unknown) => {
        fn(input);
        options?.onSuccess?.();
      },
    });
  return {
    api: {
      profiles: {
        markWelcomeSeen: { useMutation: mutation(calls.markWelcomeSeen) },
        saveMine: { useMutation: mutation(calls.saveMine) },
      },
      useUtils: () => ({ profiles: { invalidate: () => Promise.resolve() } }),
    },
  };
});

describe("welcome step", () => {
  beforeEach(() => {
    for (const fn of Object.values(calls)) {
      fn.mockReset();
    }
  });

  it("says why each detail is asked", () => {
    render(<WelcomeForm returnPath="/schedule" />);
    expect(screen.getByText("So we can celebrate with you")).toBeTruthy();
    expect(screen.getByLabelText("Studies")).toBeTruthy();
  });

  it("saves only what was filled in and goes on", async () => {
    render(<WelcomeForm returnPath="/schedule" />);
    await userEvent.type(screen.getByLabelText("Where you live"), "Aachen");
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" })
    );
    expect(calls.saveMine).toHaveBeenCalledWith({ location: "Aachen" });
    expect(calls.replace).toHaveBeenCalledWith("/schedule");
  });

  it("can be skipped, which is remembered", async () => {
    render(<WelcomeForm returnPath="/" />);
    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(calls.markWelcomeSeen).toHaveBeenCalled();
    expect(calls.saveMine).not.toHaveBeenCalled();
    expect(calls.replace).toHaveBeenCalledWith("/");
  });
});
