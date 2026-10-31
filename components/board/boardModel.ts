import { getDeadlineStatus, type DeadlineStatus } from "@/lib/domain/deadlines";
import { compareOrderKeys } from "@/lib/domain/ordering";
import type { Task, TaskPriority, TaskStatus } from "@/lib/domain/types";

export type BoardTask = Task & { moduleId: string; moduleName: string; code: string | null; pending?: boolean };

export const BOARD_COLUMNS: Array<{ status: TaskStatus; label: string; short: string; color: string }> = [
  { status: "BACKLOG", label: "Backlog", short: "Backlog", color: "#6b7280" },
  { status: "IN_PROGRESS", label: "In progress", short: "Doing", color: "#7c71ff" },
  // Sky, not amber: amber is reserved for "due in 1–3 days".
  { status: "REVIEW", label: "Review", short: "Review", color: "#38bdf8" },
  { status: "DONE", label: "Done", short: "Done", color: "#10b981" },
];

export const WIP_LIMIT = 6;
/** Per the spec: no more than 3 tasks in progress per person. */
export const PERSONAL_WIP_LIMIT = 3;
/** Done cards older than this fold behind "Show older". */
export const DONE_FRESH_MS = 7 * 24 * 3_600_000;

const AVATAR_TONES = 6;

/** Stable per-person color index, so the same teammate always gets the same avatar color. */
export function avatarTone(userId: string): number {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % AVATAR_TONES;
}

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

const PINNED_RANK: Partial<Record<ChipTone, number>> = { overdue: 0, burning: 1 };

/**
 * Overdue, then burning cards are pinned to the top (soonest first) so they can't be buried;
 * everything else follows the team's manual drag order.
 */
export function compareForColumn(a: BoardTask, b: BoardTask, nowMs: number): number {
  const rankA = PINNED_RANK[deadlineTone(a, nowMs)] ?? 2;
  const rankB = PINNED_RANK[deadlineTone(b, nowMs)] ?? 2;
  if (rankA !== rankB) return rankA - rankB;
  if (rankA < 2) return Date.parse(a.dueAt!) - Date.parse(b.dueAt!);
  return compareOrderKeys(a.orderKey, b.orderKey) || a.id.localeCompare(b.id);
}

export function isPinned(task: BoardTask, nowMs: number): boolean {
  return PINNED_RANK[deadlineTone(task, nowMs)] !== undefined;
}

export type DuePreset = "2h" | "eod" | "tomorrow" | "3d" | "monday" | "none";

/** Quick deadline choices. "eod" is only offered while there is still a working day left. */
export function duePresets(nowMs: number): DuePreset[] {
  const presets: DuePreset[] = ["2h"];
  if (new Date(nowMs).getHours() < 17) presets.push("eod");
  return [...presets, "tomorrow", "3d", "monday", "none"];
}

export const DUE_PRESET_LABEL: Record<DuePreset, string> = {
  "2h": "In 2 hours",
  eod: "Today, 18:00",
  tomorrow: "Tomorrow, 10:00",
  "3d": "In 3 days",
  monday: "Next Monday, 10:00",
  none: "No due date",
};

export function resolveDuePreset(preset: DuePreset, nowMs: number): number | null {
  const at = (date: Date, hours: number) => {
    date.setHours(hours, 0, 0, 0);
    return date.getTime();
  };
  const day = new Date(nowMs);
  switch (preset) {
    case "2h":
      return nowMs + 2 * 3_600_000;
    case "eod":
      return at(day, 18);
    case "tomorrow":
      day.setDate(day.getDate() + 1);
      return at(day, 10);
    case "3d":
      day.setDate(day.getDate() + 3);
      return at(day, 18);
    case "monday":
      day.setDate(day.getDate() + (((8 - day.getDay()) % 7) || 7));
      return at(day, 10);
    case "none":
      return null;
  }
}

/** Value for an <input type="datetime-local"> in the viewer's own time zone. */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function formatFullDate(dueAt: string | null): string {
  if (!dueAt) return "No due date";
  const d = new Date(dueAt);
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
