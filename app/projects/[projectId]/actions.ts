"use server";

import { revalidatePath } from "next/cache";
import { createModule } from "@/lib/modules/service";
import { createTask, deleteTask, updateTask } from "@/lib/tasks/service";

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

  const result = await createModule({
    projectId,
    name,
    description,
    icon,
  });

  if (!result.success) {
    return { error: result.error || "Failed to create module." };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects/toguz-hub");
  revalidatePath("/projects");
  revalidatePath("/");

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
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/projects/toguz-hub");
  revalidatePath("/projects");
  revalidatePath("/");

  return { success: true };
}

export async function renameTaskAction(
  taskId: string,
  title: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!taskId) return { success: false, error: "Missing task ID." };
  if (!title.trim()) return { success: false, error: "Title cannot be empty." };

  const result = await updateTask({ taskId, title });
  if (!result.success) return { success: false, error: result.error };

  if (projectId) revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects/toguz-hub");
  revalidatePath("/projects");
  revalidatePath("/");

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

  if (projectId) revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects/toguz-hub");
  revalidatePath("/projects");
  revalidatePath("/");

  return { success: true };
}

export async function deleteTaskAction(
  taskId: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!taskId) {
    return { success: false, error: "Missing task ID." };
  }

  const result = await deleteTask(taskId);
  if (!result.success) {
    return { success: false, error: result.error || "Failed to delete task." };
  }

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/projects/toguz-hub");
  revalidatePath("/projects");
  revalidatePath("/");

  return { success: true };
}
