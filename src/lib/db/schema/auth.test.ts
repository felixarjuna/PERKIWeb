import { describe, expect, it } from "vitest";
import {
  insertUserParams,
  insertUserSchema,
  updatePasswordParams,
  updateUserParams,
  updateUserSchema,
} from "./auth";

const MIN_PASSWORD = "12345678";

describe("insertUserParams (signup form)", () => {
  const valid = { name: "Felix", password: MIN_PASSWORD, username: "felix" };

  it("accepts a password of exactly 8 characters", () => {
    expect(insertUserParams.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than 8 characters with the form message", () => {
    const result = insertUserParams.safeParse({
      ...valid,
      password: "1234567",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["password"]);
    expect(result.error?.issues[0]?.message).toBe(
      "Password must be at least 8 characters."
    );
  });

  it("requires name, username and password", () => {
    const result = insertUserParams.safeParse({});
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path[0]).sort();
    expect(paths).toEqual(["name", "password", "username"]);
  });

  it("strips unknown keys such as hashedPassword", () => {
    const parsed = insertUserParams.parse({ ...valid, hashedPassword: "x" });
    expect(parsed).toEqual(valid);
  });
});

describe("updatePasswordParams (change-password form)", () => {
  const valid = {
    currentPassword: "old-password",
    id: "user-1",
    newPassword: "new-password",
    retypeNewPassword: "new-password",
  };

  it("accepts a complete payload", () => {
    expect(updatePasswordParams.safeParse(valid).success).toBe(true);
  });

  it("rejects empty password fields", () => {
    const result = updatePasswordParams.safeParse({
      ...valid,
      currentPassword: "",
      newPassword: "",
      retypeNewPassword: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(3);
  });

  it("enforces the same 8-character minimum as signup for the new password", () => {
    const result = updatePasswordParams.safeParse({
      ...valid,
      newPassword: "a",
      retypeNewPassword: "a",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("does not let hashedPassword through", () => {
    const parsed = updateUserSchema.parse({
      email: "a@b.c",
      hashedPassword: "evil",
      name: "A",
    });
    expect(parsed).not.toHaveProperty("hashedPassword");
  });

  it("allows a null image", () => {
    expect(
      updateUserSchema.safeParse({ email: "a@b.c", image: null, name: "A" })
        .success
    ).toBe(true);
  });
});

describe("updateUserParams", () => {
  it("requires id, name and username", () => {
    const result = updateUserParams.safeParse({ image: null });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path[0]).sort();
    expect(paths).toEqual(["id", "name", "username"]);
  });
});

describe("insertUserSchema (drizzle-zod)", () => {
  it("accepts a minimal row (all user columns are optional/defaulted)", () => {
    expect(insertUserSchema.safeParse({}).success).toBe(true);
  });

  it("rejects wrongly typed columns", () => {
    expect(insertUserSchema.safeParse({ email: 42 }).success).toBe(false);
  });
});
