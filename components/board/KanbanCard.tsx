"use client";

import type { DragEvent } from "react";
import type { UserSummary } from "@/lib/domain/types";
import { avatarTone, deadlineChipLabel, deadlineTone, PRIORITY_LEVEL, type BoardTask } from "./boardModel";
import { ChatIcon, ChecklistIcon, FlameIcon, PriorityBars } from "./icons";

export function Avatar({ user, live = false, size }: { user: UserSummary | null; live?: boolean; size?: "sm" }) {
  if (!user) {
    return (
      <span className={`board-avatar board-avatar--empty ${size ? `board-avatar--${size}` : ""}`} title="Unassigned">
        –
      </span>
    );
  }
  return (
    <span
      className={`board-avatar board-avatar--t${avatarTone(user.id)} ${live ? "board-avatar--live" : ""} ${size ? `board-avatar--${size}` : ""}`}
      title={live ? `${user.name} · in voice` : user.name}
    >
      {user.initials}
    </span>
  );
}

export type DropEdge = "before" | "after";

export function KanbanCard({
  task,
  nowMs,
  selected,
  assigneeLive,
  dropEdge,
  onSelect,
  onDragOverCard,
}: {
  task: BoardTask;
  nowMs: number;
  selected: boolean;
  assigneeLive: boolean;
  dropEdge: DropEdge | null;
  onSelect: (taskId: string) => void;
  onDragOverCard: (taskId: string, edge: DropEdge) => void;
}) {
  const tone = deadlineTone(task, nowMs);
  const chip = deadlineChipLabel(task, nowMs);
  const checklist = task.checklist ?? [];
  const checked = checklist.filter((item) => item.done).length;

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    if (!event.dataTransfer.types.includes("text/task-id")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onDragOverCard(task.id, event.clientY < rect.top + rect.height / 2 ? "before" : "after");
  };

  return (
    <button
      type="button"
      className={[
        "board-card",
        `board-card--${tone}`,
        selected && "board-card--selected",
        task.pending && "board-card--pending",
        dropEdge && `board-card--drop-${dropEdge}`,
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={!task.pending}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onClick={() => onSelect(task.id)}
      data-task-id={task.id}
      aria-pressed={selected}
    >
      <span className="board-card__top">
        <PriorityBars level={PRIORITY_LEVEL[task.priority ?? "MEDIUM"]} />
        {task.code && <span className="board-mono board-card__code">{task.code}</span>}
        <span className="board-card__module">{task.moduleName}</span>
      </span>
      <span className="board-card__title">{task.title}</span>
      <span className="board-card__foot">
        {chip && (
          <span className={`board-chip board-chip--${tone}`} suppressHydrationWarning>
            {tone === "burning" && <FlameIcon />}
            {chip}
          </span>
        )}
        {checklist.length > 0 && (
          <span className={`board-meta board-mono ${checked === checklist.length ? "board-meta--complete" : ""}`}>
            <ChecklistIcon />
            {checked}/{checklist.length}
          </span>
        )}
        {(task.commentCount ?? 0) > 0 && (
          <span className="board-meta board-mono">
            <ChatIcon />
            {task.commentCount}
          </span>
        )}
        <span className="board-card__assignee">
          <Avatar user={task.assignee} live={assigneeLive} />
        </span>
      </span>
    </button>
  );
}
