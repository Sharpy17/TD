import type { Task } from "./types";

export type DeadlineStatus = "none" | "safe" | "warning" | "burning" | "overdue";

const HOUR_MS = 60 * 60 * 1000;

export function getDeadlineStatus(
  dueAt: string | null,
  nowMs: number = Date.now(),
  taskStatus?: Task["status"],
): DeadlineStatus {
  if (!dueAt || taskStatus === "DONE") return "none";

  const dueMs = Date.parse(dueAt);
  if (!Number.isFinite(dueMs)) return "none";

  const hoursLeft = (dueMs - nowMs) / HOUR_MS;
  if (hoursLeft < 0) return "overdue";
  if (hoursLeft <= 24) return "burning";
  if (hoursLeft <= 72) return "warning";
  return "safe";
}

export function isUrgentTask(task: Task, nowMs: number = Date.now()): boolean {
  const status = getDeadlineStatus(task.dueAt, nowMs, task.status);
  return status === "burning" || status === "overdue";
}

export function formatDeadline(dueAt: string | null, nowMs: number = Date.now()): string {
  if (!dueAt) return "No deadline";
  const dueMs = Date.parse(dueAt);
  if (!Number.isFinite(dueMs)) return "Invalid deadline";

  const deltaMs = dueMs - nowMs;
  const absoluteMinutes = Math.floor(Math.abs(deltaMs) / 60_000);
  const days = Math.floor(absoluteMinutes / 1_440);
  const hours = Math.floor((absoluteMinutes % 1_440) / 60);
  const minutes = absoluteMinutes % 60;
  const duration = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;

  return deltaMs < 0 ? `Overdue by ${duration}` : `${duration} left`;
}
