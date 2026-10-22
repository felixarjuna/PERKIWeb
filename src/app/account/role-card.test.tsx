import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoleCard from "./role-card";

const state = vi.hoisted(() => ({
  history: undefined as unknown,
  mutate: vi.fn(),
  request: undefined as { status: string } | null | undefined,
  role: undefined as string | undefined,
}));
vi.mock("~/trpc/react", () => ({
  api: {
    access: {
      myRequest: { useQuery: () => ({ data: state.request }) },
      request: {
        useMutation: () => ({ isPending: false, mutate: state.mutate }),
      },
    },
    roles: {
      myHistory: { useQuery: () => ({ data: state.history }) },
      myRole: { useQuery: () => ({ data: state.role }) },
    },
    useUtils: () => ({ access: { myRequest: { invalidate: vi.fn() } } }),
  },
}));

describe("Your role card", () => {
  beforeEach(() => {
    state.mutate.mockReset();
    state.request = null;
    state.role = "member";
    state.history = { changes: [], joined: null };
  });

  it.each([
    ["writer", "Your role: Writer", "You can write takeaways"],
    [
      "mita",
      "Your role: Mita",
      "You can manage the website and write takeaways",
    ],
    ["owner", "Your role: Dev", "Full access"],
  ])(
    "tells a %s what their role allows, with no action",
    (role, title, line) => {
      state.role = role;
      render(<RoleCard />);
      expect(screen.getByRole("heading", { name: title })).toBeTruthy();
      expect(screen.getByText(line)).toBeTruthy();
      expect(screen.queryByRole("button")).toBeNull();
    }
  );

  it("lets a member ask to become a writer", () => {
    render(<RoleCard />);
    expect(
      screen.getByRole("heading", { name: "Your role: Member" })
    ).toBeTruthy();
    expect(
      screen.getByText("Want to write the takeaways from our services?")
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Ask to become a writer" })
    );
    expect(state.mutate).toHaveBeenCalledWith({ role: "writer" });
  });

  it("says the request is waiting for a mita", () => {
    state.request = { status: "pending" };
    render(<RoleCard />);
    expect(screen.getByText("Request sent, waiting for a mita")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("tells a member their request was declined and lets them ask again", () => {
    state.request = { status: "declined" };
    render(<RoleCard />);
    expect(
      screen.getByText("Your request to become a writer was declined")
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Ask again to become a writer" })
    );
    expect(state.mutate).toHaveBeenCalledWith({ role: "writer" });
  });

  it("tells a new writer their request was approved", () => {
    state.role = "writer";
    state.request = { status: "approved" };
    render(<RoleCard />);
    expect(
      screen.getByText("Your request was approved. You can write takeaways")
    ).toBeTruthy();
  });

  it("is the target of the takeaway page's hint", () => {
    const { container } = render(<RoleCard />);
    expect(container.querySelector("#your-role")).toBeTruthy();
  });

  it("lists the member's history, newest first, ending with when they joined", () => {
    state.role = "mita";
    state.history = {
      changes: [
        {
          createdAt: new Date("2025-09-01T10:00:00.000Z"),
          fromRole: "writer",
          id: 2,
          source: null,
          toRole: "mita",
        },
        {
          createdAt: new Date("2025-06-01T10:00:00.000Z"),
          fromRole: "member",
          id: 1,
          source: "request",
          toRole: "writer",
        },
      ],
      joined: { at: new Date("2025-03-04T10:00:00.000Z"), exact: true },
    };
    render(<RoleCard />);
    const list = screen.getByRole("list", { name: "Your history" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "You became a mita1 September 2025",
      "You became a writerYour request was approved · 1 June 2025",
      "You joined PERKI4 March 2025",
    ]);
  });

  it("shows no history list before there is anything to show", () => {
    render(<RoleCard />);
    expect(screen.queryByRole("list", { name: "Your history" })).toBeNull();
  });
});
