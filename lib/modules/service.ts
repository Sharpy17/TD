import { prisma } from "@/lib/prisma";
import { ensureDemoProjectSeeded } from "@/lib/projects/service";
import { demoProject, demoProjectSlug } from "@/lib/data/demo";
import { moduleChannelName } from "@/lib/chat/names";

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

function validateModuleName(name: string): string | null {
  if (name.length < 2) return "Module name must be at least 2 characters.";
  if (name.length > 60) return "Module name cannot exceed 60 characters.";
  return null;
}

/**
 * Creates a new module inside a project.
 */
export async function createModule(input: CreateModuleInput): Promise<ModuleResult> {
  const trimmedName = input.name.trim();
  const nameError = validateModuleName(trimmedName);
  if (nameError) return { success: false, error: nameError };

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

/** Renames a module and its chat channel, which is named after it. */
export async function renameModule(moduleId: string, name: string): Promise<ModuleResult> {
  const trimmedName = name.trim();
  const nameError = validateModuleName(trimmedName);
  if (nameError) return { success: false, error: nameError };

  try {
    const existing = await prisma.module.findUnique({ where: { id: moduleId }, select: { id: true } });
    if (!existing) return { success: false, error: "Module not found." };

    await prisma.$transaction([
      prisma.module.update({ where: { id: moduleId }, data: { name: trimmedName } }),
      prisma.channel.updateMany({ where: { moduleId }, data: { name: moduleChannelName(trimmedName) } }),
    ]);
    return { success: true, moduleId };
  } catch (err) {
    console.error(`[renameModule] Error renaming module ${moduleId}:`, err);
    return { success: false, error: "Failed to rename module. Please try again." };
  }
}

/** Deletes a module. Its tasks, their comments and its chat channel go with it (database cascade). */
export async function deleteModule(moduleId: string): Promise<ModuleResult> {
  try {
    const { count } = await prisma.module.deleteMany({ where: { id: moduleId } });
    if (count === 0) return { success: false, error: "Module not found." };
    return { success: true, moduleId };
  } catch (err) {
    console.error(`[deleteModule] Error deleting module ${moduleId}:`, err);
    return { success: false, error: "Failed to delete module. Please try again." };
  }
}

