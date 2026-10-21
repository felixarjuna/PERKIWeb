import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfileFunnel from "./profile-funnel";

describe("profile funnel", () => {
  it("links each step to the matching member list", () => {
    render(
      <ProfileFunnel funnel={{ accounts: 52, complete: 34, started: 41 }} />
    );
    expect(
      screen.getByRole("link", { name: "52 signed in" }).getAttribute("href")
    ).toBe("/admin/members");
    expect(
      screen
        .getByRole("link", { name: "41 started a profile" })
        .getAttribute("href")
    ).toBe("/admin/members?profile=incomplete%2Ccomplete");
    expect(
      screen.getByRole("link", { name: "34 complete" }).getAttribute("href")
    ).toBe("/admin/members?profile=complete");
    expect(
      screen
        .getByRole("link", { name: "Follow up with 18 people" })
        .getAttribute("href")
    ).toBe("/admin/members?profile=incomplete%2Cnot-started");
  });
});
