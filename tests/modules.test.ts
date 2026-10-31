import { describe, expect, it } from "vitest";
import { createProject, deleteProject, getProjectById } from "../lib/projects/service";
import { createModule } from "../lib/modules/service";

describe("Modules Service (lib/modules/service)", () => {
  it("rejects module creation with invalid names", async () => {
    const tooShort = await createModule({
      projectId: "proj-123",
      name: " ",
    });
    expect(tooShort.success).toBe(false);
    expect(tooShort.error).toContain("at least 2 characters");

    const tooLong = await createModule({
      projectId: "proj-123",
      name: "M".repeat(61),
    });
    expect(tooLong.success).toBe(false);
    expect(tooLong.error).toContain("cannot exceed 60 characters");
  });

  it("fails if the parent project does not exist", async () => {
    const notFound = await createModule({
      projectId: "non-existent-proj-999",
      name: "Billing Engine",
    });
    expect(notFound.success).toBe(false);
    expect(notFound.error).toContain("Parent project not found");
  });

  it("creates a module linked to a project with custom icon", async () => {
    // Create a real project first
    const projectRes = await createProject({
      name: "Module Test Project",
      createDefaultModules: false,
    });
    expect(projectRes.success).toBe(true);
    const projectId = projectRes.projectId!;

    // Create module
    const moduleRes = await createModule({
      projectId,
      name: "Stripe Billing & Subscriptions",
      description: "Checkout flows and customer portals",
      icon: "⚡",
    });

    expect(moduleRes.success).toBe(true);
    expect(moduleRes.moduleId).toBeDefined();

    // Verify project now has this module
    const project = await getProjectById(projectId);
    expect(project).toBeDefined();
    expect(project?.modules.length).toBe(1);
    expect(project?.modules[0].name).toBe("Stripe Billing & Subscriptions");
    expect(project?.modules[0].icon).toBe("⚡");
    expect(project?.modules[0].description).toBe("Checkout flows and customer portals");

    // Clean up
    await deleteProject(projectId);
  });

  it("successfully creates a module inside the default demo project (daihub)", async () => {
    const demoSlug = "daihub";
    const moduleRes = await createModule({
      projectId: demoSlug,
      name: "Autonomous AI Agents",
      description: "Background worker agents and cron dispatchers",
      icon: "🚀",
    });

    expect(moduleRes.success).toBe(true);
    expect(moduleRes.moduleId).toBeDefined();

    const project = await getProjectById(demoSlug);
    expect(project).toBeDefined();
    const createdMod = project?.modules.find((m) => m.name === "Autonomous AI Agents");
    expect(createdMod).toBeDefined();
    expect(createdMod?.icon).toBe("🚀");
  });
});

