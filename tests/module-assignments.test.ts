import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { getModulePeople, setModuleAssignees } from "../lib/modules/assignments";
import { createModule } from "../lib/modules/service";
import { getProjectById } from "../lib/projects/service";
import { createTask, updateTask, deleteTask } from "../lib/tasks/service";

describe("Module assignment and detail persistence", () => {
  const suffix = randomUUID();
  let workspaceId: string;
  let projectId: string;
  let moduleId: string;
  const users: string[] = [];

  beforeAll(async () => {
    const workspace = await prisma.workspace.create({ data: { name: "Module test", slug: `module-test-${suffix}` } });
    workspaceId = workspace.id;
    for (const name of ["Alex", "Sam", "Guest", "Outsider"]) {
      const user = await prisma.user.create({ data: { name, email: `${name}-${suffix}@example.test` } });
      users.push(user.id);
      if (name !== "Outsider") await prisma.membership.create({ data: {
        userId: user.id, workspaceId, role: name === "Guest" ? "GUEST" : "MEMBER",
      } });
    }
    const project = await prisma.project.create({ data: { name: "Module test", workspaceId } });
    projectId = project.id;
    const result = await createModule({ projectId, name: "Test module" });
    expect(result.success).toBe(true);
    moduleId = result.moduleId!;
  });

  afterAll(async () => {
    if (workspaceId) await prisma.workspace.delete({ where: { id: workspaceId } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
  });

  it("defaults to everyone and lists only workspace members", async () => {
    const project = await getProjectById(projectId);
    expect(project?.modules[0].assignees).toEqual([]);
    expect((await getModulePeople(projectId)).map((person) => person.id).sort()).toEqual(users.slice(0, 3).sort());
  });

  it("persists multiple people, deduplicates, replaces, and clears back to everyone", async () => {
    expect((await setModuleAssignees(moduleId, [users[0], users[1], users[0]], users[0])).success).toBe(true);
    expect((await getProjectById(projectId))?.modules[0].assignees?.map((user) => user.id).sort()).toEqual(users.slice(0, 2).sort());
    await setModuleAssignees(moduleId, [users[1]], users[0]);
    expect((await getProjectById(projectId))?.modules[0].assignees?.map((user) => user.id)).toEqual([users[1]]);
    await setModuleAssignees(moduleId, [], users[0]);
    expect((await getProjectById(projectId))?.modules[0].assignees).toEqual([]);
  });

  it("rejects outsiders and guest mutations without changing existing assignment", async () => {
    await setModuleAssignees(moduleId, [users[0]], users[0]);
    expect((await setModuleAssignees(moduleId, [users[3]], users[0])).success).toBe(false);
    expect((await setModuleAssignees(moduleId, [], users[3])).success).toBe(false);
    expect((await setModuleAssignees(moduleId, [], users[2])).success).toBe(false);
    expect((await getProjectById(projectId))?.modules[0].assignees?.map((user) => user.id)).toEqual([users[0]]);
  });

  it("tracks task creation, completion, and deletion without inventing task assignees", async () => {
    const created = await createTask({ moduleId, title: "Quick task" });
    expect(created.success).toBe(true);
    const taskId = created.taskId!;
    let project = await getProjectById(projectId);
    expect(project?.modules[0].tasks[0]).toMatchObject({ title: "Quick task", status: "BACKLOG", assignee: null });
    expect((await updateTask({ taskId, status: "DONE" })).success).toBe(true);
    expect((await prisma.module.findUnique({ where: { id: moduleId } }))?.cachedProgress).toBe(100);
    expect((await prisma.project.findUnique({ where: { id: projectId } }))?.cachedProgress).toBe(100);
    project = await getProjectById(projectId);
    expect(project?.modules[0].tasks[0].status).toBe("DONE");
    expect((await deleteTask(taskId)).success).toBe(true);
    expect((await getProjectById(projectId))?.modules[0].tasks).toEqual([]);
    expect((await prisma.module.findUnique({ where: { id: moduleId } }))?.cachedProgress).toBe(0);
  });
});
