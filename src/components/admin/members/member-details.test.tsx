import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { expect, it, vi } from "vitest";
import MemberDetails from "./member-details";
import type { Member } from "./member-model";

const { viewerRole } = vi.hoisted(() => ({ viewerRole: { current: "mita" } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("~/trpc/react", () => ({
  api: {
    roles: {
      getHistory: {
        useQuery: () => ({
          data: [
            {
              changedByName: "Mia",
              createdAt: new Date(Date.now() - 2 * 86_400_000),
              fromRole: "member",
              toRole: "mita",
            },
            {
              changedByName: null,
              createdAt: new Date(Date.now() - 3 * 86_400_000),
              fromRole: "member",
              toRole: "writer",
            },
          ],
          isLoading: false,
        }),
      },
      myRole: { useQuery: () => ({ data: viewerRole.current }) },
      setRole: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
    useUtils: () => ({
      profiles: { invalidate: () => Promise.resolve() },
      roles: { invalidate: () => Promise.resolve() },
    }),
  },
}));

const target = (role: "owner" | "member"): Member => ({
  profiles: {
    address: null,
    bio: null,
    birthday: null,
    createdAt: null,
    id: "p1",
    location: null,
    major: null,
    phoneNumber: null,
    updatedAt: null,
    userId: "u1",
  },
  user: { email: "t@test.local", id: "u1", image: null, name: "Tess", role },
});

function DetailHarness({ member }: { member?: Member }) {
  const [open, setOpen] = useState(true);
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <>
      <input aria-label="Search members" id="member-search" />
      <MemberDetails
        member={member}
        onOpenChange={setOpen}
        open={open}
        returnFocus={returnFocus}
      />
    </>
  );
}

it("returns focus to the directory search when details were opened through a URL", async () => {
  const user = userEvent.setup();
  render(<DetailHarness />);
  await user.click(screen.getByRole("button", { name: "Close" }));
  await screen.findByRole("textbox", { name: "Search members" });
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Search members" })
    )
  );
});

it("shows the owner read-only with no role select", () => {
  render(<DetailHarness member={target("owner")} />);
  expect(screen.getByText("The owner's role can't be changed.")).toBeTruthy();
  expect(screen.queryByRole("combobox", { name: "Role" })).toBeNull();
});

it("offers a role select to staff for a non-owner and lists history", () => {
  render(<DetailHarness member={target("member")} />);
  expect(screen.getByRole("combobox", { name: "Role" })).toBeTruthy();
  expect(screen.getByText("Mita · changed by Mia · 2 days ago")).toBeTruthy();
});

it("credits history rows without a changer to the setup script", () => {
  render(<DetailHarness member={target("member")} />);
  expect(
    screen.getByText("Writer · changed by setup script · 3 days ago")
  ).toBeTruthy();
});
