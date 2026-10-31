"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

  const result = await createProject({
    name,
    description,
    createDefaultModules,
  });

  if (!result.success || !result.projectId) {
    return { error: result.error || "Failed to create project." };
  }

  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${result.projectId}`);
}

export async function deleteProjectAction(projectId: string): Promise<ProjectActionState> {
  const result = await deleteProject(projectId);
  if (!result.success) {
    return { error: result.error || "Failed to delete project." };
  }

  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}


