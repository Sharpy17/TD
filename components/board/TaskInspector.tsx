"use client";

import type { TaskStatus } from "@/lib/domain/types";
import {
  BOARD_COLUMNS,
  deadlineTone,
  formatClock,
  formatFullDate,
  PRIORITY_LABEL,
  PRIORITY_LEVEL,
  type BoardTask,
} from "./boardModel";
import { PriorityBars } from "./icons";

export function TaskInspector({
  task,
  nowMs,
  onMove,
  onClose,
  onEdit,
  onDelete,
}: {
  task: BoardTask | null;
  nowMs: number;
  onMove: (taskId: string, status: TaskStatus) => void;
  onClose: () => void;
  onEdit: (task: BoardTask) => void;
  onDelete: (task: BoardTask) => void;
}) {
  if (!task) {
    return (
      <aside className="board-inspector board-inspector--empty" aria-label="Task details">
        <strong>No task selected</strong>
        <p>Pick a card to see its details.</p>
        <p>
          <kbd>J</kbd> <kbd>K</kbd> move between cards · <kbd>N</kbd> new task
        </p>
      </aside>
    );
  }

  const tone = deadlineTone(task, nowMs);
  const urgent = tone === "burning" || tone === "overdue";
  const priority = task.priority ?? "MEDIUM";

  return (
    <aside className="board-inspector" aria-label="Task details">
      <div className="board-inspector__head">
        <span>{task.moduleName}</span>
        <button type="button" className="board-icon-button" aria-label="Close details" onClick={onClose}>
          ✕
        </button>
      </div>

      <h2>{task.title}</h2>

      {urgent && task.dueAt && (
        <div className={`board-countdown board-countdown--${tone}`}>
          <div>
            <span>{tone === "overdue" ? "Overdue by" : "Burning · time left"}</span>
            <strong suppressHydrationWarning>
              {tone === "overdue" ? "-" : ""}
              {formatClock(Date.parse(task.dueAt) - nowMs)}
            </strong>
          </div>
          <small suppressHydrationWarning>
            due
            <br />
            {formatFullDate(task.dueAt)}
          </small>
        </div>
      )}

      <div className="board-inspector__field">
        <span>Status</span>
        <div className="board-segmented" role="group" aria-label="Move task">
          {BOARD_COLUMNS.map((column) => (
            <button
              key={column.status}
              type="button"
              aria-pressed={task.status === column.status}
              disabled={task.pending}
              onClick={() => onMove(task.id, column.status)}
            >
              {column.short}
            </button>
          ))}
        </div>
      </div>

      <dl className="board-props">
        <div>
          <dt>Assignee</dt>
          <dd>
            <span className={`board-avatar ${task.assignee ? "" : "board-avatar--empty"}`}>
              {task.assignee?.initials ?? "–"}
            </span>
            {task.assignee?.name ?? "Unassigned"}
          </dd>
        </div>
        <div>
          <dt>Module</dt>
          <dd>{task.moduleName}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>
            <PriorityBars level={PRIORITY_LEVEL[priority]} />
            {PRIORITY_LABEL[priority]}
          </dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd className="board-mono" suppressHydrationWarning>
            {formatFullDate(task.dueAt)}
          </dd>
        </div>
      </dl>

      <p className="board-inspector__description">{task.description || "No description yet."}</p>

      <div className="board-inspector__actions">
        <button type="button" className="secondary-button" disabled={task.pending} onClick={() => onEdit(task)}>
          Edit task
        </button>
        <button
          type="button"
          className="secondary-button board-danger"
          disabled={task.pending}
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      </div>
    </aside>
  );
}
