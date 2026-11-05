"use client";

import { useActionState, useEffect, useState } from "react";
import { updateTaskAction, type TaskActionState } from "@/app/projects/[projectId]/actions";
import type { Task } from "@/lib/domain/types";
import { Icon } from "@/components/ui/Icon";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  modules: Array<{ id: string; name: string; icon?: string }>;
  currentModuleId: string;
  projectId?: string;
}

const initialState: TaskActionState = {};

function getInitialDueAt(dueAt: string | null | undefined): string {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  if (isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function EditTaskModal({
  isOpen,
  onClose,
  task,
  modules,
  currentModuleId,
  projectId,
}: EditTaskModalProps) {
  const [state, formAction, isPending] = useActionState(updateTaskAction, initialState);

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [moduleId, setModuleId] = useState(currentModuleId);
  const [status, setStatus] = useState<Task["status"]>(task?.status || "BACKLOG");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">(
    task?.priority || "MEDIUM"
  );
  const [dueAt, setDueAt] = useState<string>(() => getInitialDueAt(task?.dueAt));
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Close on success
  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state?.success, onClose]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const applyPresetDeadline = (preset: "today" | "2days" | "1week" | "clear", hours: number | null) => {
    if (preset === "clear" || hours === null) {
      setSelectedPreset(null);
      setDueAt("");
      return;
    }
    setSelectedPreset(preset);
    const d = new Date(Date.now() + hours * 3600 * 1000);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDueAt(localIso);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-title"
    >
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="edit-task-title">Edit task</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          ><Icon name="close" /></button>
        </div>

        {state?.error && (
          <div className="auth-banner-error" role="alert" style={{ marginBottom: 18 }}>
            <Icon name="alert" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="auth-form">
          <input type="hidden" name="taskId" value={task.id} />
          {projectId && <input type="hidden" name="projectId" value={projectId} />}
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="priority" value={priority} />

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-task-title-input">
              Task title *
            </label>
            <input
              id="edit-task-title-input"
              name="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="edit-task-desc-input">Description</label>
              <span className="optional">optional</span>
            </div>
            <textarea
              id="edit-task-desc-input"
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              placeholder="Add task context..."
              disabled={isPending}
              style={{ resize: "vertical", minHeight: 56, fontFamily: "inherit" }}
            />
          </div>

          {/* Module assignment */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-task-module">
              Module
            </label>
            <select
              id="edit-task-module"
              name="moduleId"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="form-input"
              disabled={isPending}
            >
              {modules.map((mod) => (
                <option key={mod.id} value={mod.id} style={{ background: "var(--surface-1)" }}>
                  
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline / Due Date */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="edit-task-dueAt">Deadline</label>
              <span className="optional">optional</span>
            </div>
            <div className="chip-group" style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={`chip-btn ${selectedPreset === "today" ? "chip-btn--active chip-btn--burning" : ""}`}
                onClick={() => applyPresetDeadline("today", 8)}
              >
                Today (8h)
              </button>
              <button
                type="button"
                className={`chip-btn ${selectedPreset === "2days" ? "chip-btn--active chip-btn--warning" : ""}`}
                onClick={() => applyPresetDeadline("2days", 48)}
              >
                In 2 days
              </button>
              <button
                type="button"
                className={`chip-btn ${selectedPreset === "1week" ? "chip-btn--active" : ""}`}
                onClick={() => applyPresetDeadline("1week", 168)}
              >
                In 1 week
              </button>
              {dueAt && (
                <button
                  type="button"
                  className="chip-btn"
                  style={{ color: "var(--muted)" }}
                  onClick={() => applyPresetDeadline("clear", null)}
                >
                  Clear
                </button>
              )}
            </div>
            <input
              id="edit-task-dueAt"
              name="dueAt"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => {
                setSelectedPreset(null);
                setDueAt(e.target.value);
              }}
              className="form-input"
              disabled={isPending}
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">
              <span>Stage</span>
            </label>
            <div className="chip-group">
              {(["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`chip-btn ${status === s ? (s === "DONE" ? "chip-btn--active" : "chip-btn--active") : ""}`}
                  onClick={() => setStatus(s)}
                >
                  {s === "DONE" ? "Done" : s === "IN_PROGRESS" ? "In progress" : s === "REVIEW" ? "Review" : "Backlog"}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">
              <span>Priority</span>
            </label>
            <div className="chip-group">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`chip-btn ${priority === p ? (p === "CRITICAL" ? "chip-btn--active chip-btn--burning" : p === "HIGH" ? "chip-btn--active chip-btn--warning" : "chip-btn--active") : ""}`}
                  onClick={() => setPriority(p)}
                >
                  {p === "CRITICAL" ? "Critical" : p === "HIGH" ? "High" : p === "MEDIUM" ? "Medium" : "Low"}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              style={{ minWidth: 140 }}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
