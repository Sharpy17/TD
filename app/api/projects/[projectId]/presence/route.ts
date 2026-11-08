import type { NextRequest } from "next/server";
import { z } from "zod";
import { canViewProject } from "@/lib/auth/project-access";
import { getCurrentUser } from "@/lib/auth/service";
import { canonicalProjectId } from "@/lib/projects/service";
import { touchViewer } from "@/lib/realtime/hub";

const heartbeatSchema = z.object({
  clientId: z.string().min(8).max(64),
  voiceRoom: z.string().max(80).nullable(),
});

/** Heartbeat from an open board. Identity comes from the session, never from the request body. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  if (!(await canViewProject((await ctx.params).projectId))) return new Response(null, { status: 403 });

  const body = heartbeatSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return new Response(null, { status: 400 });

  touchViewer(canonicalProjectId((await ctx.params).projectId), {
    clientId: body.data.clientId,
    userId: user.id,
    name: user.name,
    initials: user.name.slice(0, 2).toUpperCase(),
    voiceRoom: body.data.voiceRoom,
  });
  return new Response(null, { status: 204 });
}
