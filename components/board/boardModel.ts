import { getDeadlineStatus, type DeadlineStatus } from "@/lib/domain/deadlines";
import type { Task, TaskPriority, TaskStatus } from "@/lib/domain/types";

export type BoardTask = Task & { moduleId: string; moduleName: string; pending?: boolean };

export const BOARD_COLUMNS: Array<{ status: TaskStatus; label: string; short: string; color: string }> = [
  { status: "BACKLOG", label: "Backlog", short: "Backlog", color: "#6b7280" },
  { status: "IN_PROGRESS", label: "In progress", short: "Doing", color: "#7c71ff" },
  { status: "REVIEW", label: "Review", short: "Review", color: "#ffaa00" },
  { status: "DONE", label: "Done", short: "Done", color: "#10b981" },
];

export const WIP_LIMIT = 6;

export const PRIORITY_LEVEL: Record<TaskPriority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export type ChipTone = DeadlineStatus | "done";

const HOUR_MS = 3_600_000;
const pad = (n: number) => String(n).padStart(2, "0");

/** `05:42:13` — fixed width so a live countdown never jitters. */
export function formatClock(ms: number): string {
  const abs = Math.abs(ms);
  return `${pad(Math.floor(abs / HOUR_MS))}:${pad(Math.floor((abs % HOUR_MS) / 60_000))}:${pad(Math.floor((abs % 60_000) / 1000))}`;
}

export function deadlineTone(task: Pick<Task, "status" | "dueAt">, nowMs: number): ChipTone {
  if (task.status === "DONE") return "done";
  return getDeadlineStatus(task.dueAt, nowMs, task.status);
}

export function deadlineChipLabel(task: Pick<Task, "status" | "dueAt">, nowMs: number): string | null {
  const tone = deadlineTone(task, nowMs);
  if (tone === "done") return "Shipped";
  if (tone === "none" || !task.dueAt) return null;

  const deltaMs = Date.parse(task.dueAt) - nowMs;
  const hours = Math.floor(Math.abs(deltaMs) / HOUR_MS);
  const minutes = Math.floor((Math.abs(deltaMs) % HOUR_MS) / 60_000);

  switch (tone) {
    case "overdue":
      return `Expired ${hours}h ${pad(minutes)}m`;
    case "burning":
      return formatClock(deltaMs);
    case "warning":
      return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
    default:
      return new Date(task.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

const TONE_RANK: Record<ChipTone, number> = { overdue: 0, burning: 1, warning: 2, safe: 3, none: 4, done: 5 };

/** Overdue first, then by how soon it is due; tasks without a deadline sink. */
export function compareByUrgency(a: BoardTask, b: BoardTask, nowMs: number): number {
  const rank = TONE_RANK[deadlineTone(a, nowMs)] - TONE_RANK[deadlineTone(b, nowMs)];
  if (rank !== 0) return rank;
  const aDue = a.dueAt ? Date.parse(a.dueAt) : Infinity;
  const bDue = b.dueAt ? Date.parse(b.dueAt) : Infinity;
  return aDue - bDue;
}

export function formatFullDate(dueAt: string | null): string {
  if (!dueAt) return "No due date";
  const d = new Date(dueAt);
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
