import type { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { demoProject, demoProjectSlug } from "@/lib/data/demo";
import { calculateProgress } from "@/lib/domain/progress";
import { getDeadlineStatus } from "@/lib/domain/deadlines";
import { taskCode } from "@/lib/domain/taskCodes";
import { getActiveMembership } from "@/lib/workspaces/service";
import { directChannelId, getDirectUnread } from "./direct";
import { isSingleEmoji } from "./emoji";
import type { TaskStatus } from "@/lib/domain/types";
import {
  PROJECT_CHANNEL_NAME,
  WORKSPACE_CHANNEL_NAME,
  moduleChannelName,
  projectChannelId,
  workspaceChannelId,
} from "./names";
import {
  MAX_MESSAGE_LENGTH,
  QUICK_REACTIONS,
  type ChannelSummary,
  type ChatDirectory,
  type ChatMessage,
  type ChatPerson,
  type ChatProjectGroup,
} from "./types";

/*
 * Channel model
 * -------------
 * Conversations follow the same hierarchy as the work itself:
 *
 *   Workspace  #general              team-wide announcements, wins, async standups
 *   Project    #general              cross-module talk for one product
 *              #mod-<module> × N     one per module; task comments land here too
 *
 * Module channels belong to a project because module names repeat across projects
 * ("Auth" in two products are two different conversations). Channels are created lazily
 * and idempotently, so modules and projects need no extra setup step.
 */

const DEFAULT_MESSAGE_LIMIT = 100;

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function urlSlug(projectId: string) {
  return projectId === demoProject.id ? demoProjectSlug : projectId;
}

async function workspaceRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}

/**
 * Guests only see the module channels they are assigned to; everyone else sees the whole workspace.
 */
function canSee(role: WorkspaceRole | null, userId: string, moduleAssigneeIds: readonly string[] | null) {
  if (!role) return false;
  if (role !== "GUEST") return true;
  return moduleAssigneeIds !== null && moduleAssigneeIds.includes(userId);
}

/** Creates any missing workspace, project and module channels and keeps module channel names in sync. */
export async function syncWorkspaceChannels(workspaceId: string): Promise<void> {
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: {
      id: true,
      channels: { where: { moduleId: null }, select: { id: true } },
      modules: { select: { id: true, name: true, channel: { select: { id: true, name: true, projectId: true } } } },
    },
  });

  const missing: Array<{ id?: string; name: string; workspaceId: string; projectId?: string; moduleId?: string }> = [
    { id: workspaceChannelId(workspaceId), name: WORKSPACE_CHANNEL_NAME, workspaceId },
  ];
  const renames: Array<{ id: string; name: string; projectId: string }> = [];

  for (const project of projects) {
    if (!project.channels.some((channel) => channel.id === projectChannelId(project.id))) {
      missing.push({ id: projectChannelId(project.id), name: PROJECT_CHANNEL_NAME, workspaceId, projectId: project.id });
    }
    for (const mod of project.modules) {
      const name = moduleChannelName(mod.name);
      if (!mod.channel) {
        missing.push({ name, workspaceId, projectId: project.id, moduleId: mod.id });
      } else if (mod.channel.name !== name || mod.channel.projectId !== project.id) {
        // Renamed module, or a channel created before channels knew their project.
        renames.push({ id: mod.channel.id, name, projectId: project.id });
      }
    }
  }

  await prisma.channel.createMany({ data: missing, skipDuplicates: true });
  await Promise.all(
    renames.map(({ id, name, projectId }) => prisma.channel.update({ where: { id }, data: { name, projectId } })),
  );
}

/** Returns the module's channel id, creating the channel on first use. */
export async function ensureModuleChannel(moduleId: string): Promise<string | null> {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, name: true, projectId: true, channel: { select: { id: true } }, project: { select: { workspaceId: true } } },
  });
  if (!mod) return null;
  if (mod.channel) return mod.channel.id;

  const channel = await prisma.channel.upsert({
    where: { moduleId: mod.id },
    update: {},
    create: {
      name: moduleChannelName(mod.name),
      workspaceId: mod.project.workspaceId,
      projectId: mod.projectId,
      moduleId: mod.id,
    },
    select: { id: true },
  });
  return channel.id;
}

/**
 * Everything a member can open in the chat sidebar: the workspace #general, then each project with
 * its #general and module channels (with live progress and burning counts for the headers).
 */
export async function getChatDirectory(userId: string, nowMs: number = Date.now()): Promise<ChatDirectory> {
  const empty: ChatDirectory = { workspace: [], projects: [], people: [] };
  const membership = await getActiveMembership(userId);
  if (!membership) return empty;
  const { workspaceId, role } = membership;

  await syncWorkspaceChannels(workspaceId);

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      modules: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          icon: true,
          assignees: { select: { id: true } },
          channel: { select: { id: true, name: true } },
          tasks: { select: { status: true, dueAt: true } },
        },
      },
    },
  });

  const isBurning = (task: { status: string; dueAt: Date | null }) => {
    const status = getDeadlineStatus(task.dueAt?.toISOString() ?? null, nowMs, task.status as TaskStatus);
    return status === "burning" || status === "overdue";
  };

  const groups: ChatProjectGroup[] = [];
  for (const project of projects) {
    const moduleChannels: ChannelSummary[] = [];
    let progressSum = 0;
    let burningTotal = 0;

    for (const mod of project.modules) {
      const progress = calculateProgress(mod.tasks);
      const burning = mod.tasks.filter(isBurning).length;
      progressSum += progress;
      burningTotal += burning;

      if (!mod.channel || !canSee(role, userId, mod.assignees.map((person) => person.id))) continue;
      moduleChannels.push({
        id: mod.channel.id,
        name: mod.channel.name,
        kind: "module",
        projectId: project.id,
        moduleId: mod.id,
        moduleName: mod.name,
        icon: mod.icon,
        progress,
        burning,
      });
    }

    const channels: ChannelSummary[] = [];
    if (canSee(role, userId, null)) {
      channels.push({
        id: projectChannelId(project.id),
        name: PROJECT_CHANNEL_NAME,
        kind: "project",
        projectId: project.id,
        moduleId: null,
        progress: project.modules.length ? Math.round(progressSum / project.modules.length) : 0,
        burning: burningTotal,
      });
    }
    channels.push(...moduleChannels);

    if (channels.length) groups.push({ id: project.id, slug: urlSlug(project.id), name: project.name, channels });
  }

  const [teammates, unread, existingDirect] = await Promise.all([
    prisma.membership.findMany({
      where: { workspaceId, userId: { not: userId } },
      orderBy: { user: { name: "asc" } },
      select: { user: { select: { id: true, name: true } } },
    }),
    getDirectUnread(userId, workspaceId),
    prisma.channel.findMany({
      where: { workspaceId, isDirect: true, participants: { some: { id: userId } } },
      select: { id: true },
    }),
  ]);
  const existingIds = new Set(existingDirect.map((channel) => channel.id));
  const people: ChatPerson[] = teammates.map(({ user }) => {
    const channelId = directChannelId(workspaceId, userId, user.id);
    return {
      userId: user.id,
      name: user.name,
      initials: initials(user.name),
      channelId: existingIds.has(channelId) ? channelId : null,
      unread: unread[channelId] ?? 0,
    };
  });

  return {
    people,
    workspace: canSee(role, userId, null)
      ? [{ id: workspaceChannelId(workspaceId), name: WORKSPACE_CHANNEL_NAME, kind: "workspace", projectId: null, moduleId: null }]
      : [],
    projects: groups,
  };
}

/** Finds a channel inside a directory; returns its project group too (null for workspace channels). */
export function findChannel(directory: ChatDirectory, channelId: string) {
  const workspaceChannel = directory.workspace.find((channel) => channel.id === channelId);
  if (workspaceChannel) return { channel: workspaceChannel, project: null };
  const person = directory.people.find((candidate) => candidate.channelId === channelId);
  if (person) {
    const channel: ChannelSummary = { id: channelId, name: person.name, kind: "direct", projectId: null, moduleId: null };
    return { channel, project: null };
  }
  for (const project of directory.projects) {
    const channel = project.channels.find((candidate) => candidate.id === channelId);
    if (channel) return { channel, project };
  }
  return null;
}

/** Whether a user may read and post in a channel. */
export async function canAccessChannel(channelId: string, userId: string): Promise<boolean> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      workspaceId: true,
      isDirect: true,
      participants: { where: { id: userId }, select: { id: true } },
      module: { select: { assignees: { select: { id: true } } } },
    },
  });
  if (!channel) return false;
  if (channel.isDirect) return channel.participants.length > 0;
  const role = await workspaceRole(userId, channel.workspaceId);
  return canSee(role, userId, channel.module ? channel.module.assignees.map((person) => person.id) : null);
}

const messageSelect = {
  id: true,
  content: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
  task: { select: { id: true, title: true, number: true, module: { select: { name: true } } } },
  sticker: { select: { id: true, name: true } },
  reactions: { select: { emoji: true, userId: true } },
} as const;

type MessageRow = {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string };
  task: { id: string; title: string; number: number | null; module: { name: string } } | null;
  sticker: { id: string; name: string } | null;
  reactions: Array<{ emoji: string; userId: string }>;
};

function toChatMessage(row: MessageRow, viewerId: string | null): ChatMessage {
  const counts = new Map<string, { count: number; mine: boolean }>();
  for (const reaction of row.reactions) {
    const entry = counts.get(reaction.emoji) ?? { count: 0, mine: false };
    entry.count += 1;
    entry.mine ||= reaction.userId === viewerId;
    counts.set(reaction.emoji, entry);
  }
  const order = (emoji: string) => {
    const index = (QUICK_REACTIONS as readonly string[]).indexOf(emoji);
    return index === -1 ? QUICK_REACTIONS.length : index;
  };

  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    author: { id: row.author.id, name: row.author.name, initials: initials(row.author.name) },
    task: row.task
      ? { id: row.task.id, title: row.task.title, code: taskCode(row.task.module.name, row.task.number) }
      : null,
    sticker: row.sticker,
    reactions: [...counts.entries()]
      .sort(([a], [b]) => order(a) - order(b))
      .map(([emoji, entry]) => ({ emoji, count: entry.count, mine: entry.mine })),
  };
}

/** The latest messages of a channel, oldest first. */
export async function getMessages(
  channelId: string,
  viewerId: string | null = null,
  limit: number = DEFAULT_MESSAGE_LIMIT,
): Promise<ChatMessage[]> {
  const rows = await prisma.message.findMany({
    where: { channelId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(1, limit), 200),
    select: messageSelect,
  });
  return rows.reverse().map((row) => toChatMessage(row, viewerId));
}

export async function createMessage(input: {
  channelId: string;
  authorId: string;
  content: string;
}): Promise<Result<{ message: ChatMessage }>> {
  const content = input.content.trim();
  if (!content) return { success: false, error: "Message cannot be empty." };
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.` };
  }

  try {
    if (!(await canAccessChannel(input.channelId, input.authorId))) {
      return { success: false, error: "You don't have access to this channel." };
    }
    const row = await prisma.message.create({
      data: { content, channelId: input.channelId, authorId: input.authorId },
      select: messageSelect,
    });
    return { success: true, message: toChatMessage(row, input.authorId) };
  } catch (err) {
    console.error(`[createMessage] Failed for channel ${input.channelId}:`, err);
    return { success: false, error: "Failed to send message." };
  }
}

/** Posts a sticker from the channel's own workspace. */
export async function createStickerMessage(input: {
  channelId: string;
  authorId: string;
  stickerId: string;
}): Promise<Result<{ message: ChatMessage }>> {
  try {
    if (!(await canAccessChannel(input.channelId, input.authorId))) {
      return { success: false, error: "You don't have access to this channel." };
    }
    const [channel, sticker] = await Promise.all([
      prisma.channel.findUnique({ where: { id: input.channelId }, select: { workspaceId: true } }),
      prisma.sticker.findUnique({ where: { id: input.stickerId }, select: { id: true, name: true, workspaceId: true } }),
    ]);
    if (!channel || !sticker || sticker.workspaceId !== channel.workspaceId) {
      return { success: false, error: "That sticker isn't available here." };
    }

    const row = await prisma.message.create({
      data: {
        content: `Sticker: ${sticker.name}`,
        channelId: input.channelId,
        authorId: input.authorId,
        stickerId: sticker.id,
      },
      select: messageSelect,
    });
    return { success: true, message: toChatMessage(row, input.authorId) };
  } catch (err) {
    console.error(`[createStickerMessage] Failed for channel ${input.channelId}:`, err);
    return { success: false, error: "Failed to send sticker." };
  }
}

/** Adds the reaction, or removes it when the user already reacted with that emoji. */
export async function toggleReaction(input: {
  messageId: string;
  userId: string;
  emoji: string;
}): Promise<Result<{ channelId: string; active: boolean }>> {
  if (!isSingleEmoji(input.emoji)) {
    return { success: false, error: "Unsupported reaction." };
  }

  try {
    const message = await prisma.message.findUnique({ where: { id: input.messageId }, select: { channelId: true } });
    if (!message) return { success: false, error: "Message not found." };
    if (!(await canAccessChannel(message.channelId, input.userId))) {
      return { success: false, error: "You don't have access to this channel." };
    }

    const key = { messageId_userId_emoji: { messageId: input.messageId, userId: input.userId, emoji: input.emoji } };
    const removed = await prisma.reaction.deleteMany({ where: key.messageId_userId_emoji });
    if (removed.count === 0) {
      await prisma.reaction.upsert({ where: key, update: {}, create: key.messageId_userId_emoji });
    }
    return { success: true, channelId: message.channelId, active: removed.count === 0 };
  } catch (err) {
    console.error(`[toggleReaction] Failed for message ${input.messageId}:`, err);
    return { success: false, error: "Failed to update reaction." };
  }
}
