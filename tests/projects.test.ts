import { describe, expect, it } from "vitest";
import { createProject, deleteProject, getProjectById } from "../lib/projects/service";
import { demoProject, demoProjectSlug } from "../lib/data/demo";

describe("Projects Service (lib/projects/service)", () => {
  it("retrieves the demo project by slug or ID", async () => {
    const bySlug = await getProjectById(demoProjectSlug);
    expect(bySlug).toBeDefined();
    expect(bySlug?.id).toBe(demoProject.id);
    expect(bySlug?.name).toBe("Toguz Hub Core");

    const byId = await getProjectById(demoProject.id);
    expect(byId).toBeDefined();
    expect(byId?.name).toBe("Toguz Hub Core");
  });

  it("returns null for non-existent projects", async () => {
    const notFound = await getProjectById("non-existent-proj-id-xyz");
    expect(notFound).toBeNull();
  });

  it("rejects project creation with invalid names", async () => {
    const tooShort = await createProject({ name: " " });
    expect(tooShort.success).toBe(false);
    expect(tooShort.error).toContain("at least 2 characters");

    const singleChar = await createProject({ name: "A" });
    expect(singleChar.success).toBe(false);
    expect(singleChar.error).toContain("at least 2 characters");

    const tooLong = await createProject({ name: "A".repeat(81) });
    expect(tooLong.success).toBe(false);
    expect(tooLong.error).toContain("cannot exceed 80 characters");
  });

  it("creates and then deletes a real project in the database", async () => {
    const result = await createProject({
      name: "Vitest Drone Project",
      description: "Autonomous delivery drone firmware and UI",
      createDefaultModules: true,
    });

    expect(result.success).toBe(true);
    expect(result.projectId).toBeDefined();

    const projectId = result.projectId!;
    const created = await getProjectById(projectId);
    expect(created).toBeDefined();
    expect(created?.name).toBe("Vitest Drone Project");
    expect(created?.modules.length).toBe(2);

    // Now test deleting it
    const deleteResult = await deleteProject(projectId);
    expect(deleteResult.success).toBe(true);

    const deleted = await getProjectById(projectId);
    expect(deleted).toBeNull();
  });

  it("prevents deleting the default demo project", async () => {
    const deleteResult = await deleteProject(demoProjectSlug);
    expect(deleteResult.success).toBe(false);
    expect(deleteResult.error).toContain("cannot be deleted");
  });
});


