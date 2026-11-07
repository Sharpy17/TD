import { describe, expect, it } from "vitest";
import { isPublicPath, isValidSignupCode } from "@/lib/auth/access";

describe("isPublicPath", () => {
  it("allows only the auth pages", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/signup/")).toBe(true);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/projects/daihub")).toBe(false);
    expect(isPublicPath("/api/tasks/1/comments")).toBe(false);
    expect(isPublicPath("/login/extra")).toBe(false);
  });
});

describe("isValidSignupCode", () => {
  it("accepts only the configured code", () => {
    expect(isValidSignupCode("secret", "secret", true)).toBe(true);
    expect(isValidSignupCode(" secret ", "secret", true)).toBe(true);
    expect(isValidSignupCode("wrong", "secret", true)).toBe(false);
    expect(isValidSignupCode(null, "secret", true)).toBe(false);
  });

  it("closes signup in production when no code is configured", () => {
    expect(isValidSignupCode("anything", undefined, true)).toBe(false);
    expect(isValidSignupCode("anything", "", true)).toBe(false);
  });

  it("keeps signup open in development when no code is configured", () => {
    expect(isValidSignupCode(null, undefined, false)).toBe(true);
  });
});
