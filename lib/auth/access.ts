import crypto from "crypto";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

/** The only routes a visitor without a session may reach. */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname.replace(/\/+$/, "") || "/") || pathname.startsWith("/invite/");
}

/**
 * Checks a signup invite code. With no code configured, signup stays open in development
 * and closed in production, so a missing variable can never expose a live deployment.
 */
export function isValidSignupCode(submitted: unknown, expected: string | undefined, isProduction: boolean): boolean {
  if (!expected) return !isProduction;
  if (typeof submitted !== "string") return false;
  const digest = (value: string) => crypto.createHash("sha256").update(value).digest();
  return crypto.timingSafeEqual(digest(submitted.trim()), digest(expected));
}
