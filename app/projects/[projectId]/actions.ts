"use server";

import { canEditProject, canEditModule, canEditTask } from "@/lib/auth/project-access";
import { revalidatePath } from "next/cache";
import { createModule, deleteModule, renameModule } from "@/lib/modules/service";
import { createTask, deleteTask, updateTask, addTaskComment } from "@/lib/tasks/service";
import { getCurrentUser } from "@/lib/auth/service";
import { canonicalProjectId } from "@/lib/projects/service";
import { chatTopic, publish } from "@/lib/realtime/hub";
import { parseChecklist } from "@/lib/tasks/checklist";

export interface ModuleActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export interface TaskActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function createModuleAction(
  _prevState: ModuleActionState | null,
  formData: FormData
): Promise<ModuleActionState> {
  const projectId = formData.get("projectId")?.toString() || "";
  const name = formData.get("name")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const icon = formData.get("icon")?.toString() || "◆";

  if (!projectId) {
    return { error: "Missing project reference." };
  }

  if (!name.trim()) {
    return {
      error: "Module name is required.",
      fieldErrors: { name: "Please enter a module name." },
    };
  }

  if (!(await canEditProject(projectId))) return { error: "Sign in as a workspace member to create modules." };

  const result = await createModule({
    projectId,
    name,
    description,
    icon,
  });

  if (!result.success) {
    return { error: result.error || "Failed to create module." };
  }

  revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath("/projects/daihub", "layout");
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/");
  notifyBoard(projectId);

  return { success: true };
}

export async function renameModuleAction(
  moduleId: string,
  name: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!moduleId) return { success: false, error: "Missing module ID." };
  if (!name.trim()) return { success: false, error: "Module name cannot be empty." };
  if (!(await canEditModule(moduleId))) return { success: false, error: "You cannot rename this module." };

  const result = await renameModule(moduleId, name);
  if (!result.success) return { success: false, error: result.error || "Failed to rename module." };

  revalidatePath("/projects/[projectId]", "layout");
  revalidateProjectViews(projectId);
  return { success: true };
}

export async function deleteModuleAction(
  moduleId: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!moduleId) return { success: false, error: "Missing module ID." };
  if (!(await canEditModule(moduleId))) return { success: false, error: "You cannot delete this module." };

  const result = await deleteModule(moduleId);
  if (!result.success) return { success: false, error: result.error || "Failed to delete module." };

  revalidatePath("/projects/[projectId]", "layout");
  revalidateProjectViews(projectId);
  return { success: true };
}

export async function createTaskAction(
  _prevState: TaskActionState | null,
  formData: FormData
): Promise<TaskActionState> {
  const projectId = formData.get("projectId")?.toString() || "";
  const moduleId = formData.get("moduleId")?.toString() || "";
  const title = formData.get("title")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const status =
    (formData.get("status")?.toString() as "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE") ||
    "BACKLOG";
  const priority =
    (formData.get("priority")?.toString() as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ||
    "MEDIUM";
  const dueAtRaw = formData.get("dueAt")?.toString() || "";

  if (!moduleId) {
    return { error: "Please select a target module." };
  }

  if (!title.trim()) {
    return {
      error: "Task title is required.",
      fieldErrors: { title: "Please enter a task title." },
    };
  }

  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;

  if (!(await canEditModule(moduleId))) return { error: "Sign in as a workspace member to create tasks." };

  const result = await createTask({
    moduleId,
    title,
    description,
    status,
    priority,
    dueAt,
  });

  if (!result.success) {
    return { error: result.error || "Failed to create task." };
  }

  if (projectId) {
    revalidatePath(`/projects/${projectId}`, "layout");
  }
  revalidatePath("/projects/daihub", "layout");
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/");
  notifyBoard(projectId);

  return { success: true };
}

export async function renameTaskAction(
  taskId: string,
  title: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!taskId) return { success: false, error: "Missing task ID." };
  if (!title.trim()) return { success: false, error: "Title cannot be empty." };

  if (!(await canEditTask(taskId))) return { success: false, error: "You cannot edit this task." };
  const result = await updateTask({ taskId, title });
  if (!result.success) return { success: false, error: result.error };

  if (projectId) revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath("/projects/daihub", "layout");
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/");
  notifyBoard(projectId);

  return { success: true };
}

export async function updateTaskAction(
  _prevState: TaskActionState | null,
  formData: FormData
): Promise<TaskActionState> {
  const taskId = formData.get("taskId")?.toString() || "";
  const projectId = formData.get("projectId")?.toString() || "";
  const moduleId = formData.get("moduleId")?.toString() || "";
  const title = formData.get("title")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const status =
    (formData.get("status")?.toString() as "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE") ||
    undefined;
  const priority =
    (formData.get("priority")?.toString() as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ||
    undefined;
  const dueAtRaw = formData.get("dueAt")?.toString();

  if (!taskId) return { error: "Missing task ID." };
  if (!title.trim()) return { error: "Task title cannot be empty." };

  const dueAt =
    dueAtRaw !== undefined ? (dueAtRaw ? new Date(dueAtRaw) : null) : undefined;

  if (!(await canEditTask(taskId)) || (moduleId && !(await canEditModule(moduleId)))) return { error: "You cannot edit this task or target module." };

  const result = await updateTask({
    taskId,
    title,
    description,
    status,
    priority,
    dueAt,
    moduleId: moduleId || undefined,
  });

  if (!result.success) {
    return { error: result.error || "Failed to update task." };
  }

  if (projectId) revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath("/projects/daihub", "layout");
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/");
  notifyBoard(projectId);

  return { success: true };
}

export async function deleteTaskAction(
  taskId: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!taskId) {
    return { success: false, error: "Missing task ID." };
  }

  if (!(await canEditTask(taskId))) return { success: false, error: "You cannot delete this task." };
  const result = await deleteTask(taskId);
  if (!result.success) {
    return { success: false, error: result.error || "Failed to delete task." };
  }

  if (projectId) {
    revalidatePath(`/projects/${projectId}`, "layout");
  }
  revalidatePath("/projects/daihub", "layout");
  revalidatePath("/projects/[projectId]", "layout");
  revalidatePath("/projects");
  revalidatePath("/");
  notifyBoard(projectId);

  return { success: true };
}

/** Tells every open board for this project to refetch. */
function notifyBoard(projectId?: string) {
  if (projectId) publish(canonicalProjectId(projectId), { type: "tasks" });
}

function revalidateProjectViews(projectId?: string) {
  if (projectId) {
    revalidatePath(`/projects/${projectId}`, "layout");
  }
  revalidatePath("/projects/daihub", "layout");
  revalidatePath("/projects");
  revalidatePath("/");
  notifyBoard(projectId);
}

const BOARD_STATUSES = new Set(["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"]);

export async function moveTaskAction(
  taskId: string,
  move: { status: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE"; orderKey?: string },
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!taskId) return { success: false, error: "Missing task ID." };
  if (!BOARD_STATUSES.has(move.status)) return { success: false, error: "Unknown status." };
  if (!(await canEditTask(taskId))) return { success: false, error: "You cannot edit this task." };

  const result = await updateTask({ taskId, status: move.status, orderKey: move.orderKey });
  if (!result.success) return { success: false, error: result.error };

  revalidateProjectViews(projectId);
  return { success: true };
}

export async function quickAddTaskAction(input: {
  projectId: string;
  moduleId: string;
  title: string;
  assigneeId: string | null;
  dueAt: string | null;
}): Promise<{ success: boolean; error?: string }> {
  if (!input.moduleId) return { success: false, error: "Pick a module with ^name." };
  if (!(await canEditModule(input.moduleId))) return { success: false, error: "You cannot add tasks to this module." };

  const result = await createTask({
    moduleId: input.moduleId,
    title: input.title,
    assigneeId: input.assigneeId,
    dueAt: input.dueAt,
  });
  if (!result.success) return { success: false, error: result.error };

  revalidateProjectViews(input.projectId);
  return { success: true };
}

const PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

/** Inline edits from the board's details panel. Only the fields present are changed. */
export async function updateTaskFieldsAction(
  taskId: string,
  fields: {
    assigneeId?: string | null;
    moduleId?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    dueAt?: string | null;
  },
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!taskId) return { success: false, error: "Missing task ID." };
  if (fields.priority !== undefined && !PRIORITIES.has(fields.priority)) {
    return { success: false, error: "Unknown priority." };
  }
  if (fields.dueAt && Number.isNaN(Date.parse(fields.dueAt))) {
    return { success: false, error: "Invalid due date." };
  }
  if (!(await canEditTask(taskId)) || (fields.moduleId && !(await canEditModule(fields.moduleId)))) {
    return { success: false, error: "You cannot edit this task or target module." };
  }

  const result = await updateTask({
    taskId,
    assigneeId: fields.assigneeId,
    moduleId: fields.moduleId,
    priority: fields.priority,
    dueAt: fields.dueAt,
  });
  if (!result.success) return { success: false, error: result.error };

  revalidateProjectViews(projectId);
  return { success: true };
}

export async function updateChecklistAction(
  taskId: string,
  checklist: unknown,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  const items = parseChecklist(checklist);
  if (!taskId || !items) return { success: false, error: "Invalid checklist." };
  if (!(await canEditTask(taskId))) return { success: false, error: "You cannot edit this task." };

  const result = await updateTask({ taskId, checklist: items });
  if (!result.success) return { success: false, error: result.error };

  revalidateProjectViews(projectId);
  return { success: true };
}

export async function addCommentAction(
  taskId: string,
  content: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sign in to comment." };

  const result = await addTaskComment({ taskId, authorId: user.id, content });
  if (!result.success) return result;

  revalidateProjectViews(projectId);
  if (projectId) publish(canonicalProjectId(projectId), { type: "comments", taskId });
  if (result.channelId) publish(chatTopic(result.channelId), { type: "messages", channelId: result.channelId });
  return { success: true };
}
