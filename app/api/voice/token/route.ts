import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";
import { listVoiceMembers } from "@/lib/realtime/hub";
import { createVoiceToken, isVoiceConfigured } from "@/lib/voice/livekit";

const bodySchema = z.object({ roomId: z.string().min(1).max(64) });

/** Issues a voice pass to a member of the room's workspace, while the room has space. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to join voice." }, { status: 401 });
  if (!isVoiceConfigured()) return Response.json({ error: "Voice isn't set up on this server." }, { status: 503 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid room." }, { status: 400 });

  const room = await prisma.voiceRoom.findUnique({
    where: { id: body.data.roomId },
    select: { id: true, maxUsers: true, workspaceId: true },
  });
  const membership = room
    ? await prisma.membership.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: room.workspaceId } },
        select: { id: true },
      })
    : null;
  if (!room || !membership) return Response.json({ error: "You can't join this room." }, { status: 403 });

  const others = listVoiceMembers(room.workspaceId).filter((m) => m.roomId === room.id && m.userId !== user.id);
  if (others.length >= room.maxUsers) return Response.json({ error: "This room is full." }, { status: 409 });

  return Response.json({
    ...(await createVoiceToken({ roomId: room.id, userId: user.id, name: user.name })),
    identity: user.id,
  });
}
