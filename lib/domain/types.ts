export const TASK_STATUSES = ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type UserSummary = {
  id: string;
  name: string;
  initials: string;
};

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  description?: string | null;
  dueAt: string | null;
  assignee: UserSummary | null;
  number?: number | null;
  orderKey?: string;
  completedAt?: string | null;
  checklist?: ChecklistItem[];
  commentCount?: number;
};

export type TaskComment = {
  id: string;
  content: string;
  createdAt: string;
  author: UserSummary;
};

export type Module = {
  id: string;
  name: string;
  description: string;
  icon: string;
  channelSlug: string;
  lead: UserSummary;
  assignees?: UserSummary[];
  tasks: Task[];
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  modules: Module[];
};

export type VoiceRoom = {
  id: string;
  name: string;
  maxUsers?: number;
  members: Array<UserSummary & { muted?: boolean; speaking?: boolean }>;
};
