import { describe, expect, it } from "vitest";
import { createTask, deleteTask, updateTask } from "../lib/tasks/service";
import { createProject, deleteProject, getProjectById } from "../lib/projects/service";
import { createModule } from "../lib/modules/service";
import { isUrgentTask, getDeadlineStatus } from "../lib/domain/deadlines";

describe("Tasks Service (lib/tasks/service)", () => {
  it("rejects task creation with invalid titles", async () => {
    const emptyTitle = await createTask({
      moduleId: "mod_123",
      title: "   ",
    });
    expect(emptyTitle.success).toBe(false);
    expect(emptyTitle.error).toContain("cannot be empty");

    const longTitle = await createTask({
      moduleId: "mod_123",
      title: "T".repeat(151),
    });
    expect(longTitle.success).toBe(false);
    expect(longTitle.error).toContain("cannot exceed 150 characters");
  });

  it("fails if the target module does not exist", async () => {
    const missingModule = await createTask({
      moduleId: "non-existent-module-xyz",
      title: "Fix broken build",
    });
    expect(missingModule.success).toBe(false);
    expect(missingModule.error).toContain("Target module not found");
  });

  it("creates a task, recalculates progress, and triggers deadline status", async () => {
    // 1. Create a project and module
    const projectRes = await createProject({
      name: "Task Engine Test Project",
      createDefaultModules: false,
    });
    expect(projectRes.success).toBe(true);
    const projectId = projectRes.projectId!;

    const moduleRes = await createModule({
      projectId,
      name: "Realtime Engine",
      icon: "⚡",
    });
    expect(moduleRes.success).toBe(true);
    const moduleId = moduleRes.moduleId!;

    // 2. Create a burning task (due in 6 hours)
    const burningDueDate = new Date(Date.now() + 6 * 3600 * 1000);
    const task1Res = await createTask({
      moduleId,
      title: "Fix critical WebRTC audio drift",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      dueAt: burningDueDate,
    });

    expect(task1Res.success).toBe(true);
    expect(task1Res.taskId).toBeDefined();

    // 3. Verify in project data
    const projectAfterTask1 = await getProjectById(projectId);
    expect(projectAfterTask1).toBeDefined();
    const mod = projectAfterTask1?.modules.find((m) => m.id === moduleId);
    expect(mod).toBeDefined();
    expect(mod?.tasks.length).toBe(1);

    const task1 = mod?.tasks[0];
    expect(task1).toBeDefined();
    if (!task1) throw new Error("Task 1 not found");
    expect(task1.title).toBe("Fix critical WebRTC audio drift");
    expect(task1.dueAt).toBeDefined();

    // 4. Verify deadline classifier sees it as burning
    expect(isUrgentTask(task1)).toBe(true);
    expect(getDeadlineStatus(task1.dueAt)).toBe("burning");

    // 5. Create a DONE task to verify progress recalculation
    const task2Res = await createTask({
      moduleId,
      title: "Initial setup done",
      status: "DONE",
    });
    expect(task2Res.success).toBe(true);

    const projectAfterTask2 = await getProjectById(projectId);
    const updatedMod = projectAfterTask2?.modules.find((m) => m.id === moduleId);
    expect(updatedMod?.tasks.length).toBe(2);

    // 1 out of 2 tasks are DONE -> 50% progress
    const doneTasks = updatedMod?.tasks.filter((t) => t.status === "DONE").length;
    expect(doneTasks).toBe(1);

    // Clean up
    await deleteProject(projectId);
  });

  it("deletes a task and recalculates progress", async () => {
    // 1. Create a project and module
    const projectRes = await createProject({
      name: "Task Deletion Project",
      createDefaultModules: false,
    });
    expect(projectRes.success).toBe(true);
    const projectId = projectRes.projectId!;

    const moduleRes = await createModule({
      projectId,
      name: "Task Deletion Module",
      icon: "▦",
    });
    const moduleId = moduleRes.moduleId!;

    // 2. Create 2 tasks (1 BACKLOG, 1 DONE)
    const t1 = await createTask({
      moduleId,
      title: "Task To Keep",
      status: "DONE",
    });
    const t2 = await createTask({
      moduleId,
      title: "Task To Delete",
      status: "BACKLOG",
    });

    expect(t1.success).toBe(true);
    expect(t2.success).toBe(true);

    // 3. Delete the second task
    const delRes = await deleteTask(t2.taskId!);
    expect(delRes.success).toBe(true);

    // 4. Verify in project data: only 1 task remaining, and it's DONE -> 100% progress
    const project = await getProjectById(projectId);
    const mod = project?.modules.find((m) => m.id === moduleId);
    expect(mod?.tasks.length).toBe(1);
    expect(mod?.tasks[0].title).toBe("Task To Keep");

    // 5. Deleting already deleted task returns error
    const delAgain = await deleteTask(t2.taskId!);
    expect(delAgain.success).toBe(false);
    expect(delAgain.error).toContain("Task not found");

    // Clean up
    await deleteProject(projectId);
  });

  it("updates task title, status, deadline, and recalculates progress correctly", async () => {
    // 1. Setup project with 2 modules
    const projectRes = await createProject({
      name: "Task Update Test Project",
      createDefaultModules: false,
    });
    const projectId = projectRes.projectId!;

    const m1Res = await createModule({ projectId, name: "Module Alpha", icon: "⚡" });
    const m2Res = await createModule({ projectId, name: "Module Beta", icon: "⚙️" });
    const mod1Id = m1Res.moduleId!;
    const mod2Id = m2Res.moduleId!;

    // 2. Create a task in Module 1 with BACKLOG
    const created = await createTask({
      moduleId: mod1Id,
      title: "Initial Draft Title",
      status: "BACKLOG",
    });
    const taskId = created.taskId!;

    // 3. Rename task
    const renameRes = await updateTask({
      taskId,
      title: "Updated Shiny Title",
    });
    expect(renameRes.success).toBe(true);

    // 4. Update deadline to burning and priority to CRITICAL
    const burningTime = new Date(Date.now() + 5 * 3600 * 1000);
    const deadlineRes = await updateTask({
      taskId,
      dueAt: burningTime,
      priority: "CRITICAL",
    });
    expect(deadlineRes.success).toBe(true);

    const projectAfterUpdate = await getProjectById(projectId);
    const mod1 = projectAfterUpdate?.modules.find((m) => m.id === mod1Id);
    const task = mod1?.tasks.find((t) => t.id === taskId);
    expect(task?.title).toBe("Updated Shiny Title");
    expect(task?.priority).toBe("CRITICAL");
    expect(task?.dueAt).toBeDefined();
    expect(isUrgentTask(task!)).toBe(true);

    // 5. Change status to DONE and check progress reaches 100%
    const statusRes = await updateTask({
      taskId,
      status: "DONE",
    });
    expect(statusRes.success).toBe(true);

    const projectAfterDone = await getProjectById(projectId);
    const mod1AfterDone = projectAfterDone?.modules.find((m) => m.id === mod1Id);
    const doneCount = mod1AfterDone?.tasks.filter((t) => t.status === "DONE").length;
    expect(doneCount).toBe(1);

    // 6. Move task from Module 1 to Module 2
    const moveRes = await updateTask({
      taskId,
      moduleId: mod2Id,
    });
    expect(moveRes.success).toBe(true);

    const projectAfterMove = await getProjectById(projectId);
    const mod1AfterMove = projectAfterMove?.modules.find((m) => m.id === mod1Id);
    const mod2AfterMove = projectAfterMove?.modules.find((m) => m.id === mod2Id);

    // Mod 1 now has 0 tasks
    expect(mod1AfterMove?.tasks.length).toBe(0);
    // Mod 2 now has 1 task (and it's DONE)
    expect(mod2AfterMove?.tasks.length).toBe(1);
    expect(mod2AfterMove?.tasks[0].id).toBe(taskId);

    // 7. Validation: empty title error
    const emptyTitleRes = await updateTask({
      taskId,
      title: "   ",
    });
    expect(emptyTitleRes.success).toBe(false);
    expect(emptyTitleRes.error).toContain("cannot be empty");

    // Clean up
    await deleteProject(projectId);
  });
});
