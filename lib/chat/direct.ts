import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { publish, userTopic } from "@/lib/realtime/hub";

const DIRECT_PREFIX = "dm-";

export const isDirectChannelId = (channelId: string) => channelId.startsWith(DIRECT_PREFIX);

/** The same pair in the same workspace always maps to the same channel, whoever starts it. */
export function directChannelId(workspaceId: string, userA: string, userB: string): string {
  const key = [workspaceId, ...[userA, userB].sort()].join(":");
  return `${DIRECT_PREFIX}${crypto.createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
}

/** Opens the conversation between two members of a workspace, or null if either isn't a member. */
export async function getOrCreateDirectChannel(input: {
  workspaceId: string;
  userId: string;
  otherUserId: string;
}): Promise<string | null> {
  const { workspaceId, userId, otherUserId } = input;
  if (userId === otherUserId) return null;

  const members = await prisma.membership.count({
    where: { workspaceId, userId: { in: [userId, otherUserId] } },
  });
  if (members !== 2) return null;

  const id = directChannelId(workspaceId, userId, otherUserId);
  await prisma.channel.upsert({
    where: { id },
    update: {},
    create: {
      id,
      name: "direct",
      isDirect: true,
      workspaceId,
      participants: { connect: [{ id: userId }, { id: otherUserId }] },
    },
  });
  return id;
}

/** Messages from other people that arrived after the user last opened the conversation. */
async function unreadIn(channelId: string, userId: string, lastReadAt: Date | null): Promise<number> {
  return prisma.message.count({
    where: { channelId, authorId: { not: userId }, ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}) },
  });
}

/** Unread count per direct conversation in one workspace. */
export async function getDirectUnread(userId: string, workspaceId: string): Promise<Record<string, number>> {
  const channels = await prisma.channel.findMany({
    where: { workspaceId, isDirect: true, participants: { some: { id: userId } } },
    select: { id: true, reads: { where: { userId }, select: { lastReadAt: true } } },
  });
  const counts = await Promise.all(
    channels.map(
      async (channel) => [channel.id, await unreadIn(channel.id, userId, channel.reads[0]?.lastReadAt ?? null)] as const,
    ),
  );
  return Object.fromEntries(counts);
}

export async function getTotalDirectUnread(userId: string, workspaceId: string): Promise<number> {
  return Object.values(await getDirectUnread(userId, workspaceId)).reduce((sum, count) => sum + count, 0);
}

async function publishUnread(userId: string, workspaceId: string) {
  publish(userTopic(userId), { type: "unread", total: await getTotalDirectUnread(userId, workspaceId) });
}

/** Tells the other participants a message arrived, so their badges update live. */
export async function notifyDirectMessage(channelId: string, authorId: string): Promise<void> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { workspaceId: true, participants: { where: { id: { not: authorId } }, select: { id: true } } },
  });
  if (!channel) return;
  await Promise.all(channel.participants.map(({ id }) => publishUnread(id, channel.workspaceId)));
}

/** Marks a conversation read, and refreshes the user's badges only when something changed. */
export async function markDirectRead(channelId: string, userId: string): Promise<void> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { workspaceId: true, reads: { where: { userId }, select: { lastReadAt: true } } },
  });
  if (!channel) return;

  const unread = await unreadIn(channelId, userId, channel.reads[0]?.lastReadAt ?? null);
  const now = new Date();
  await prisma.directRead.upsert({
    where: { channelId_userId: { channelId, userId } },
    update: { lastReadAt: now },
    create: { channelId, userId, lastReadAt: now },
  });
  if (unread > 0) await publishUnread(userId, channel.workspaceId);
}
