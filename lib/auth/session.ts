import crypto from "crypto";

export const SESSION_COOKIE_NAME = "daihub_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

/**
 * Generates a high-entropy cryptographically secure random session token.
 * 32 bytes = 256 bits of entropy.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Hashes a plaintext session token using SHA-256 before saving to the database.
 * If the database is ever breached, active session tokens cannot be replayed.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Calculates session expiry date from now.
 */
export function calculateSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_MAX_AGE_MS);
}

/**
 * Helper to generate URL-safe slugs for newly created workspaces.
 */
export function generateWorkspaceSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30) || "workspace";

  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

