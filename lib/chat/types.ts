import type { UserSummary } from "@/lib/domain/types";

/**
 * Where a channel sits in the hierarchy:
 * - workspace: the one team-wide #general (announcements, wins, async standups)
 * - project:   each project's #general (anything that spans its modules)
 * - module:    one channel per module, created automatically with it
 * - direct:    a private conversation between two people
 */
export type ChannelKind = "workspace" | "project" | "module" | "direct";

export const QUICK_REACTIONS = ["🔥", "🚀", "👍", "💀", "💯", "🤡"] as const;
export type QuickReaction = (typeof QUICK_REACTIONS)[number];

export const MAX_MESSAGE_LENGTH = 4000;

export type ChannelSummary = {
  id: string;
  name: string;
  kind: ChannelKind;
  projectId: string | null;
  moduleId: string | null;
  /** Module display name for module channels. */
  moduleName?: string;
  /** Module icon for module channels. */
  icon?: string;
  /** Module progress for module channels, project progress for project channels. */
  progress?: number;
  /** Tasks due within 24h or overdue (module or whole project). */
  burning?: number;
};

export type ChatProjectGroup = {
  id: string;
  /** The id used in URLs (the demo project uses a friendly slug). */
  slug: string;
  name: string;
  channels: ChannelSummary[];
};

/** A teammate you can message. `channelId` is null until the conversation is first opened. */
export type ChatPerson = {
  userId: string;
  name: string;
  initials: string;
  channelId: string | null;
  unread: number;
};

export type ChatDirectory = {
  workspace: ChannelSummary[];
  projects: ChatProjectGroup[];
  people: ChatPerson[];
};

export type ChatReaction = { emoji: string; count: number; mine: boolean };

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  author: UserSummary;
  /** Present when the message is a comment posted from a task card. */
  task: { id: string; code: string | null; title: string } | null;
  /** Present when the message is a sticker that still exists. */
  sticker: { id: string; name: string } | null;
  reactions: ChatReaction[];
};
