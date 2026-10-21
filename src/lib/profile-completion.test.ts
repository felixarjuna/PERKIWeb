import { describe, expect, it } from "vitest";
import { PROFILE_FIELDS, profileCompletion } from "./profile-completion";

const full = {
  address: "Musterstr. 1",
  birthday: new Date("2000-02-29T00:00:00.000Z"),
  location: "Aachen",
  major: "Informatik",
  phoneNumber: "+49 123",
};

describe("profileCompletion", () => {
  it("is not started without a profile", () => {
    expect(profileCompletion(null)).toEqual({
      filled: 0,
      missing: [...PROFILE_FIELDS],
      state: "not-started",
      total: 5,
    });
  });

  it("counts an empty profile as incomplete", () => {
    expect(profileCompletion({})).toMatchObject({
      filled: 0,
      state: "incomplete",
    });
  });

  it("is complete when all five fields are filled", () => {
    expect(profileCompletion(full)).toEqual({
      filled: 5,
      missing: [],
      state: "complete",
      total: 5,
    });
  });

  it("treats whitespace-only text as missing", () => {
    expect(profileCompletion({ ...full, phoneNumber: "  " })).toMatchObject({
      filled: 4,
      missing: ["phoneNumber"],
      state: "incomplete",
    });
  });

  it("treats an invalid birthday as missing", () => {
    expect(
      profileCompletion({ ...full, birthday: new Date("invalid") }).missing
    ).toEqual(["birthday"]);
  });

  it("lists missing fields in form order", () => {
    expect(profileCompletion({ location: "Aachen" }).missing).toEqual([
      "birthday",
      "phoneNumber",
      "address",
      "major",
    ]);
  });
});
