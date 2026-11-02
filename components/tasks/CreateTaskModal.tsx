"use client";

import { useActionState, useEffect, useState } from "react";
import { createTaskAction, type TaskActionState } from "@/app/projects/[projectId]/actions";
import { Icon } from "@/components/ui/Icon";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  modules: Array<{ id: string; name: string; icon?: string }>;
  defaultModuleId?: string;
}

const initialState: TaskActionState = {};

export function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  modules,
  defaultModuleId,
}: CreateTaskModalProps) {
  const [state, formAction, isPending] = useActionState(createTaskAction, initialState);

  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [selectedStatus, setSelectedStatus] = useState<"BACKLOG" | "IN_PROGRESS">("BACKLOG");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState<string>("");

  const effectiveModuleId = selectedModuleId || defaultModuleId || modules[0]?.id || "";

  // Close modal on successful task creation
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

  if (!isOpen) return null;

  // Preset deadline helpers
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
      aria-labelledby="create-task-title"
    >
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="create-task-title">Create task</h2>
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
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="status" value={selectedStatus} />
          <input type="hidden" name="priority" value={selectedPriority} />

          {/* Task Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">
              Task title *
            </label>
            <input
              id="task-title"
              name="title"
              type="text"
              required
              autoFocus
              placeholder="e.g. Implement auto-reconnect for WebRTC rooms"
              className={`form-input ${state?.fieldErrors?.title ? "form-input--error" : ""}`}
              disabled={isPending}
            />
            {state?.fieldErrors?.title && (
              <span className="form-error">{state.fieldErrors.title}</span>
            )}
          </div>

          {/* Module Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-module">
              Assign to Module *
            </label>
            <select
              id="task-module"
              name="moduleId"
              value={effectiveModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="form-input"
              style={{ cursor: "pointer" }}
              disabled={isPending}
              required
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
              <label htmlFor="task-dueAt">Deadline</label>
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
              id="task-dueAt"
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

          {/* Priority Selector */}
          <div className="form-group">
            <label className="form-label">
              <span>Priority</span>
            </label>
            <div className="chip-group">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`chip-btn ${selectedPriority === p ? (p === "CRITICAL" ? "chip-btn--active chip-btn--burning" : p === "HIGH" ? "chip-btn--active chip-btn--warning" : "chip-btn--active") : ""}`}
                  onClick={() => setSelectedPriority(p)}
                >
                  {p === "CRITICAL" ? "Critical" : p === "HIGH" ? "High" : p === "MEDIUM" ? "Medium" : "Low"}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Status */}
          <div className="form-group">
            <label className="form-label">
              <span>Initial Stage</span>
            </label>
            <div className="chip-group">
              <button
                type="button"
                className={`chip-btn ${selectedStatus === "BACKLOG" ? "chip-btn--active" : ""}`}
                onClick={() => setSelectedStatus("BACKLOG")}
              >
                Backlog
              </button>
              <button
                type="button"
                className={`chip-btn ${selectedStatus === "IN_PROGRESS" ? "chip-btn--active" : ""}`}
                onClick={() => setSelectedStatus("IN_PROGRESS")}
              >
                In Progress
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">
              <span>Notes / Checklist</span>
              <span className="optional">optional</span>
            </label>
            <textarea
              id="task-desc"
              name="description"
              rows={2}
              placeholder="Context, requirements, links..."
              className="form-input"
              style={{ height: "auto", padding: "8px 12px", resize: "vertical" }}
              disabled={isPending}
            />
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
              {isPending ? "Creating..." : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
