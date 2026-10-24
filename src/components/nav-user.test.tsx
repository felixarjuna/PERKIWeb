import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "~/components/ui/sidebar";
import { NavUser } from "./nav-user";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));

const TRIGGER = /Ann/;
const user = { avatar: "", email: "ann@example.com", name: "Ann" };

describe("NavUser", () => {
  it("offers the member site next to the account", async () => {
    render(
      <SidebarProvider>
        <NavUser user={user} />
      </SidebarProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: TRIGGER }));
    const account = await screen.findByRole("menuitem", { name: "Account" });
    const site = screen.getByRole("menuitem", { name: "Open the site" });
    expect(account.getAttribute("href")).toBe("/account");
    expect(site.getAttribute("href")).toBe("/schedule");
    expect(site.parentElement).toBe(account.parentElement);
  });
});
