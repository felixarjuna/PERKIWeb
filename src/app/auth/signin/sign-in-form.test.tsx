import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignInForm from "./sign-in-form";

const GOOGLE_BUTTON = /Continue with Google/;

const router = { push: vi.fn(), refresh: vi.fn() };
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const fillAndSubmit = async (username: string, password: string) => {
  const user = userEvent.setup();
  if (username) {
    await user.type(screen.getByLabelText("Username"), username);
  }
  if (password) {
    await user.type(screen.getByLabelText("Password"), password);
  }
  await user.click(screen.getByRole("button", { name: "Sign in" }));
};

describe("SignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("shows both validation messages and does not call signIn when empty", async () => {
    render(<SignInForm />);
    await fillAndSubmit("", "");

    expect(
      await screen.findByText("Please enter your username.")
    ).toBeDefined();
    expect(screen.getByText("Please enter your password.")).toBeDefined();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("requires the password when only the username is given", async () => {
    render(<SignInForm />);
    await fillAndSubmit("felix", "");

    expect(
      await screen.findByText("Please enter your password.")
    ).toBeDefined();
    expect(screen.queryByText("Please enter your username.")).toBeNull();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("signs in with credentials and goes to the callback url", async () => {
    vi.mocked(signIn).mockResolvedValue({
      code: undefined,
      error: undefined,
      ok: true,
      status: 200,
      url: null,
    });
    searchParams = new URLSearchParams({ callbackUrl: "/account" });
    render(<SignInForm />);

    await fillAndSubmit("felix", "secret123");

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/account"));
    expect(signIn).toHaveBeenCalledWith("credentials", {
      password: "secret123",
      redirect: false,
      username: "felix",
    });
    expect(router.refresh).toHaveBeenCalled();
  });

  it("defaults the callback url to /", async () => {
    vi.mocked(signIn).mockResolvedValue({
      code: undefined,
      error: undefined,
      ok: true,
      status: 200,
      url: null,
    });
    render(<SignInForm />);

    await fillAndSubmit("felix", "secret123");

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
  });

  it("shows an error toast and stays on the page for wrong credentials", async () => {
    vi.mocked(signIn).mockResolvedValue({
      code: "credentials",
      error: "CredentialsSignin",
      ok: false,
      status: 401,
      url: null,
    });
    render(<SignInForm />);

    await fillAndSubmit("felix", "wrong");

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Sign in failed", {
        description: "Username or password is wrong.",
      })
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("button", { name: "Sign in" }) as HTMLButtonElement)
        .disabled
    ).toBe(false);
  });

  it("starts the Google flow with the callback url", async () => {
    searchParams = new URLSearchParams({ callbackUrl: "/prayers" });
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.click(screen.getByRole("button", { name: GOOGLE_BUTTON }));

    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/prayers" });
  });
});
