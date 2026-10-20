import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { Member } from "../members/member-model";
import BirthdayList from "./birthday-list";

const member = (index: number): Member => ({
  profiles: {
    address: null,
    bio: null,
    birthday: new Date(`1990-10-${String(index + 1).padStart(2, "0")}`),
    createdAt: null,
    id: `m${index}`,
    location: "Aachen",
    major: null,
    phoneNumber: null,
    updatedAt: null,
    userId: `u${index}`,
  },
  user: {
    email: null,
    id: `u${index}`,
    image: null,
    name: `Member ${index}`,
    role: "member" as const,
  },
});

it("shows five birthdays and links the rest to the filtered directory", () => {
  render(
    <BirthdayList
      members={Array.from({ length: 8 }, (_, index) => member(index))}
      month="October 2026"
      monthNumber={10}
    />
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(5);
  expect(
    screen
      .getByRole("link", { name: "+3 more in October" })
      .getAttribute("href")
  ).toBe("/admin/members?birthday=10&sort=birthday.asc");
});
