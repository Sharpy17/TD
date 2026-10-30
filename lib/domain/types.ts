export const TASK_STATUSES = ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type UserSummary = {
  id: string;
  name: string;
  initials: string;
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  dueAt: string | null;
  assignee: UserSummary | null;
};

export type Module = {
  id: string;
  name: string;
  description: string;
  icon: string;
  channelSlug: string;
  lead: UserSummary;
  tasks: Task[];
};

export type Project = {
  id: string;
  name: string;
  modules: Module[];
};

export type VoiceRoom = {
  id: string;
  name: string;
  members: Array<UserSummary & { muted?: boolean; speaking?: boolean }>;
};
