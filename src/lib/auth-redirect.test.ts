import { describe, expect, it } from "vitest";
import {
  authPageUrl,
  getReturnPath,
  getSameOriginReturnPath,
  requestedPath,
  welcomePath,
} from "./auth-redirect";

describe("return destinations", () => {
  it.each([
    "//example.com",
    "https://example.com",
    "javascript:alert(1)",
    "/auth/signin",
    "/api/auth/signout",
    "/%2fauth/signin",
    "/%5cexample.com",
    "/x/../auth/signin",
    "/%61uth/signin",
    "/%zz",
  ])("rejects %s", (path) => {
    expect(getReturnPath(path)).toBe("/");
  });
  it("preserves query parameters and fragments", () => {
    expect(getReturnPath("/schedule?month=10#service")).toBe(
      "/schedule?month=10#service"
    );
  });
  it("encodes the entire destination through signup", () => {
    expect(authPageUrl("signup", "/member/join?source=footer")).toBe(
      "/auth/signup?callbackUrl=%2Fmember%2Fjoin%3Fsource%3Dfooter"
    );
  });
  it("preserves repeated query parameters", () => {
    expect(
      requestedPath("/prayers", { empty: undefined, tag: ["one", "two"] })
    ).toBe("/prayers?tag=one&tag=two");
  });
});

describe("saved OAuth destinations", () => {
  it("recovers the application path from the callback cookie", () => {
    expect(
      getSameOriginReturnPath(
        "https://perki.test/prayers?filter=mine#wall",
        "https://perki.test"
      )
    ).toBe("/prayers?filter=mine#wall");
  });
  it("accepts a deployment hostname without a URL scheme", () => {
    expect(
      getSameOriginReturnPath(
        "https://perki.vercel.app/prayers",
        "perki.vercel.app"
      )
    ).toBe("/prayers");
  });
  it("rejects a callback cookie for another origin", () => {
    expect(
      getSameOriginReturnPath("https://evil.test/prayers", "https://perki.test")
    ).toBe("/");
  });
  it("rejects authentication loops in callback cookies", () => {
    expect(
      getSameOriginReturnPath(
        "https://perki.test/auth/signin",
        "https://perki.test"
      )
    ).toBe("/");
  });
});

describe("welcomePath", () => {
  it("keeps where the person was going", () => {
    expect(welcomePath("/schedule?week=2")).toBe(
      "/welcome?callbackUrl=%2Fschedule%3Fweek%3D2"
    );
  });

  it("drops unsafe or landing-page destinations", () => {
    expect(welcomePath("https://evil.test")).toBe("/welcome");
    expect(welcomePath("/")).toBe("/welcome");
  });
});
