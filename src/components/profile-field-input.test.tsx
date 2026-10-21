import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProfileFieldInput from "./profile-field-input";

const MARCH_12_2000 = /^Birthday, March 12th, 2000$/;
const MARCH_20_2000 = /March 20th, 2000/;
const PICK_A_DATE = /^Birthday, Pick a date$/;

describe("birthday field", () => {
  it("uses the calendar picker, starting at the saved month", async () => {
    const onChange = vi.fn();
    render(
      <ProfileFieldInput
        field="birthday"
        id="birthday"
        onChange={onChange}
        value="2000-03-12"
      />
    );
    const trigger = screen.getByRole("button", { name: MARCH_12_2000 });
    await userEvent.click(trigger);
    const calendar = screen.getByRole("dialog");
    // Month and year dropdowns make a birth year a quick pick.
    expect(within(calendar).getAllByRole("combobox")).toHaveLength(2);
    await userEvent.click(
      within(calendar).getByRole("button", { name: MARCH_20_2000 })
    );
    expect(onChange).toHaveBeenCalledWith("2000-03-20");
  });

  it("asks to pick a date when empty", () => {
    render(
      <ProfileFieldInput field="birthday" id="b" onChange={vi.fn()} value="" />
    );
    expect(screen.getByRole("button", { name: PICK_A_DATE })).toBeTruthy();
  });
});
