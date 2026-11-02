"use client";

import { useState, useTransition } from "react";
import { formatDeadline, getDeadlineStatus, isUrgentTask } from "@/lib/domain/deadlines";
import type { Module, Task } from "@/lib/domain/types";
import { DeleteTaskModal } from "@/components/tasks/DeleteTaskModal";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { renameTaskAction } from "@/app/projects/[projectId]/actions";
import { Icon } from "@/components/ui/Icon";

type UrgentTask = { task: Task; moduleName: string; moduleId: string };

export function BurningDeadlines({
  modules,
  nowMs,
  projectId,
}: {
  modules: Module[];
  nowMs: number;
  projectId?: string;
}) {
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<{ task: Task; moduleId: string } | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [, startTransition] = useTransition();

  const urgent = modules.flatMap<UrgentTask>((module) =>
    module.tasks
      .filter((task) => isUrgentTask(task, nowMs))
      .map((task) => ({ task, moduleName: module.name, moduleId: module.id }))
  );

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

  if (urgent.length === 0) return null;

  return (
    <>
      <section className="burning-panel" aria-labelledby="burning-title">
        <div className="section-heading">
          <div>
            <h2 id="burning-title">Burning deadlines</h2>
          </div>
          <span className="live-count">
            <i /> {urgent.length} live
          </span>
        </div>
        <div className="burning-list">
          {urgent.map(({ task, moduleName, moduleId }) => {
            const status = getDeadlineStatus(task.dueAt, nowMs, task.status);
            return (
              <div className="burning-task" key={task.id}>
                <span className={`deadline-chip deadline-chip--${status}`}>
                  {status === "overdue" ? "Overdue" : "Burning"}
                </span>
                <span className="burning-task__copy">
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
                  <small>{moduleName}</small>
                </span>
                <span className="burning-task__time">{formatDeadline(task.dueAt, nowMs)}</span>
                <span className="avatar">{task.assignee?.initials ?? "?"}</span>
                <div className="task-row-actions task-row-actions--apart">
                  <button
                    type="button"
                    className="task-row-btn"
                    title="Edit task & deadline"
                    aria-label={`Edit task ${task.title}`}
                    onClick={() => setTaskToEdit({ task, moduleId })}
                  >
                    <Icon name="pencil" size={15} />
                  </button>
                  <button
                    type="button"
                    className="task-row-delete-btn"
                    title="Delete task"
                    aria-label={`Delete task ${task.title}`}
                    onClick={() => setTaskToDelete({ id: task.id, title: task.title })}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <DeleteTaskModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        taskId={taskToDelete?.id || ""}
        taskTitle={taskToDelete?.title || ""}
        projectId={projectId}
      />

      {taskToEdit && (
        <EditTaskModal
          key={taskToEdit.task.id}
          isOpen={true}
          onClose={() => setTaskToEdit(null)}
          task={taskToEdit.task}
          currentModuleId={taskToEdit.moduleId}
          modules={modules}
          projectId={projectId}
        />
      )}
    </>
  );
}
