import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WhatsappCard from "./whatsapp-card";

const group = vi.hoisted(() => ({
  data: undefined as
    | { configured: boolean; unlocked: boolean; url: string | null }
    | undefined,
}));
vi.mock("~/trpc/react", () => ({
  api: {
    profiles: { whatsappGroup: { useQuery: () => ({ data: group.data }) } },
  },
}));

describe("WhatsApp card", () => {
  beforeEach(() => {
    group.data = undefined;
  });

  it("is hidden until staff set a link", () => {
    group.data = { configured: false, unlocked: true, url: null };
    const { container } = render(<WhatsappCard />);
    expect(container.textContent).toBe("");
  });

  it("says it unlocks once the profile is complete", () => {
    group.data = { configured: true, unlocked: false, url: null };
    render(<WhatsappCard />);
    expect(
      screen.getByText("Unlocks once your profile is complete")
    ).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("links to the group for a complete profile", () => {
    group.data = {
      configured: true,
      unlocked: true,
      url: "https://chat.whatsapp.com/AbC123",
    };
    render(<WhatsappCard />);
    const link = screen.getByRole("link", { name: "Join the WhatsApp group" });
    expect(link.getAttribute("href")).toBe("https://chat.whatsapp.com/AbC123");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});
