import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/service";
import { isDirectChannelId, markDirectRead } from "@/lib/chat/direct";
import { canAccessChannel, getMessages } from "@/lib/chat/service";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user || !(await canAccessChannel(channelId, user.id))) {
    return Response.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const messages = await getMessages(channelId, user.id);
    if (isDirectChannelId(channelId)) await markDirectRead(channelId, user.id);
    return Response.json(messages);
  } catch (err) {
    console.error(`[chat] Failed to load messages for ${channelId}:`, err);
    return Response.json({ error: "Failed to load messages." }, { status: 500 });
  }
}
