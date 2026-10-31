"use server";

import { getCurrentUser } from "@/lib/auth/service";
import { createMessage, toggleReaction } from "@/lib/chat/service";
import type { ChatMessage } from "@/lib/chat/types";
import { chatTopic, publish } from "@/lib/realtime/hub";

export async function sendMessageAction(
  channelId: string,
  content: string,
): Promise<{ success: true; message: ChatMessage } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sign in to send messages." };
  if (typeof channelId !== "string" || typeof content !== "string") return { success: false, error: "Invalid message." };

  const result = await createMessage({ channelId, authorId: user.id, content });
  if (result.success) publish(chatTopic(channelId), { type: "messages", channelId });
  return result;
}

export async function toggleReactionAction(
  messageId: string,
  emoji: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sign in to react." };
  if (typeof messageId !== "string" || typeof emoji !== "string") return { success: false, error: "Invalid reaction." };

  const result = await toggleReaction({ messageId, userId: user.id, emoji });
  if (!result.success) return result;
  publish(chatTopic(result.channelId), { type: "messages", channelId: result.channelId });
  return { success: true };
}
