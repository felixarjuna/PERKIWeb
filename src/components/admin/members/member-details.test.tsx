import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { expect, it } from "vitest";
import MemberDetails from "./member-details";

function DetailHarness() {
  const [open, setOpen] = useState(true);
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <>
      <input aria-label="Search members" id="member-search" />
      <MemberDetails
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
