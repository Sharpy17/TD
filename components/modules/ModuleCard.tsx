"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { isUrgentTask } from "@/lib/domain/deadlines";
import { calculateProgress, countCompleted } from "@/lib/domain/progress";
import type { Module, Task } from "@/lib/domain/types";
import { RadialProgressRing } from "./RadialProgressRing";
import { renameTaskAction } from "@/app/projects/[projectId]/actions";

export function ModuleCard({
  module,
  nowMs,
  projectId,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: {
  module: Module;
  nowMs: number;
  projectId?: string;
  onAddTask?: (moduleId: string) => void;
  onEditTask?: (task: Task, moduleId: string) => void;
  onDeleteTask?: (taskId: string, taskTitle: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [, startTransition] = useTransition();

  const progress = calculateProgress(module.tasks);
  const completed = countCompleted(module);
  const burningCount = module.tasks.filter((task) => isUrgentTask(task, nowMs)).length;

  const handleStartRename = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveRename = (taskId: string, originalTitle: string) => {
    const trimmed = editingTitle.trim();
    setEditingTaskId(null);
    if (!trimmed || trimmed === originalTitle) return;

    startTransition(async () => {
      await renameTaskAction(taskId, trimmed, projectId);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, taskId: string, originalTitle: string) => {
    if (e.key === "Enter") {
      handleSaveRename(taskId, originalTitle);
    } else if (e.key === "Escape") {
      setEditingTaskId(null);
    }
  };

  return (
    <article className={`module-card ${burningCount ? "module-card--burning" : ""}`}>
      <Link className="module-card__head module-card__link" href={`/projects/${projectId}/modules/${module.id}`} aria-label={`Open ${module.name}`}>
        <span className="module-card__icon" aria-hidden="true">
          {module.icon}
        </span>
        <div>
          <h3>{module.name}</h3>
          <p>{module.description}</p>
        </div>
        <RadialProgressRing percentage={progress} />
      </Link>
      <div className="module-card__meta">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            color: "var(--secondary)",
            cursor: "pointer",
            padding: 0,
            fontSize: 11,
            textDecoration: "underline",
          }}
        >
          {completed}/{module.tasks.length} tasks {expanded ? "▲" : "▼"}
        </button>
        <span>{module.assignees?.length ? module.assignees.map((person) => person.name).join(", ") : "Everyone"}</span>
      </div>

      <div className="module-card__footer">
        <button type="button" className="channel-pill">
          # {module.channelSlug}
        </button>
        {onAddTask && (
          <button
            type="button"
            className="channel-pill"
            style={{ marginLeft: 6, color: "var(--text)", border: "1px solid var(--border)" }}
            onClick={() => onAddTask(module.id)}
          >
            + Task
          </button>
        )}
        {progress === 100 ? <span className="status status--done">Shipped</span> : null}
        {burningCount > 0 ? (
          <span className="status status--burning">{burningCount} burning</span>
        ) : null}
        {module.tasks.length === 0 ? <span className="status">Not started</span> : null}
      </div>

      {expanded && (
        <div className="module-tasks-container">
          {module.tasks.length === 0 ? (
            <small style={{ color: "var(--muted)", padding: "6px 0" }}>
              No tasks in this module yet. Click &quot;+ Task&quot; to add one.
            </small>
          ) : (
            module.tasks.map((task) => (
              <div key={task.id} className="module-task-row">
                <div className="module-task-row__title">
                  <span
                    className={`task-status-pill task-status-pill--${task.status.toLowerCase()}`}
                  >
                    {task.status.replace("_", " ")}
                  </span>

                  {editingTaskId === task.id ? (
                    <input
                      autoFocus
                      type="text"
                      className="task-inline-edit-input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveRename(task.id, task.title)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, task.title)}
                    />
                  ) : (
                    <strong
                      className="task-clickable-title"
                      onClick={() => handleStartRename(task)}
                      title="Click to rename"
                    >
                      {task.title}
                    </strong>
                  )}
                </div>

                <div className="task-row-actions">
                  {onEditTask && (
                    <button
                      type="button"
                      className="task-row-btn"
                      title="Edit task & deadline"
                      aria-label={`Edit task ${task.title}`}
                      onClick={() => onEditTask(task, module.id)}
                    >
                      ✎
                    </button>
                  )}
                  {onDeleteTask && (
                    <button
                      type="button"
                      className="task-row-delete-btn"
                      title="Delete task"
                      aria-label={`Delete task ${task.title}`}
                      onClick={() => onDeleteTask(task.id, task.title)}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </article>
  );
}
