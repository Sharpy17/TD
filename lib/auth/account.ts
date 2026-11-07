import { getCurrentUser } from "@/lib/auth/service";
import { getActiveMembership, listUserWorkspaces } from "@/lib/workspaces/service";

/** The signed-in person as the sidebars show them, or null for a guest. */
export async function getSidebarAccount() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { name: user.name, email: user.email, workspaces: await listUserWorkspaces(user.id) };
}

/** The workspace the current page should show, or null when nobody is signed in. */
export async function getViewerWorkspace() {
  const user = await getCurrentUser();
  return user ? getActiveMembership(user.id) : null;
}
