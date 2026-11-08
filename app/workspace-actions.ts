"use server";

import { getCurrentUser } from "@/lib/auth/service";
import {
  INVITABLE_ROLES,
  canManageInvites,
  createInvite,
  getActiveMembership,
  listInvites,
  revokeInvite,
  switchWorkspace,
  type InvitableRole,
  type InviteSummary,
} from "@/lib/workspaces/service";

type InviteResult = { success: true; token: string } | { success: false; error: string };

export async function createInviteAction(role: InvitableRole): Promise<InviteResult> {
  const user = await getCurrentUser();
  const membership = user ? await getActiveMembership(user.id) : null;
  if (!user || !membership) return { success: false, error: "Sign in to invite people." };
  if (!INVITABLE_ROLES.includes(role)) return { success: false, error: "Choose a valid role." };
  return createInvite({ userId: user.id, workspaceId: membership.workspaceId, role });
}

export async function listInvitesAction(): Promise<InviteSummary[]> {
  const user = await getCurrentUser();
  const membership = user ? await getActiveMembership(user.id) : null;
  if (!membership || !canManageInvites(membership.role)) return [];
  return listInvites(membership.workspaceId);
}

export async function revokeInviteAction(inviteId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || typeof inviteId !== "string") return false;
  return revokeInvite({ userId: user.id, inviteId });
}

export async function switchWorkspaceAction(workspaceId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || typeof workspaceId !== "string") return false;
  return switchWorkspace(user.id, workspaceId);
}
