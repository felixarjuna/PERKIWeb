import { describe, expect, it } from "vitest";
import { welcomeTitle } from "./welcome-name";

describe("welcomeTitle", () => {
  it("greets by first name", () => {
    expect(welcomeTitle("  Maria Santoso ")).toBe("Welcome, Maria");
  });

  it("falls back without a name", () => {
    expect(welcomeTitle(null)).toBe("Welcome");
    expect(welcomeTitle("  ")).toBe("Welcome");
  });
});
