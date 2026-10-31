import { prisma } from "@/lib/prisma";
import { ensureDemoProjectSeeded } from "@/lib/projects/service";

export interface CreateTaskInput {
  moduleId: string;
  title: string;
  description?: string;
  status?: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueAt?: Date | string | null;
  assigneeId?: string | null;
}

export interface TaskResult {
  success: boolean;
  error?: string;
  taskId?: string;
}

/**
 * Creates a new task inside a module and recalculates module & project completion progress.
 */
export async function createTask(input: CreateTaskInput): Promise<TaskResult> {
  const trimmedTitle = input.title.trim();
  if (trimmedTitle.length < 1) {
    return { success: false, error: "Task title cannot be empty." };
  }
  if (trimmedTitle.length > 150) {
    return { success: false, error: "Task title cannot exceed 150 characters." };
  }

  try {
    let targetModule = await prisma.module.findUnique({
      where: { id: input.moduleId },
      include: { project: true },
    });

    // If module not found in DB, check if it's a demo module and ensure demo project is seeded
    if (!targetModule) {
      await ensureDemoProjectSeeded();
      targetModule = await prisma.module.findUnique({
        where: { id: input.moduleId },
        include: { project: true },
      });
    }

    if (!targetModule) {
      return { success: false, error: "Target module not found." };
    }

    // Determine dueAt date
    let parsedDueAt: Date | null = null;
    if (input.dueAt) {
      const d = typeof input.dueAt === "string" ? new Date(input.dueAt) : input.dueAt;
      if (!isNaN(d.getTime())) {
        parsedDueAt = d;
      }
    }

    // Generate orderKey for Kanban ordering
    const existingCount = await prisma.task.count({
      where: { moduleId: targetModule.id },
    });
    const orderKey = (existingCount + 1).toString().padStart(4, "0");

    const status = input.status || "BACKLOG";
    const priority = input.priority || "MEDIUM";

    const task = await prisma.$transaction(async (tx) => {
      // 1. Create Task
      const createdTask = await tx.task.create({
        data: {
          title: trimmedTitle,
          description: input.description?.trim() || null,
          status,
          priority,
          dueAt: parsedDueAt,
          orderKey,
          moduleId: targetModule.id,
          assigneeId: input.assigneeId || null,
        },
      });

      // 2. Fetch all tasks for this module to recalculate progress
      const allModuleTasks = await tx.task.findMany({
        where: { moduleId: targetModule.id },
        select: { status: true },
      });

      const doneTasks = allModuleTasks.filter((t) => t.status === "DONE").length;
      const moduleProgress =
        allModuleTasks.length > 0 ? Math.round((doneTasks / allModuleTasks.length) * 100) : 0;

      await tx.module.update({
        where: { id: targetModule.id },
        data: { cachedProgress: moduleProgress },
      });

      // 3. Recalculate Project progress
      const allProjectModules = await tx.module.findMany({
        where: { projectId: targetModule.projectId },
        select: { cachedProgress: true },
      });

      const avgProjectProgress =
        allProjectModules.length > 0
          ? Math.round(
              allProjectModules.reduce((sum, m) => sum + m.cachedProgress, 0) /
                allProjectModules.length
            )
          : 0;

      await tx.project.update({
        where: { id: targetModule.projectId },
        data: { cachedProgress: avgProjectProgress },
      });

      return createdTask;
    });

    return {
      success: true,
      taskId: task.id,
    };
  } catch (err) {
    console.error("[createTask] Error creating task:", err);
    return {
      success: false,
      error: "Failed to create task. Please check database connectivity.",
    };
  }
}

/**
 * Deletes a task by ID and recalculates module and project completion progress.
 */
export async function deleteTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: {
          select: { id: true, projectId: true },
        },
      },
    });

    if (!task) {
      await ensureDemoProjectSeeded();
      task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          module: {
            select: { id: true, projectId: true },
          },
        },
      });
    }

    if (!task) {
      return { success: false, error: "Task not found." };
    }

    const {
      moduleId,
      module: { projectId },
    } = task;

    await prisma.$transaction(async (tx) => {
      // 1. Delete Task
      await tx.task.delete({
        where: { id: taskId },
      });

      // 2. Recalculate Module progress
      const allModuleTasks = await tx.task.findMany({
        where: { moduleId },
        select: { status: true },
      });

      const doneTasks = allModuleTasks.filter((t) => t.status === "DONE").length;
      const moduleProgress =
        allModuleTasks.length > 0 ? Math.round((doneTasks / allModuleTasks.length) * 100) : 0;

      await tx.module.update({
        where: { id: moduleId },
        data: { cachedProgress: moduleProgress },
      });

      // 3. Recalculate Project progress
      const allProjectModules = await tx.module.findMany({
        where: { projectId },
        select: { cachedProgress: true },
      });

      const avgProjectProgress =
        allProjectModules.length > 0
          ? Math.round(
              allProjectModules.reduce((sum, m) => sum + m.cachedProgress, 0) /
                allProjectModules.length
            )
          : 0;

      await tx.project.update({
        where: { id: projectId },
        data: { cachedProgress: avgProjectProgress },
      });
    });

    return { success: true };
  } catch (err) {
    console.error(`[deleteTask] Error deleting task ${taskId}:`, err);
    return {
      success: false,
      error: "Failed to delete task. Please check database connectivity.",
    };
  }
}

export interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string | null;
  status?: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueAt?: Date | string | null;
  moduleId?: string;
  assigneeId?: string | null;
}

/**
 * Updates an existing task's properties (title, deadline, status, module, priority)
 * and recalculates progress metrics if status or module assignment changed.
 */
export async function updateTask(input: UpdateTaskInput): Promise<TaskResult> {
  try {
    let task = await prisma.task.findUnique({
      where: { id: input.taskId },
      include: {
        module: {
          select: { id: true, projectId: true },
        },
      },
    });

    if (!task) {
      await ensureDemoProjectSeeded();
      task = await prisma.task.findUnique({
        where: { id: input.taskId },
        include: {
          module: {
            select: { id: true, projectId: true },
          },
        },
      });
    }

    if (!task) {
      return { success: false, error: "Task not found." };
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (input.title !== undefined) {
      const trimmed = input.title.trim();
      if (trimmed.length < 1) {
        return { success: false, error: "Task title cannot be empty." };
      }
      if (trimmed.length > 150) {
        return { success: false, error: "Task title cannot exceed 150 characters." };
      }
      dataToUpdate.title = trimmed;
    }

    if (input.description !== undefined) {
      dataToUpdate.description = input.description ? input.description.trim() : null;
    }

    if (input.status !== undefined) {
      dataToUpdate.status = input.status;
    }

    if (input.priority !== undefined) {
      dataToUpdate.priority = input.priority;
    }

    if (input.dueAt !== undefined) {
      if (input.dueAt === null || input.dueAt === "") {
        dataToUpdate.dueAt = null;
      } else {
        const d = typeof input.dueAt === "string" ? new Date(input.dueAt) : input.dueAt;
        dataToUpdate.dueAt = isNaN(d.getTime()) ? null : d;
      }
    }

    const previousModuleId = task.moduleId;
    const newModuleId =
      input.moduleId && input.moduleId !== previousModuleId
        ? input.moduleId
        : previousModuleId;

    if (input.moduleId && input.moduleId !== previousModuleId) {
      const targetMod = await prisma.module.findUnique({ where: { id: input.moduleId } });
      if (!targetMod) {
        return { success: false, error: "New target module not found." };
      }
      dataToUpdate.moduleId = input.moduleId;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const savedTask = await tx.task.update({
        where: { id: input.taskId },
        data: dataToUpdate,
      });

      // If status changed or module changed, recalculate progress
      const affectedModules = Array.from(new Set([previousModuleId, newModuleId]));
      for (const modId of affectedModules) {
        const allModuleTasks = await tx.task.findMany({
          where: { moduleId: modId },
          select: { status: true },
        });

        const doneCount = allModuleTasks.filter((t) => t.status === "DONE").length;
        const progress =
          allModuleTasks.length > 0
            ? Math.round((doneCount / allModuleTasks.length) * 100)
            : 0;

        await tx.module.update({
          where: { id: modId },
          data: { cachedProgress: progress },
        });
      }

      // Recalculate project progress
      const allProjectModules = await tx.module.findMany({
        where: { projectId: task.module.projectId },
        select: { cachedProgress: true },
      });

      const avgProjectProgress =
        allProjectModules.length > 0
          ? Math.round(
              allProjectModules.reduce((sum, m) => sum + m.cachedProgress, 0) /
                allProjectModules.length
            )
          : 0;

      await tx.project.update({
        where: { id: task.module.projectId },
        data: { cachedProgress: avgProjectProgress },
      });

      return savedTask;
    });

    return { success: true, taskId: updated.id };
  } catch (err) {
    console.error(`[updateTask] Error updating task ${input.taskId}:`, err);
    return {
      success: false,
      error: "Failed to update task. Please check database connectivity.",
    };
  }
}



