import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoleRow from "./role-row";

const state = vi.hoisted(() => ({
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
    roles: { myRole: { useQuery: () => ({ data: state.role }) } },
    useUtils: () => ({ access: { myRequest: { invalidate: vi.fn() } } }),
  },
}));

const renderRow = () =>
  render(
    <ul>
      <RoleRow />
    </ul>
  );

describe("Your role row", () => {
  beforeEach(() => {
    state.mutate.mockReset();
    state.request = null;
    state.role = "member";
  });

  it("shows the role read-only, with no action for staff or writers", () => {
    state.role = "mita";
    renderRow();
    expect(screen.getByText("Your role")).toBeTruthy();
    expect(screen.getByText("Mita")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("lets a member ask to become a writer", () => {
    renderRow();
    expect(screen.getByText("Member")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Ask to become a writer" })
    );
    expect(state.mutate).toHaveBeenCalledWith({ role: "writer" });
  });

  it("says the request is waiting for a mita", () => {
    state.request = { status: "pending" };
    renderRow();
    expect(screen.getByText("Request sent, waiting for a mita")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("tells a member their request was declined and lets them ask again", () => {
    state.request = { status: "declined" };
    renderRow();
    expect(
      screen.getByText("Your request to become a writer was declined")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ask again" })).toBeTruthy();
  });

  it("tells a new writer their request was approved", () => {
    state.role = "writer";
    state.request = { status: "approved" };
    renderRow();
    expect(screen.getByText("Writer")).toBeTruthy();
    expect(
      screen.getByText("Your request to become a writer was approved")
    ).toBeTruthy();
  });

  it("is the target of the takeaway page's hint", () => {
    const { container } = renderRow();
    expect(container.querySelector("#your-role")).toBeTruthy();
  });
});
