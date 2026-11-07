import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";
import { dropVoiceMember, touchVoiceMember } from "@/lib/realtime/hub";
import { getActiveMembership } from "@/lib/workspaces/service";

const bodySchema = z.object({
  roomId: z.string().min(1).max(64).nullable(),
  muted: z.boolean(),
  deafened: z.boolean(),
  sharing: z.boolean(),
});

/** Heartbeat from a voice client. It drives the room member lists everyone sees. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return new Response(null, { status: 400 });

  const { roomId, muted, deafened, sharing } = body.data;
  if (!roomId) {
    const membership = await getActiveMembership(user.id);
    if (membership) dropVoiceMember(membership.workspaceId, user.id);
    return new Response(null, { status: 204 });
  }

  const room = await prisma.voiceRoom.findUnique({ where: { id: roomId }, select: { workspaceId: true } });
  const membership = room
    ? await prisma.membership.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: room.workspaceId } },
        select: { id: true },
      })
    : null;
  if (!room || !membership) return new Response(null, { status: 403 });

  touchVoiceMember(room.workspaceId, {
    userId: user.id,
    roomId,
    name: user.name,
    initials: user.name.slice(0, 2).toUpperCase(),
    muted,
    deafened,
    sharing,
  });
  return new Response(null, { status: 204 });
}
