import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { directChannelId, getDirectUnread, getOrCreateDirectChannel, markDirectRead } from "../lib/chat/direct";
import { canAccessChannel, createMessage, findChannel, getChatDirectory } from "../lib/chat/service";
import { getProjects } from "../lib/projects/service";
import { dropVoiceMember, listVoiceMembers, touchVoiceMember } from "../lib/realtime/hub";
import { getVoiceRooms } from "../lib/voice/service";
import {
  acceptInvite,
  createInvite,
  getActiveMembership,
  listInvites,
  listUserWorkspaces,
  lookupInvite,
  revokeInvite,
  switchWorkspace,
} from "../lib/workspaces/service";

describe("Workspaces, invites and direct messages", () => {
  const suffix = randomUUID();
  const ids = { owner: "", member: "", joiner: "", outsider: "" };
  let workspaceId: string;
  let otherWorkspaceId: string;

  beforeAll(async () => {
    workspaceId = (await prisma.workspace.create({ data: { name: "Team", slug: `team-${suffix}` } })).id;
    otherWorkspaceId = (await prisma.workspace.create({ data: { name: "Other", slug: `other-${suffix}` } })).id;
    for (const key of Object.keys(ids) as Array<keyof typeof ids>) {
      ids[key] = (await prisma.user.create({ data: { name: `${key} user`, email: `${key}-${suffix}@example.test` } })).id;
    }
    await prisma.membership.createMany({
      data: [
        { userId: ids.owner, workspaceId, role: "OWNER" },
        { userId: ids.member, workspaceId, role: "MEMBER" },
        { userId: ids.joiner, workspaceId: otherWorkspaceId, role: "OWNER" },
        { userId: ids.outsider, workspaceId: otherWorkspaceId, role: "MEMBER" },
      ],
    });
    await prisma.project.create({ data: { name: `Team project ${suffix}`, workspaceId } });
    await prisma.project.create({ data: { name: `Other project ${suffix}`, workspaceId: otherWorkspaceId } });
  });

  afterAll(async () => {
    await prisma.workspace.deleteMany({ where: { id: { in: [workspaceId, otherWorkspaceId] } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  });

  it("only lets owners and core members create invites", async () => {
    expect((await createInvite({ userId: ids.member, workspaceId, role: "MEMBER" })).success).toBe(false);
    expect((await createInvite({ userId: ids.outsider, workspaceId, role: "MEMBER" })).success).toBe(false);
    expect((await createInvite({ userId: ids.owner, workspaceId, role: "MEMBER" })).success).toBe(true);
  });

  it("joins through a link, makes that workspace active, and keeps the old one reachable", async () => {
    const invite = await createInvite({ userId: ids.owner, workspaceId, role: "MEMBER" });
    if (!invite.success) throw new Error(invite.error);

    expect((await getActiveMembership(ids.joiner))?.workspaceId).toBe(otherWorkspaceId);
    expect((await acceptInvite(invite.token, ids.joiner))?.workspaceId).toBe(workspaceId);
    expect((await getActiveMembership(ids.joiner))?.workspaceId).toBe(workspaceId);

    const workspaces = await listUserWorkspaces(ids.joiner);
    expect(workspaces.map((w) => w.id).sort()).toEqual([workspaceId, otherWorkspaceId].sort());
    expect(await switchWorkspace(ids.joiner, otherWorkspaceId)).toBe(true);
    expect((await getActiveMembership(ids.joiner))?.workspaceId).toBe(otherWorkspaceId);
    expect(await switchWorkspace(ids.joiner, workspaceId)).toBe(true);
  });

  it("never downgrades an existing member who uses a link", async () => {
    const invite = await createInvite({ userId: ids.owner, workspaceId, role: "GUEST" });
    if (!invite.success) throw new Error(invite.error);
    await acceptInvite(invite.token, ids.member);
    expect((await getActiveMembership(ids.member))?.role).toBe("MEMBER");
  });

  it("stops accepting revoked and expired links", async () => {
    const invite = await createInvite({ userId: ids.owner, workspaceId, role: "MEMBER" });
    if (!invite.success) throw new Error(invite.error);
    const active = await listInvites(workspaceId);
    expect(active.length).toBeGreaterThan(0);

    expect(await revokeInvite({ userId: ids.member, inviteId: active[0].id })).toBe(false);
    expect(await revokeInvite({ userId: ids.owner, inviteId: active[0].id })).toBe(true);
    expect(await lookupInvite(invite.token)).toBeNull();
    expect(await acceptInvite(invite.token, ids.outsider)).toBeNull();

    const expiring = await createInvite({ userId: ids.owner, workspaceId, role: "MEMBER" });
    if (!expiring.success) throw new Error(expiring.error);
    await prisma.workspaceInvite.updateMany({ where: { workspaceId, revokedAt: null }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await lookupInvite(expiring.token)).toBeNull();
    expect(await lookupInvite("not-a-real-token")).toBeNull();
  });

  it("shows each workspace only its own projects", async () => {
    const names = (await getProjects(workspaceId)).map(({ project }) => project.name);
    expect(names).toContain(`Team project ${suffix}`);
    expect(names).not.toContain(`Other project ${suffix}`);
  });

  it("keeps direct messages private to the two people in them", async () => {
    const channelId = await getOrCreateDirectChannel({ workspaceId, userId: ids.owner, otherUserId: ids.member });
    expect(channelId).toBe(directChannelId(workspaceId, ids.member, ids.owner));

    expect(await canAccessChannel(channelId!, ids.owner)).toBe(true);
    expect(await canAccessChannel(channelId!, ids.member)).toBe(true);
    // A workspace member who isn't in the conversation is locked out too.
    expect(await canAccessChannel(channelId!, ids.joiner)).toBe(false);
    expect(await canAccessChannel(channelId!, ids.outsider)).toBe(false);
    expect((await createMessage({ channelId: channelId!, authorId: ids.joiner, content: "let me in" })).success).toBe(false);
  });

  it("refuses conversations with yourself or someone outside the workspace", async () => {
    expect(await getOrCreateDirectChannel({ workspaceId, userId: ids.owner, otherUserId: ids.owner })).toBeNull();
    expect(await getOrCreateDirectChannel({ workspaceId, userId: ids.owner, otherUserId: ids.outsider })).toBeNull();
  });

  it("lists teammates and counts unread messages until they're opened", async () => {
    const channelId = (await getOrCreateDirectChannel({ workspaceId, userId: ids.owner, otherUserId: ids.member }))!;
    await createMessage({ channelId, authorId: ids.owner, content: "first" });
    await createMessage({ channelId, authorId: ids.owner, content: "second" });

    expect((await getDirectUnread(ids.member, workspaceId))[channelId]).toBe(2);
    expect((await getDirectUnread(ids.owner, workspaceId))[channelId]).toBe(0);

    const directory = await getChatDirectory(ids.member);
    const person = directory.people.find((p) => p.userId === ids.owner);
    expect(person).toMatchObject({ channelId, unread: 2 });
    expect(directory.people.some((p) => p.userId === ids.member)).toBe(false);
    expect(findChannel(directory, channelId)?.channel).toMatchObject({ kind: "direct", name: "owner user" });

    await markDirectRead(channelId, ids.member);
    expect((await getDirectUnread(ids.member, workspaceId))[channelId]).toBe(0);
  });

  it("seeds default voice rooms once, even when requested at the same moment", async () => {
    await Promise.all([getVoiceRooms(workspaceId), getVoiceRooms(workspaceId), getVoiceRooms(workspaceId)]);
    expect(await getVoiceRooms(workspaceId)).toHaveLength(4);
  });

  it("tracks voice rosters per workspace", () => {
    const member = { userId: ids.owner, roomId: "room-1", name: "Owner", initials: "OW", muted: false, deafened: false, sharing: false };
    touchVoiceMember(workspaceId, member);
    touchVoiceMember(workspaceId, { ...member, muted: true });

    expect(listVoiceMembers(workspaceId)).toEqual([{ ...member, muted: true }]);
    expect(listVoiceMembers(otherWorkspaceId)).toEqual([]);

    dropVoiceMember(workspaceId, ids.owner);
    expect(listVoiceMembers(workspaceId)).toEqual([]);
  });
});
