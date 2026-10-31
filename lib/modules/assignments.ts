import { prisma } from "@/lib/prisma";
import type { UserSummary } from "@/lib/domain/types";

export async function getModulePeople(projectId: string): Promise<UserSummary[]> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return [];
  const memberships = await prisma.membership.findMany({
    where: { workspaceId: project.workspaceId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return memberships.map(({ user }) => ({ ...user, initials: user.name.slice(0, 2).toUpperCase() }));
}

export async function setModuleAssignees(moduleId: string, userIds: string[], actorId: string) {
  try {
    const targetModule = await prisma.module.findUnique({ where: { id: moduleId }, include: { project: true } });
    if (!targetModule) return { success: false, error: "Module not found." };
    const membership = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: actorId, workspaceId: targetModule.project.workspaceId } },
    });
    if (!membership || membership.role === "GUEST") {
      return { success: false, error: "You need workspace membership to assign this module." };
    }
    const ids = [...new Set(userIds)];
    const people = await prisma.membership.count({
      where: { workspaceId: targetModule.project.workspaceId, userId: { in: ids } },
    });
    if (people !== ids.length) return { success: false, error: "Choose people from this workspace." };
    await prisma.module.update({
      where: { id: moduleId },
      data: { assignees: { set: ids.map((id) => ({ id })) } },
    });
    return { success: true, projectId: targetModule.projectId };
  } catch (error) {
    console.error("[setModuleAssignees]", error);
    return { success: false, error: "Could not save assignees. Please try again." };
  }
}
