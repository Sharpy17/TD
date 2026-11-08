import type { NextRequest } from "next/server";
import { canViewTask } from "@/lib/auth/project-access";
import { listTaskComments } from "@/lib/tasks/service";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  if (!(await canViewTask(taskId))) return Response.json({ error: "Not allowed." }, { status: 403 });
  try {
    return Response.json(await listTaskComments(taskId));
  } catch (err) {
    console.error(`[comments] Failed to load comments for ${taskId}:`, err);
    return Response.json({ error: "Failed to load comments." }, { status: 500 });
  }
}
