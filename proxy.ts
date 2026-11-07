import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/lib/auth/access";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

async function hasActiveSession(token: string): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      select: { expiresAt: true },
    });
    return !!session && session.expiresAt > new Date();
  } catch (error) {
    console.error("[proxy] Session lookup failed:", error);
    return false;
  }
}

/** Every page, API route and server action requires a real session, checked against the database. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token && (await hasActiveSession(token))) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
