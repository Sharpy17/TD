import { getCurrentUser } from "@/lib/auth/service";

/** The signed-in person as the sidebars show them, or null for a guest. */
export async function getSidebarAccount(): Promise<{ name: string; email: string } | null> {
  const user = await getCurrentUser();
  return user ? { name: user.name, email: user.email } : null;
}
