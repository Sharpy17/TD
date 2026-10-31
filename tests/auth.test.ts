import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth/passwords";
import {
  generateSessionToken,
  hashSessionToken,
  calculateSessionExpiry,
  generateWorkspaceSlug,
} from "../lib/auth/session";
import { SignUpSchema, LoginSchema } from "../lib/auth/validations";

describe("Password Hashing & Verification (lib/auth/passwords)", () => {
  it("hashes password and verifies correctly", async () => {
    const rawPassword = "SecretStartup123!";
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$2b$12$") || hash.startsWith("$2a$12$")).toBe(true);

    const isMatch = await verifyPassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword123!", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("handles missing stored hash by comparing against dummy hash and returning false", async () => {
    const isMatchNull = await verifyPassword("AnyPassword123!", null);
    expect(isMatchNull).toBe(false);

    const isMatchUndefined = await verifyPassword("AnyPassword123!", undefined);
    expect(isMatchUndefined).toBe(false);
  });
});

describe("Session & Token Generation (lib/auth/session)", () => {
  it("generates high-entropy tokens and valid SHA-256 hashes", () => {
    const token = generateSessionToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThanOrEqual(42);

    const hash1 = hashSessionToken(token);
    const hash2 = hashSessionToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // 256 bits = 64 hex characters

    const otherToken = generateSessionToken();
    const otherHash = hashSessionToken(otherToken);
    expect(otherHash).not.toBe(hash1);
  });

  it("calculates session expiry 30 days in the future", () => {
    const now = Date.now();
    const expiry = calculateSessionExpiry();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    expect(expiry.getTime()).toBeGreaterThanOrEqual(now + thirtyDaysMs - 1000);
    expect(expiry.getTime()).toBeLessThanOrEqual(now + thirtyDaysMs + 5000);
  });

  it("generates URL-safe workspace slugs", () => {
    const slug1 = generateWorkspaceSlug("Acme Studio");
    expect(slug1).toMatch(/^acme-studio-[a-f0-9]{6}$/);

    const slug2 = generateWorkspaceSlug("Super $#!@ Fast 2026");
    expect(slug2).toMatch(/^super-fast-2026-[a-f0-9]{6}$/);
  });
});

describe("Auth Input Validation (lib/auth/validations)", () => {
  it("validates and normalizes valid signup data", () => {
    const valid = SignUpSchema.safeParse({
      name: "  Alex Morgan  ",
      email: "  ALEX@STARTUP.IO  ",
      password: "StrongPassword123",
      workspaceName: "My Team",
    });

    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.name).toBe("Alex Morgan");
      expect(valid.data.email).toBe("alex@startup.io");
    }
  });

  it("rejects weak or invalid passwords", () => {
    // Too short (< 8)
    const short = SignUpSchema.safeParse({
      name: "Alex",
      email: "alex@startup.io",
      password: "short1",
    });
    expect(short.success).toBe(false);

    // No numbers
    const noNumbers = SignUpSchema.safeParse({
      name: "Alex",
      email: "alex@startup.io",
      password: "OnlyLettersHere",
    });
    expect(noNumbers.success).toBe(false);

    // No letters
    const noLetters = SignUpSchema.safeParse({
      name: "Alex",
      email: "alex@startup.io",
      password: "1234567890",
    });
    expect(noLetters.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const invalidEmail = LoginSchema.safeParse({
      email: "not-an-email",
      password: "Password123",
    });
    expect(invalidEmail.success).toBe(false);
  });
});
