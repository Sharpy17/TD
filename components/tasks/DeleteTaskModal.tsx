"use client";

import { useState, useTransition } from "react";
import { deleteTaskAction } from "@/app/projects/[projectId]/actions";

interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  projectId?: string;
}

export function DeleteTaskModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  projectId,
}: DeleteTaskModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteTaskAction(taskId, projectId);
      if (res?.error) {
        setError(res.error);
      } else {
        onClose();
      }
    });
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-task-modal-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow eyebrow--danger">Permanent action</span>
            <h2 id="delete-task-modal-title">Delete task</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="auth-banner-error" role="alert" style={{ marginBottom: 18 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <p style={{ margin: "0 0 20px", color: "var(--secondary)", fontSize: 13, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{taskTitle}</strong>? This task will be
          permanently removed and module completion progress will be recalculated.
        </p>

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
            type="button"
            className="danger-button"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Yes, delete task"}
          </button>
        </div>
      </div>
    </div>
  );
}

