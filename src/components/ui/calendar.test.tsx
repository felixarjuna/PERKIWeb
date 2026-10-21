import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "./calendar";

const renderDropdowns = () =>
  render(
    <Calendar
      captionLayout="dropdown"
      defaultMonth={new Date(2000, 2)}
      endMonth={new Date(2001, 0)}
      mode="single"
      startMonth={new Date(1999, 0)}
    />
  );

describe("calendar", () => {
  it("names months in English whatever the browser language", () => {
    renderDropdowns();
    const months = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    expect([...months.options].map((option) => option.text)).toContain("Mar");
  });

  it("uses filled month and year menus, not outlined ones", () => {
    renderDropdowns();
    const root = screen.getAllByRole("combobox")[0]?.parentElement;
    expect(root?.classList).toContain("bg-secondary");
    expect(root?.classList).not.toContain("border");
  });
});
