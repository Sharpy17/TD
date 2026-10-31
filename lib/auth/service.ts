import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "./passwords";
import {
  calculateSessionExpiry,
  generateSessionToken,
  generateWorkspaceSlug,
  hashSessionToken,
} from "./session";
import { deleteSessionCookie, getSessionCookie, setSessionCookie } from "./cookies";
import type { LoginInput, SignUpInput } from "./validations";

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthSessionUser;
  workspaceSlug?: string;
}

function sanitizeErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    if (
      error.message.includes("Environment variable not found") ||
      error.message.includes("DATABASE_URL")
    ) {
      return "Database configuration error: Missing DATABASE_URL in your .env file.";
    }
    if (
      error.message.includes("Can't reach database server") ||
      error.message.includes("P1001") ||
      error.message.includes("connect ECONNREFUSED")
    ) {
      return "Cannot connect to PostgreSQL server. Please check your database service.";
    }
    if (error.message.includes("Unique constraint failed") || error.message.includes("P2002")) {
      return "An account with this email already exists.";
    }
  }
  return defaultMessage;
}

/**
 * Registers a new user, hashes their password, and provisions their default workspace.
 */
export async function registerUser(input: SignUpInput): Promise<AuthResult> {
  const { name, email, password, workspaceName } = input;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: "An account with this email already exists" };
    }

    const passwordHash = await hashPassword(password);
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = calculateSessionExpiry();

    const finalWorkspaceName = workspaceName || `${name.trim()}'s Workspace`;
    const workspaceSlug = generateWorkspaceSlug(finalWorkspaceName);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email,
          name: name.trim(),
        },
      });

      // 2. Create Password Credential
      await tx.passwordCredential.create({
        data: {
          userId: user.id,
          passwordHash,
        },
      });

      // 3. Create Default Startup Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: finalWorkspaceName,
          slug: workspaceSlug,
        },
      });

      // 4. Assign OWNER role
      await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      // 5. Create active Session
      await tx.session.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      return { user, workspace };
    });

    // Set secure HTTP-only cookie
    await setSessionCookie(token, expiresAt);

    return {
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatarUrl: result.user.avatarUrl,
      },
      workspaceSlug: result.workspace.slug,
    };
  } catch (error) {
    console.error("[Auth:registerUser] Error during signup:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error,
        "Failed to create account. Please check database connection."
      ),
    };
  }
}

/**
 * Authenticates user credentials with timing attack and brute force resistance.
 */
export async function authenticateWithPassword(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        credential: true,
        memberships: {
          include: { workspace: true },
          take: 1,
        },
      },
    });

    // Check account lockout
    if (user?.credential?.lockedUntil && user.credential.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil(
        (user.credential.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      );
      return {
        success: false,
        error: `Account is temporarily locked. Please try again in ${waitMinutes} minute(s).`,
      };
    }

    // Verify password with constant-time compare against dummy hash on null
    const isValid = await verifyPassword(password, user?.credential?.passwordHash);

    if (!user || !user.credential || !isValid) {
      // If user exists, track failed attempts
      if (user?.credential) {
        const attempts = user.credential.failedLoginAttempts + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

        await prisma.passwordCredential.update({
          where: { userId: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil: lockUntil,
          },
        });
      }

      return { success: false, error: "Invalid email or password" };
    }

    // Reset failed login attempts on successful sign-in
    if (user.credential.failedLoginAttempts > 0) {
      await prisma.passwordCredential.update({
        where: { userId: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Create session
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = calculateSessionExpiry();

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await setSessionCookie(token, expiresAt);

    const primaryWorkspace = user.memberships[0]?.workspace?.slug;

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      workspaceSlug: primaryWorkspace,
    };
  } catch (error) {
    console.error("[Auth:authenticateWithPassword] Error:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error,
        "Authentication failed. Please verify database connectivity."
      ),
    };
  }
}

/**
 * Validates the current HTTP session and returns the logged in user profile.
 */
export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        // Expired session cleanup
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }

    // Update lastActiveAt periodically (sliding touch)
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});

    return session.user;
  } catch (error) {
    console.error("[Auth:getCurrentUser] Session lookup failed:", error);
    return null;
  }
}

/**
 * Logs out the current user by deleting the session from DB and wiping the cookie.
 */
export async function logout(): Promise<void> {
  const token = await getSessionCookie();
  if (token) {
    const tokenHash = hashSessionToken(token);
    try {
      await prisma.session.delete({ where: { tokenHash } });
    } catch {
      // Ignore if session record already deleted
    }
  }

  await deleteSessionCookie();
}

