import bcrypt from "bcryptjs";

// Work factor 12: OWASP recommended baseline for bcrypt
const BCRYPT_SALT_ROUNDS = 12;

// Pre-computed dummy hash to mitigate timing-based account enumeration attacks
// bcrypt hash of an arbitrary unreachable string with cost 12
const DUMMY_HASH =
  "$2a$12$e80M5tMfvIq4f9sJ3Xb3nO6g9bY6O7N9n0GgB6eFzL5d8C0l3K1yW";

/**
 * Hash a plain text password with a secure salt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify a plain text password against a stored hash.
 * If no hash is provided, verifies against the dummy hash to prevent timing attacks.
 */
export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined
): Promise<boolean> {
  const hashToCompare = storedHash || DUMMY_HASH;
  const match = await bcrypt.compare(password, hashToCompare);

  // If storedHash was missing, always return false regardless of dummy compare
  if (!storedHash) {
    return false;
  }

  return match;
}

