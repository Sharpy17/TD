import { getCurrentUser } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";
import { demoProject, demoProjectSlug } from "@/lib/data/demo";

export async function canEditProject(projectId: string) {
  const user = await getCurrentUser();
  if (!user) return false;
  const project = await prisma.project.findUnique({
    where: { id: projectId === demoProjectSlug ? demoProject.id : projectId },
  });
  if (!project) return false;
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: project.workspaceId } },
  });
  return !!membership && membership.role !== "GUEST";
}

export async function canEditModule(moduleId: string) {
  const targetModule = await prisma.module.findUnique({ where: { id: moduleId } });
  return !!targetModule && canEditProject(targetModule.projectId);
}

export async function canEditTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  return !!task && canEditModule(task.moduleId);
}
