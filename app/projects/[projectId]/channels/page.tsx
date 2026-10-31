import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureModuleChannel } from "@/lib/chat/service";
import { projectChannelId } from "@/lib/chat/names";
import { canonicalProjectId } from "@/lib/projects/service";

export const dynamic = "force-dynamic";

/**
 * /projects/:id/channels            → the project's #general
 * /projects/:id/channels?module=:m  → that module's channel (used by the # pill on module cards)
 */
export default async function ProjectChannelsIndex({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ module?: string | string[] }>;
}) {
  const { projectId } = await params;
  const { module: moduleParam } = await searchParams;
  const canonicalId = canonicalProjectId(projectId);

  const moduleId = typeof moduleParam === "string" ? moduleParam : undefined;
  if (moduleId) {
    const owned = await prisma.module.findFirst({ where: { id: moduleId, projectId: canonicalId }, select: { id: true } });
    if (!owned) notFound();
    const channelId = await ensureModuleChannel(moduleId);
    if (!channelId) notFound();
    redirect(`/projects/${projectId}/channels/${channelId}`);
  }

  redirect(`/projects/${projectId}/channels/${projectChannelId(canonicalId)}`);
}
