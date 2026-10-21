import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignInForm from "./sign-in-form";

let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => searchParams,
}));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const googleButton = () =>
  screen.getByRole("button", { name: "Continue with Google" });

describe("Google sign-in", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    searchParams = new URLSearchParams();
  });
  it("offers only Google with no password or username fields", () => {
    render(<SignInForm />);
    expect(screen.queryByLabelText("Username")).toBeNull();
    expect(screen.queryByLabelText("Password")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(googleButton()).toBeDefined();
  });
  it("starts Google with the requested application destination", async () => {
    searchParams = new URLSearchParams({
      callbackUrl: "/member/join?source=footer",
    });
    render(<SignInForm />);
    await userEvent.setup().click(googleButton());
    expect(signIn).toHaveBeenCalledWith("google", {
      redirectTo: "/member/join?source=footer",
    });
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(
      true
    );
  });
  it.each([
    "javascript:alert(1)",
    "https://evil.test",
    "//evil.test",
    "/auth/signin",
    "/api/auth/signout",
  ])("rejects unsafe destination %s", async (callbackUrl) => {
    searchParams = new URLSearchParams({ callbackUrl });
    render(<SignInForm />);
    await userEvent.setup().click(googleButton());
    expect(signIn).toHaveBeenCalledWith("google", {
      redirectTo: "/welcome",
    });
  });
  it("goes through the welcome step when there is nowhere else to go", async () => {
    render(<SignInForm />);
    await userEvent.setup().click(googleButton());
    expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/welcome" });
  });
  it("uses the safe destination recovered by the server after an OAuth error", async () => {
    searchParams = new URLSearchParams({ error: "OAuthCallbackError" });
    render(<SignInForm returnPath="/prayers" />);
    expect(screen.getByRole("alert")).toBeDefined();
    await userEvent.setup().click(googleButton());
    expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/prayers" });
  });
  it("allows retry after a connection error", async () => {
    vi.mocked(signIn).mockRejectedValueOnce(new Error("Network unavailable"));
    render(<SignInForm />);
    await userEvent.setup().click(googleButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect((googleButton() as HTMLButtonElement).disabled).toBe(false);
    await userEvent.setup().click(googleButton());
    expect(signIn).toHaveBeenCalledTimes(2);
  });
});
