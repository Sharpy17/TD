import { prisma } from "@/lib/prisma";
import { ensureDemoProjectSeeded } from "@/lib/projects/service";
import { demoProject, demoProjectSlug } from "@/lib/data/demo";

export interface CreateModuleInput {
  projectId: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface ModuleResult {
  success: boolean;
  error?: string;
  moduleId?: string;
}

export const PRESET_MODULE_ICONS = ["◆", "▦", "◉", "⚡", "🔊", "🛡️", "💬", "🚀", "🎯", "💎"] as const;

/**
 * Creates a new module inside a project.
 */
export async function createModule(input: CreateModuleInput): Promise<ModuleResult> {
  const trimmedName = input.name.trim();
  if (trimmedName.length < 2) {
    return { success: false, error: "Module name must be at least 2 characters." };
  }
  if (trimmedName.length > 60) {
    return { success: false, error: "Module name cannot exceed 60 characters." };
  }

  try {
    let targetProjectId = input.projectId;

    // Check if parent project exists directly by ID
    let project = await prisma.project.findUnique({
      where: { id: targetProjectId },
    });

    // If not found and input matches demo project ID or slug, ensure demo project is seeded first
    if (!project && (targetProjectId === demoProjectSlug || targetProjectId === demoProject.id)) {
      targetProjectId = await ensureDemoProjectSeeded();
      project = await prisma.project.findUnique({
        where: { id: targetProjectId },
      });
    }

    if (!project) {
      return { success: false, error: "Parent project not found." };
    }

    const icon = input.icon && input.icon.trim() ? input.icon.trim() : "◆";

    const newModule = await prisma.module.create({
      data: {
        name: trimmedName,
        description: input.description?.trim() || null,
        icon,
        projectId: project.id,
      },
    });

    return {
      success: true,
      moduleId: newModule.id,
    };
  } catch (err) {
    console.error(`[createModule] Error creating module for project ${input.projectId}:`, err);
    return {
      success: false,
      error: "Failed to create module. Please check database connectivity.",
    };
  }
}

