"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewerWorkspace } from "@/lib/auth/account";
import { canEditProject } from "@/lib/auth/project-access";
import { createProject, deleteProject } from "@/lib/projects/service";

export interface ProjectActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function createProjectAction(
  _prevState: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  const name = formData.get("name")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const createDefaultModules = formData.get("createDefaultModules") === "on";

  if (!name.trim()) {
    return {
      error: "Project name is required.",
      fieldErrors: { name: "Please enter a project name." },
    };
  }

  const viewer = await getViewerWorkspace();
  if (!viewer || viewer.role === "GUEST") return { error: "You don't have permission to create projects here." };

  const result = await createProject({
    name,
    description,
    createDefaultModules,
    workspaceId: viewer.workspaceId,
  });

  if (!result.success || !result.projectId) {
    return { error: result.error || "Failed to create project." };
  }

  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${result.projectId}`);
}

export async function deleteProjectAction(projectId: string): Promise<ProjectActionState> {
  if (!(await canEditProject(projectId))) return { error: "You don't have permission to delete this project." };

  const result = await deleteProject(projectId);
  if (!result.success) {
    return { error: result.error || "Failed to delete project." };
  }

  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}


