import type { Module, Project, Task } from "./types";

export function calculateProgress(tasks: readonly Pick<Task, "status">[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((task) => task.status === "DONE").length;
  return Math.min(100, Math.max(0, Math.round((done / tasks.length) * 100)));
}

export function calculateProjectProgress(project: Pick<Project, "modules">): number {
  if (project.modules.length === 0) return 0;
  const sum = project.modules.reduce((total, module) => total + calculateProgress(module.tasks), 0);
  return Math.round(sum / project.modules.length);
}

export function countCompleted(module: Pick<Module, "tasks">): number {
  return module.tasks.filter((task) => task.status === "DONE").length;
}
