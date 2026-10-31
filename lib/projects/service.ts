import { prisma } from "@/lib/prisma";
import type { Project, Module, Task, UserSummary } from "@/lib/domain/types";
import { demoProject, demoProjectSlug } from "@/lib/data/demo";
import { readStoredChecklist } from "@/lib/tasks/checklist";

/** The demo project is reachable by a friendly slug; everything else uses the real id. */
export function canonicalProjectId(projectId: string): string {
  return projectId === demoProjectSlug ? demoProject.id : projectId;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  createDefaultModules?: boolean;
}

export interface ProjectResult {
  success: boolean;
  error?: string;
  projectId?: string;
}

/**
 * Maps a Prisma Project record (with modules and tasks) to the domain Project type.
 */
function mapDbProjectToDomain(dbProj: {
  id: string;
  name: string;
  description: string | null;
  modules: Array<{
    id: string;
    name: string;
    description: string | null;
    icon: string;
    leadUser: { id: string; name: string } | null;
    tasks: Array<{
      id: string;
      title: string;
      description?: string | null;
      status: string;
      priority?: string;
      dueAt: Date | null;
      assigneeId: string | null;
      assignee?: { id: string; name: string } | null;
      number?: number | null;
      orderKey?: string;
      completedAt?: Date | null;
      updatedAt?: Date;
      checklist?: unknown;
      _count?: { comments: number };
    }>;
  }>;
}): Project {
  return {
    id: dbProj.id,
    name: dbProj.name,
    description: dbProj.description || undefined,
    modules: dbProj.modules.map((m): Module => {
      const leadUser: UserSummary = m.leadUser
        ? {
            id: m.leadUser.id,
            name: m.leadUser.name,
            initials: m.leadUser.name.slice(0, 2).toUpperCase(),
          }
        : { id: "sys", name: "Team Lead", initials: "TL" };

      return {
        id: m.id,
        name: m.name,
        description: m.description || "",
        icon: m.icon || "▦",
        channelSlug: `mod-${m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        lead: leadUser,
        tasks: m.tasks.map((t): Task => {
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status as Task["status"],
            priority: (t.priority as Task["priority"]) || "MEDIUM",
            dueAt: t.dueAt ? t.dueAt.toISOString() : null,
            assignee: t.assignee
              ? {
                  id: t.assignee.id,
                  name: t.assignee.name,
                  initials: t.assignee.name.slice(0, 2).toUpperCase(),
                }
              : null,
            number: t.number ?? null,
            orderKey: t.orderKey,
            completedAt:
              t.status === "DONE" ? (t.completedAt ?? t.updatedAt ?? null)?.toISOString() ?? null : null,
            checklist: readStoredChecklist(t.checklist),
            commentCount: t._count?.comments ?? 0,
          };
        }),
      };
    }),
  };
}

/**
 * Ensures the default demo project exists in the database.
 * Returns the database project ID.
 */
export async function ensureDemoProjectSeeded(): Promise<string> {
  try {
    const existing = await prisma.project.findFirst({
      where: {
        OR: [{ id: demoProject.id }, { name: demoProject.name }],
      },
    });

    if (existing) {
      return existing.id;
    }

    let workspace = await prisma.workspace.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Startup Workspace",
          slug: "startup-workspace",
        },
      });
    }

    const created = await prisma.project.create({
      data: {
        id: demoProject.id,
        name: demoProject.name,
        description:
          "The shared command center for the team's product, tasks, conversations, and live rooms.",
        workspaceId: workspace.id,
        modules: {
          create: demoProject.modules.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            icon: m.icon,
            tasks: {
              create: m.tasks.map((t, idx) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                orderKey: `000${idx + 1}`,
                dueAt: t.dueAt ? new Date(t.dueAt) : null,
              })),
            },
          })),
        },
      },
    });

    return created.id;
  } catch (err) {
    console.error("[ensureDemoProjectSeeded] Error:", err);
    return demoProject.id;
  }
}

/**
 * Fetches all projects in the workspace.
 * If no projects exist in the database, automatically seeds the demo project.
 */
export async function getProjects(): Promise<Array<{ project: Project; slug: string }>> {
  try {
    let dbProjects = await prisma.project.findMany({
      include: {
        modules: {
          include: {
            leadUser: true,
            tasks: {
              include: {
                assignee: { select: { id: true, name: true } },
                _count: { select: { comments: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (dbProjects.length === 0) {
      await ensureDemoProjectSeeded();
      dbProjects = await prisma.project.findMany({
        include: {
          modules: {
            include: {
              leadUser: true,
              tasks: {
              include: {
                assignee: { select: { id: true, name: true } },
                _count: { select: { comments: true } },
              },
            },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (dbProjects.length === 0) {
      return [{ project: demoProject, slug: demoProjectSlug }];
    }

    return dbProjects.map((p) => ({
      project: mapDbProjectToDomain(p),
      slug: p.id === demoProject.id ? demoProjectSlug : p.id,
    }));
  } catch (err) {
    console.error("[getProjects] Falling back to demo project:", err);
    return [{ project: demoProject, slug: demoProjectSlug }];
  }
}

/**
 * Gets a single project by its ID or slug.
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const isDemo = projectId === demoProjectSlug || projectId === demoProject.id;

  try {
    let searchId = isDemo ? demoProject.id : projectId;

    let dbProj = await prisma.project.findUnique({
      where: { id: searchId },
      include: {
        modules: {
          include: {
            leadUser: true,
            tasks: {
              include: {
                assignee: { select: { id: true, name: true } },
                _count: { select: { comments: true } },
              },
            },
          },
        },
      },
    });

    // If it's the demo project and not yet seeded into DB, seed it and re-query
    if (!dbProj && isDemo) {
      searchId = await ensureDemoProjectSeeded();
      dbProj = await prisma.project.findUnique({
        where: { id: searchId },
        include: {
          modules: {
            include: {
              leadUser: true,
              tasks: {
              include: {
                assignee: { select: { id: true, name: true } },
                _count: { select: { comments: true } },
              },
            },
            },
          },
        },
      });
    }

    if (!dbProj) {
      return isDemo ? demoProject : null;
    }

    return mapDbProjectToDomain(dbProj);
  } catch (err) {
    console.error(`[getProjectById] Failed to find project ${projectId}:`, err);
    return isDemo ? demoProject : null;
  }
}

/**
 * Creates a new project in the active workspace.
 */
export async function createProject(input: CreateProjectInput): Promise<ProjectResult> {
  const trimmedName = input.name.trim();
  if (trimmedName.length < 2) {
    return { success: false, error: "Project name must be at least 2 characters." };
  }
  if (trimmedName.length > 80) {
    return { success: false, error: "Project name cannot exceed 80 characters." };
  }

  try {
    // Ensure we have a workspace
    let workspace = await prisma.workspace.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Startup Workspace",
          slug: "startup-workspace",
        },
      });
    }

    const newProject = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: trimmedName,
          description: input.description?.trim() || null,
          workspaceId: workspace.id,
        },
      });

      // Optionally provision starter modules so the Kanban and progress rings are immediately alive
      if (input.createDefaultModules !== false) {
        const starters = [
          { name: "Core & Architecture", icon: "◆", desc: "Core infrastructure, setup, and foundation." },
          { name: "UI & Product Features", icon: "▦", desc: "Client application screens, Kanban, and interactions." },
        ];

        for (const [index, starter] of starters.entries()) {
          const mod = await tx.module.create({
            data: {
              name: starter.name,
              description: starter.desc,
              icon: starter.icon,
              projectId: project.id,
            },
          });

          // Starter task for each module
          await tx.task.create({
            data: {
              title: `Initialize ${starter.name}`,
              moduleId: mod.id,
              orderKey: `000${index + 1}`,
              status: "IN_PROGRESS",
            },
          });
        }
      }

      return project;
    });

    return {
      success: true,
      projectId: newProject.id,
    };
  } catch (err) {
    console.error("[createProject] Error creating project:", err);
    return {
      success: false,
      error: "Failed to create project. Please verify database connectivity.",
    };
  }
}

/**
 * Deletes a project and cascades deletion to all associated modules and tasks.
 */
export async function deleteProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  if (projectId === demoProjectSlug || projectId === demoProject.id) {
    return {
      success: false,
      error: "The default demo project cannot be deleted.",
    };
  }

  try {
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      return { success: false, error: "Project not found." };
    }

    await prisma.project.delete({
      where: { id: existing.id },
    });

    return { success: true };
  } catch (err) {
    console.error(`[deleteProject] Error deleting project ${projectId}:`, err);
    return {
      success: false,
      error: "Failed to delete project. Please check database connectivity.",
    };
  }
}



/**
 * Lists the people who can be assigned tasks in a project (its workspace members).
 */
export async function getProjectMembers(projectId: string): Promise<UserSummary[]> {
  const searchId = projectId === demoProjectSlug ? demoProject.id : projectId;

  try {
    const project = await prisma.project.findUnique({
      where: { id: searchId },
      select: {
        workspace: {
          select: {
            memberships: {
              select: { user: { select: { id: true, name: true } } },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    return (project?.workspace.memberships ?? []).map(({ user }) => ({
      id: user.id,
      name: user.name,
      initials: user.name.slice(0, 2).toUpperCase(),
    }));
  } catch (err) {
    console.error(`[getProjectMembers] Failed for project ${projectId}:`, err);
    return [];
  }
}
