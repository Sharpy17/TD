import crypto from "crypto";
import type { WorkspaceRole } from "@prisma/client";
import { hashSessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const INVITABLE_ROLES = ["MEMBER", "GUEST"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export type ActiveMembership = { workspaceId: string; workspaceName: string; role: WorkspaceRole };
export type InviteSummary = { id: string; role: WorkspaceRole; expiresAt: string; useCount: number };
export type InvitePreview = { id: string; workspaceId: string; workspaceName: string; role: WorkspaceRole };

/** Owners and core members run the workspace; only they can bring people in. */
export function canManageInvites(role: WorkspaceRole | null | undefined): boolean {
  return role === "OWNER" || role === "CORE";
}

/** The workspace a user is working in: the one they chose, otherwise their oldest membership. */
export async function getActiveMembership(userId: string): Promise<ActiveMembership | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      activeWorkspaceId: true,
      memberships: {
        orderBy: { createdAt: "asc" },
        select: { workspaceId: true, role: true, workspace: { select: { name: true } } },
      },
    },
  });
  if (!user || user.memberships.length === 0) return null;
  const chosen = user.memberships.find((m) => m.workspaceId === user.activeWorkspaceId) ?? user.memberships[0];
  return { workspaceId: chosen.workspaceId, workspaceName: chosen.workspace.name, role: chosen.role };
}

export async function listUserWorkspaces(userId: string): Promise<Array<{ id: string; name: string; active: boolean }>> {
  const [active, memberships] = await Promise.all([
    getActiveMembership(userId),
    prisma.membership.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { workspace: { select: { id: true, name: true } } },
    }),
  ]);
  return memberships.map(({ workspace }) => ({ ...workspace, active: workspace.id === active?.workspaceId }));
}

export async function switchWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { id: true },
  });
  if (!membership) return false;
  await prisma.user.update({ where: { id: userId }, data: { activeWorkspaceId: workspaceId } });
  return true;
}

/** Creates an invite link. The token is shown once; only its hash is stored. */
export async function createInvite(input: {
  userId: string;
  workspaceId: string;
  role: InvitableRole;
}): Promise<{ success: true; token: string } | { success: false; error: string }> {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: input.userId, workspaceId: input.workspaceId } },
    select: { role: true },
  });
  if (!canManageInvites(membership?.role)) {
    return { success: false, error: "Only workspace owners and core members can invite people." };
  }

  const token = crypto.randomBytes(24).toString("base64url");
  await prisma.workspaceInvite.create({
    data: {
      tokenHash: hashSessionToken(token),
      role: input.role,
      workspaceId: input.workspaceId,
      createdById: input.userId,
      expiresAt: new Date(Date.now() + INVITE_LIFETIME_MS),
    },
  });
  return { success: true, token };
}

export async function listInvites(workspaceId: string): Promise<InviteSummary[]> {
  const invites = await prisma.workspaceInvite.findMany({
    where: { workspaceId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, role: true, expiresAt: true, useCount: true },
  });
  return invites.map((invite) => ({ ...invite, expiresAt: invite.expiresAt.toISOString() }));
}

export async function revokeInvite(input: { userId: string; inviteId: string }): Promise<boolean> {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: input.inviteId },
    select: { workspaceId: true },
  });
  if (!invite) return false;
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: input.userId, workspaceId: invite.workspaceId } },
    select: { role: true },
  });
  if (!canManageInvites(membership?.role)) return false;
  await prisma.workspaceInvite.update({ where: { id: input.inviteId }, data: { revokedAt: new Date() } });
  return true;
}

/** Resolves a link to its workspace, or null when it is unknown, revoked or expired. */
export async function lookupInvite(token: string): Promise<InvitePreview | null> {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      id: true,
      role: true,
      workspaceId: true,
      revokedAt: true,
      expiresAt: true,
      workspace: { select: { name: true } },
    },
  });
  if (!invite || invite.revokedAt || invite.expiresAt <= new Date()) return null;
  return { id: invite.id, workspaceId: invite.workspaceId, workspaceName: invite.workspace.name, role: invite.role };
}

/** Joins the workspace and makes it active. An existing member keeps their current role. */
export async function acceptInvite(token: string, userId: string): Promise<InvitePreview | null> {
  const invite = await lookupInvite(token);
  if (!invite) return null;

  await prisma.$transaction([
    prisma.membership.upsert({
      where: { userId_workspaceId: { userId, workspaceId: invite.workspaceId } },
      update: {},
      create: { userId, workspaceId: invite.workspaceId, role: invite.role },
    }),
    prisma.workspaceInvite.update({ where: { id: invite.id }, data: { useCount: { increment: 1 } } }),
    prisma.user.update({ where: { id: userId }, data: { activeWorkspaceId: invite.workspaceId } }),
  ]);
  return invite;
}
