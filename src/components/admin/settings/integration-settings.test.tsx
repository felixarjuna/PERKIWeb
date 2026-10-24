import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IntegrationSettings from "./integration-settings";

const { mutation, setTakeawayDoc, setWhatsappGroup } = vi.hoisted(() => ({
  mutation: (mutate: () => void = () => undefined) => ({
    useMutation: () => ({ isPending: false, mutate }),
  }),
  setTakeawayDoc: vi.fn(),
  setWhatsappGroup: vi.fn(),
}));
vi.mock("~/trpc/react", () => ({
  api: {
    settings: {
      email: {
        useQuery: () => ({
          data: { connected: false, enabled: false, sender: "" },
          isError: false,
          isPending: false,
        }),
      },
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
            takeawayNotesDoc: null,
            takeawayTldrDoc: null,
            whatsappGroup: null,
          },
          isError: false,
          isPending: false,
        }),
      },
      setDiscordInvite: mutation(),
      setDriveFolder: mutation(),
      setEmail: mutation(),
      setScheduleSheet: mutation(),
      setTakeawayDoc: mutation(setTakeawayDoc),
      setWhatsappGroup: mutation(setWhatsappGroup),
    },
    useUtils: () => ({
      scheduleImport: { invalidate: () => Promise.resolve() },
      settings: { invalidate: () => Promise.resolve() },
      takeawayImport: { invalidate: () => Promise.resolve() },
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

  it("adds the takeaway notes document", async () => {
    render(<IntegrationSettings />);
    await userEvent.click(
      screen.getByRole("button", {
        name: "Change the Takeaway notes document",
      })
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("textbox"));
    await userEvent.paste("https://docs.google.com/document/d/abc/edit");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(setTakeawayDoc).toHaveBeenCalledWith({
      document: "notes",
      link: "https://docs.google.com/document/d/abc/edit",
    });
  });
});
