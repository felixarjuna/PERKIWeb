import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DutiesCard from "./duties-card";

describe("Duties card", () => {
  it("names the next duty and links to all of them", () => {
    render(
      <DutiesCard
        next={{
          date: new Date("2026-10-24T13:30:00Z"),
          duties: [{ role: "musician" }, { group: "Group 3", role: "cooking" }],
          id: 7,
          title: "Heroes of Faith",
        }}
      />
    );
    expect(
      screen.getByText("Next: Musician, Cooking · Group 3 on Sat 24 Oct")
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "See your duties" }).getAttribute("href")
    ).toBe("/duties");
  });

  it("says when nothing is coming up", () => {
    render(<DutiesCard next={null} />);
    expect(screen.getByText("Nothing coming up for you")).toBeTruthy();
  });
});
