import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmailSettings from "./email-settings";

const { config, save } = vi.hoisted(() => ({
  config: { connected: false, enabled: false, sender: "" },
  save: vi.fn(),
}));
vi.mock("~/trpc/react", () => ({
  api: {
    settings: {
      email: {
        useQuery: () => ({ data: config, isError: false, isPending: false }),
      },
      setEmail: { useMutation: () => ({ isPending: false, mutate: save }) },
    },
    useUtils: () => ({ settings: { email: { invalidate: vi.fn() } } }),
  },
}));

describe("email settings", () => {
  beforeEach(() => {
    config.connected = false;
    config.enabled = false;
    config.sender = "";
    save.mockReset();
  });

  it("shows connection status and saves sender and switch together", async () => {
    render(<EmailSettings />);
    expect(screen.getByText("Not connected")).toBeTruthy();
    await userEvent.type(
      screen.getByLabelText("Sender address"),
      "invites@example.com"
    );
    await userEvent.click(
      screen.getByRole("switch", { name: "Send invite emails" })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Save email settings" })
    );
    expect(save).toHaveBeenCalledWith({
      enabled: true,
      sender: "invites@example.com",
    });
  });

  it("shows saved settings and lets staff turn email off", async () => {
    config.connected = true;
    config.enabled = true;
    config.sender = "invites@example.com";
    render(<EmailSettings />);
    expect(screen.getByText("Connected")).toBeTruthy();
    await userEvent.click(
      screen.getByRole("switch", { name: "Send invite emails" })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Save email settings" })
    );
    expect(save).toHaveBeenCalledWith({
      enabled: false,
      sender: "invites@example.com",
    });
  });
});
