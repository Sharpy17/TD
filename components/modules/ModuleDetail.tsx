"use client";

import { useOptimistic, useState, useTransition } from "react";
import { TASK_STATUSES, type Module, type Task, type TaskStatus, type UserSummary } from "@/lib/domain/types";
import { calculateProgress } from "@/lib/domain/progress";
import { isUrgentTask } from "@/lib/domain/deadlines";
import { changeModuleTaskStatus } from "@/app/projects/[projectId]/modules/[moduleId]/actions";
import { createTaskAction } from "@/app/projects/[projectId]/actions";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { DeleteTaskModal } from "@/components/tasks/DeleteTaskModal";
import { ModuleAssignees } from "./ModuleAssignees";
import { RadialProgressRing } from "./RadialProgressRing";

const statusLabels: Record<TaskStatus, string> = {
  BACKLOG: "Backlog", IN_PROGRESS: "In progress", REVIEW: "Review", DONE: "Done",
};

export function ModuleDetail({ module, projectId, people, canEdit, nowMs }: {
  module: Module; projectId: string; people: UserSummary[]; canEdit: boolean; nowMs: number;
}) {
  const [tasks, moveTask] = useOptimistic(module.tasks, (current, change: { id: string; status: TaskStatus }) =>
    current.map((task) => task.id === change.id ? { ...task, status: change.status } : task));
  const [pending, startTransition] = useTransition();
  const [creating, startCreating] = useTransition();
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const progress = calculateProgress(tasks);
  const urgent = tasks.filter((task) => isUrgentTask(task, nowMs)).length;
  const visible = tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));

  function changeStatus(task: Task, status: TaskStatus) {
    setError("");
    startTransition(async () => {
      moveTask({ id: task.id, status });
      try {
        const result = await changeModuleTaskStatus(module.id, task.id, status);
        if (!result.success) setError(result.error || "Could not move task.");
      } catch {
        setError("Could not move task. Please try again.");
      }
    });
  }

  function quickCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setError("");
    const form = new FormData();
    form.set("projectId", projectId);
    form.set("moduleId", module.id);
    form.set("title", title.trim());
    startCreating(async () => {
      try {
        const result = await createTaskAction({}, form);
        if (result.success) setTitle("");
        else setError(result.error || "Could not create task.");
      } catch {
        setError("Could not create task. Your title is still here; please try again.");
      }
    });
  }

  return (
    <div className="module-detail">
      <section className="module-detail-hero">
        <div>
          <span className="eyebrow">Module overview</span>
          <h1><span aria-hidden="true">{module.icon}</span> {module.name}</h1>
          <p>{module.description || "A shared space to plan, track, and finish this part of the project."}</p>
          <div className="module-detail-stats">
            <span>{tasks.filter((task) => task.status === "DONE").length} / {tasks.length} completed</span>
            <span>{tasks.filter((task) => task.status === "IN_PROGRESS").length} in progress</span>
            {urgent > 0 && <span className="status status--burning">🔥 {urgent} urgent</span>}
          </div>
        </div>
        <RadialProgressRing percentage={progress} size={92} />
      </section>

      <ModuleAssignees moduleId={module.id} assignees={module.assignees || []} people={people} canEdit={canEdit} />

      <section aria-labelledby="module-tasks-title">
        <div className="section-heading module-task-heading">
          <div><span className="eyebrow">From idea to done</span><h2 id="module-tasks-title">Tasks <span className="optional">{tasks.length}</span></h2></div>
          <input className="form-input module-task-search" aria-label="Find a task" placeholder="Find a task…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        {canEdit ? (
          <form className="module-quick-create" onSubmit={quickCreate}>
            <input className="form-input" aria-label="New task title" placeholder="What needs to get done?" required maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} disabled={creating} />
            <button className="primary-button" disabled={creating || !title.trim()}>{creating ? "Adding…" : "+ Add task"}</button>
            <button type="button" className="secondary-button" onClick={() => setShowCreate(true)}>Add with details</button>
          </form>
        ) : <p className="module-readonly">Sign in as a workspace member to create tasks and manage this module.</p>}
        {error && <p className="auth-banner-error" role="alert">{error}</p>}
        {!tasks.length && <p className="module-board-hint">Your module is ready. Add the first task to get started.</p>}
        {query && !visible.length && <p className="module-board-hint">No tasks match “{query}”.</p>}
        <div className="module-board">
          {TASK_STATUSES.map((status) => (
            <section className="module-board-column" key={status} aria-label={statusLabels[status]}>
              <h3><span className={`task-status-pill task-status-pill--${status.toLowerCase()}`}>{statusLabels[status]}</span><span>{visible.filter((task) => task.status === status).length}</span></h3>
              {visible.filter((task) => task.status === status).map((task) => (
                <article key={task.id} className={`module-board-task ${isUrgentTask(task, nowMs) ? "module-board-task--urgent" : ""}`}>
                  <button className="module-task-title" type="button" disabled={!canEdit || pending} onClick={() => setEditing(task)}>{task.title}</button>
                  {task.description && <p>{task.description}</p>}
                  <div className="module-task-tags">
                    <span>{task.priority || "MEDIUM"}</span>
                    {task.dueAt && <time dateTime={task.dueAt}>{isUrgentTask(task, nowMs) ? "🔥 " : ""}{new Date(task.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</time>}
                  </div>
                  <small>{task.assignee?.name || "Unassigned task"}</small>
                  {canEdit && <div className="module-task-controls">
                    <select aria-label={`Status of ${task.title}`} className="form-input" value={task.status} disabled={pending} onChange={(event) => changeStatus(task, event.target.value as TaskStatus)}>
                      {TASK_STATUSES.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
                    </select>
                    <button className="task-row-delete-btn" type="button" disabled={pending} aria-label={`Delete ${task.title}`} onClick={() => setDeleting(task)}>×</button>
                  </div>}
                </article>
              ))}
              {!visible.some((task) => task.status === status) && <p className="module-column-empty">No tasks here yet</p>}
            </section>
          ))}
        </div>
      </section>
      {showCreate && <CreateTaskModal isOpen onClose={() => setShowCreate(false)} projectId={projectId} modules={[module]} defaultModuleId={module.id} />}
      {editing && <EditTaskModal key={editing.id} isOpen onClose={() => setEditing(null)} projectId={projectId} modules={[module]} currentModuleId={module.id} task={editing} />}
      {deleting && <DeleteTaskModal isOpen onClose={() => setDeleting(null)} projectId={projectId} taskId={deleting.id} taskTitle={deleting.title} />}
    </div>
  );
}
