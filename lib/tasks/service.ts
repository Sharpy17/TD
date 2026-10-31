import { prisma } from "@/lib/prisma";
import { ensureDemoProjectSeeded } from "@/lib/projects/service";
import { ensureModuleChannel } from "@/lib/chat/service";
import { isValidOrderKey, keyBetween, sequentialKeys } from "@/lib/domain/ordering";
import type { ChecklistItem, TaskComment } from "@/lib/domain/types";

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

    const status = input.status || "BACKLOG";
    const priority = input.priority || "MEDIUM";

    const task = await prisma.$transaction(async (tx) => {
      // 1. Create Task at the bottom of the board with the next project-wide number
      const projectTasks = { module: { projectId: targetModule.projectId } };
      const [lastByKey, lastByNumber] = await Promise.all([
        tx.task.findFirst({ where: projectTasks, orderBy: { orderKey: "desc" }, select: { orderKey: true } }),
        tx.task.aggregate({ where: projectTasks, _max: { number: true } }),
      ]);

      const createdTask = await tx.task.create({
        data: {
          title: trimmedTitle,
          description: input.description?.trim() || null,
          status,
          priority,
          dueAt: parsedDueAt,
          orderKey: keyBetween(lastByKey?.orderKey ?? null, null),
          number: (lastByNumber._max.number ?? 0) + 1,
          completedAt: status === "DONE" ? new Date() : null,
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
  orderKey?: string;
  checklist?: ChecklistItem[];
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

    if (input.status !== undefined && input.status !== task.status) {
      dataToUpdate.status = input.status;
      dataToUpdate.completedAt = input.status === "DONE" ? new Date() : null;
    }

    if (input.orderKey !== undefined) {
      if (!isValidOrderKey(input.orderKey)) {
        return { success: false, error: "Invalid card position." };
      }
      dataToUpdate.orderKey = input.orderKey;
    }

    if (input.checklist !== undefined) {
      dataToUpdate.checklist = input.checklist;
    }

    if (input.assigneeId !== undefined) {
      if (input.assigneeId) {
        // Only people in the project's workspace can own its tasks.
        const membership = await prisma.membership.findFirst({
          where: { userId: input.assigneeId, workspace: { projects: { some: { id: task.module.projectId } } } },
          select: { id: true },
        });
        if (!membership) {
          return { success: false, error: "That person isn't a member of this workspace." };
        }
      }
      dataToUpdate.assigneeId = input.assigneeId;
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
      if (!targetMod || targetMod.projectId !== task.module.projectId) {
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

/**
 * Brings older rows up to the board's expectations: every task gets a project-wide number,
 * order keys become unique and valid, and finished tasks get a completion time.
 * Cheap no-op once a project is clean. Returns true when any row was changed.
 */
export async function normalizeProjectTasks(projectId: string): Promise<boolean> {
  try {
    const tasks = await prisma.task.findMany({
      where: { module: { projectId } },
      select: { id: true, number: true, orderKey: true, status: true, completedAt: true, updatedAt: true, createdAt: true },
      orderBy: [{ orderKey: "asc" }, { createdAt: "asc" }],
    });

    const keys = tasks.map((t) => t.orderKey);
    const needsRekey = new Set(keys).size !== keys.length || keys.some((k) => !isValidOrderKey(k));
    const missingNumbers = tasks.filter((t) => t.number == null);
    const missingCompletion = tasks.filter((t) => t.status === "DONE" && !t.completedAt);
    if (!needsRekey && missingNumbers.length === 0 && missingCompletion.length === 0) return false;

    let nextNumber = tasks.reduce((max, t) => Math.max(max, t.number ?? 0), 0);
    const numberFor = new Map(
      [...missingNumbers]
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((t) => [t.id, ++nextNumber]),
    );
    const newKeys = needsRekey ? sequentialKeys(tasks.length) : null;

    await prisma.$transaction(
      tasks
        .map((t, index) => {
          const data: { number?: number; orderKey?: string; completedAt?: Date } = {};
          if (numberFor.has(t.id)) data.number = numberFor.get(t.id);
          if (newKeys) data.orderKey = newKeys[index];
          if (t.status === "DONE" && !t.completedAt) data.completedAt = t.updatedAt;
          return Object.keys(data).length ? prisma.task.update({ where: { id: t.id }, data }) : null;
        })
        .filter((op) => op !== null),
    );
    return true;
  } catch (err) {
    console.error(`[normalizeProjectTasks] Failed for project ${projectId}:`, err);
    return false;
  }
}

/** Returns the project a task belongs to, or null when it does not exist. */
export async function getTaskProjectId(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { module: { select: { projectId: true } } },
  });
  return task?.module.projectId ?? null;
}

export async function listTaskComments(taskId: string): Promise<TaskComment[]> {
  const messages = await prisma.message.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true } } },
  });

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    author: { id: m.author.id, name: m.author.name, initials: m.author.name.slice(0, 2).toUpperCase() },
  }));
}

/**
 * Posts a comment on a task. Comments live in the task's module channel, which is created on first use.
 */
export async function addTaskComment(input: {
  taskId: string;
  authorId: string;
  content: string;
}): Promise<{ success: boolean; error?: string; channelId?: string }> {
  const content = input.content.trim();
  if (!content) return { success: false, error: "Comment cannot be empty." };
  if (content.length > 2000) return { success: false, error: "Comment cannot exceed 2000 characters." };

  try {
    const task = await prisma.task.findUnique({ where: { id: input.taskId }, select: { moduleId: true } });
    if (!task) return { success: false, error: "Task not found." };

    const channelId = await ensureModuleChannel(task.moduleId);
    if (!channelId) return { success: false, error: "Task not found." };

    await prisma.message.create({
      data: { content, channelId, authorId: input.authorId, taskId: input.taskId },
    });
    return { success: true, channelId };
  } catch (err) {
    console.error(`[addTaskComment] Failed for task ${input.taskId}:`, err);
    return { success: false, error: "Failed to post comment." };
  }
}



