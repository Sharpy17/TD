"use client";

import { useState, useTransition } from "react";
import { deleteProjectAction } from "@/app/(main)/projects/actions";

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: DeleteProjectModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteProjectAction(projectId);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow eyebrow--danger">Irreversible action</span>
            <h2 id="delete-modal-title">Delete project</h2>
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
          Are you sure you want to delete <strong>{projectName}</strong>? All modules,
          tasks, and progress data linked to this project will be permanently removed.
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
            {isPending ? "Deleting..." : "Yes, delete project"}
          </button>
        </div>
      </div>
    </div>
  );
}

