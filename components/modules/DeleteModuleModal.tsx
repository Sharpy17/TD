"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteModuleAction } from "@/app/projects/[projectId]/actions";
import { Icon } from "@/components/ui/Icon";

interface DeleteModuleModalProps {
  onClose: () => void;
  moduleId: string;
  moduleName: string;
  taskCount: number;
  projectId: string;
}

/** Mount only while open. */
export function DeleteModuleModal({ onClose, moduleId, moduleName, taskCount, projectId }: DeleteModuleModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteModuleAction(moduleId, projectId);
      if (res.success) onClose();
      else setError(res.error || "Failed to delete module.");
    });
  };

  const tasks = taskCount === 1 ? "its 1 task" : taskCount > 1 ? `its ${taskCount} tasks` : "its tasks";

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="delete-module-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="delete-module-title">Delete module</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" />
          </button>
        </div>

        {error && (
          <div className="auth-banner-error" role="alert" style={{ marginBottom: 18 }}>
            <Icon name="alert" />
            <span>{error}</span>
          </div>
        )}

        <p style={{ margin: "0 0 20px", color: "var(--secondary)", fontSize: 13, lineHeight: 1.6 }}>
          Delete <strong>{moduleName}</strong>? This removes {tasks}, their comments and the module chat for
          everyone. It can&apos;t be undone.
        </p>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete module"}
          </button>
        </div>
      </div>
    </div>
  );
}
