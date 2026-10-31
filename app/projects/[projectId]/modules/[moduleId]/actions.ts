"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/service";
import { canEditModule } from "@/lib/auth/project-access";
import { setModuleAssignees } from "@/lib/modules/assignments";
import { updateTask } from "@/lib/tasks/service";
import { prisma } from "@/lib/prisma";
import { TASK_STATUSES, type TaskStatus } from "@/lib/domain/types";

function refreshProject() {
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function saveModuleAssignees(moduleId: string, userIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Please sign in to assign people." };
  if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== "string")) {
    return { success: false, error: "Invalid assignee selection." };
  }
  const result = await setModuleAssignees(moduleId, userIds, user.id);
  if (result.success) refreshProject();
  return result;
}

export async function changeModuleTaskStatus(moduleId: string, taskId: string, status: TaskStatus) {
  if (!TASK_STATUSES.includes(status)) return { success: false, error: "Invalid task status." };
  if (!(await canEditModule(moduleId))) return { success: false, error: "Sign in as a workspace member to update tasks." };
  const task = await prisma.task.findFirst({ where: { id: taskId, moduleId } });
  if (!task) return { success: false, error: "Task not found in this module." };
  const result = await updateTask({ taskId, status });
  if (result.success) refreshProject();
  return result;
}
