import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IntegrationSettings from "./integration-settings";

const { mutation, setWhatsappGroup } = vi.hoisted(() => ({
  mutation: (mutate: () => void = () => undefined) => ({
    useMutation: () => ({ isPending: false, mutate }),
  }),
  setWhatsappGroup: vi.fn(),
}));
vi.mock("~/trpc/react", () => ({
  api: {
    settings: {
      integrations: {
        useQuery: () => ({
          data: {
            discordInvite: {
              isDefault: true,
              updatedAt: null,
              updatedBy: null,
              url: "https://discord.gg/abc",
            },
            driveFolder: null,
            scheduleSheet: null,
            whatsappGroup: null,
          },
          isError: false,
          isPending: false,
        }),
      },
      setDiscordInvite: mutation(),
      setDriveFolder: mutation(),
      setScheduleSheet: mutation(),
      setWhatsappGroup: mutation(setWhatsappGroup),
    },
    useUtils: () => ({
      scheduleImport: { invalidate: () => Promise.resolve() },
      settings: { invalidate: () => Promise.resolve() },
    }),
  },
}));

describe("integration settings", () => {
  it("adds the WhatsApp group link", async () => {
    render(<IntegrationSettings />);
    expect(
      screen.getByText("Not set, so members don't see the group")
    ).toBeTruthy();
    await userEvent.click(
      screen.getByRole("button", { name: "Change the WhatsApp group link" })
    );
    const dialog = screen.getByRole("dialog");
    // Staff paste the invite; typing it key by key is slow under load.
    await userEvent.click(within(dialog).getByRole("textbox"));
    await userEvent.paste("https://chat.whatsapp.com/AbC123");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(setWhatsappGroup).toHaveBeenCalledWith({
      link: "https://chat.whatsapp.com/AbC123",
    });
  });
});
