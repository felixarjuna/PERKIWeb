import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

it("draws popovers without a border, like every overlay", () => {
  render(
    <Popover open>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent>Inside</PopoverContent>
    </Popover>
  );
  expect(screen.getByText("Inside").classList).not.toContain("border");
});

it("marks its content so a calendar inside sits flush on it", () => {
  render(
    <Popover open>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent>Inside</PopoverContent>
    </Popover>
  );
  expect(screen.getByText("Inside").dataset.slot).toBe("popover-content");
});
