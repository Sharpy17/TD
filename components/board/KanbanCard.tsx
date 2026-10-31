"use client";

import type { DragEvent } from "react";
import { deadlineChipLabel, deadlineTone, PRIORITY_LEVEL, type BoardTask } from "./boardModel";
import { FlameIcon, PriorityBars } from "./icons";

export function KanbanCard({
  task,
  nowMs,
  selected,
  onSelect,
}: {
  task: BoardTask;
  nowMs: number;
  selected: boolean;
  onSelect: (taskId: string) => void;
}) {
  const tone = deadlineTone(task, nowMs);
  const chip = deadlineChipLabel(task, nowMs);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <button
      type="button"
      className={`board-card board-card--${tone} ${selected ? "board-card--selected" : ""} ${task.pending ? "board-card--pending" : ""}`}
      draggable={!task.pending}
      onDragStart={handleDragStart}
      onClick={() => onSelect(task.id)}
      data-task-id={task.id}
      aria-pressed={selected}
    >
      <span className="board-card__top">
        <PriorityBars level={PRIORITY_LEVEL[task.priority ?? "MEDIUM"]} />
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
        <span
          className={`board-avatar ${task.assignee ? "" : "board-avatar--empty"}`}
          title={task.assignee?.name ?? "Unassigned"}
        >
          {task.assignee?.initials ?? "–"}
        </span>
      </span>
    </button>
  );
}
