import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddMemberDialog } from "./add-member-dialog";

const state = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("~/trpc/react", () => ({
  api: {
    groups: {
      addMember: {
        useMutation: () => ({ isPending: false, mutate: state.mutate }),
      },
    },
    people: {
      accounts: {
        useQuery: () => ({
          data: [
            { id: "ana", image: null, name: "Ana Putri" },
            { id: "budi", image: null, name: "Budi Santoso" },
          ],
          isPending: false,
        }),
      },
    },
    useUtils: () => ({ groups: { invalidate: vi.fn() } }),
  },
}));

const ANA = /Ana Putri/;
const BUDI = /Budi Santoso/;

const groups = [
  { id: 1, members: [{ name: "Ana Putri" }], name: "Group 1" },
  { id: 2, members: [], name: "Group 2" },
];

const renderDialog = () =>
  render(
    <AddMemberDialog
      group={{ id: 2, name: "Group 2" }}
      groups={groups}
      onOpenChange={vi.fn()}
      open
    />
  );

describe("AddMemberDialog", () => {
  beforeEach(() => {
    state.mutate.mockReset();
  });

  it("adds a picked member by account", async () => {
    renderDialog();
    await userEvent.type(screen.getByPlaceholderText("Search members…"), "bud");
    await userEvent.click(screen.getByRole("option", { name: BUDI }));
    fireEvent.click(screen.getByRole("button", { name: "Add to Group 2" }));
    expect(state.mutate).toHaveBeenCalledWith(
      { groupId: 2, userId: "budi" },
      expect.anything()
    );
  });

  it("marks members already in a group this term", () => {
    renderDialog();
    const ana = screen.getByRole("option", { name: ANA });
    expect(ana.getAttribute("aria-disabled")).toBe("true");
    expect(ana.textContent).toContain("In Group 1");
  });

  it("adds a guest by name through the secondary action", async () => {
    renderDialog();
    await userEvent.click(
      screen.getByRole("button", { name: "Not on the site yet" })
    );
    await userEvent.type(screen.getByLabelText("Name"), "Guest Person");
    fireEvent.click(screen.getByRole("button", { name: "Add to Group 2" }));
    expect(state.mutate).toHaveBeenCalledWith(
      { groupId: 2, name: "Guest Person" },
      expect.anything()
    );
  });
});
