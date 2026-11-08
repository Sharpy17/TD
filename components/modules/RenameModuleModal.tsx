"use client";

import { useEffect, useState, useTransition } from "react";
import { renameModuleAction } from "@/app/projects/[projectId]/actions";
import { Icon } from "@/components/ui/Icon";

interface RenameModuleModalProps {
  onClose: () => void;
  moduleId: string;
  moduleName: string;
  projectId: string;
}

/** Mount only while open, so each opening starts from the module's current name. */
export function RenameModuleModal({ onClose, moduleId, moduleName, projectId }: RenameModuleModalProps) {
  const [name, setName] = useState(moduleName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed === moduleName) {
      onClose();
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await renameModuleAction(moduleId, trimmed, projectId);
      if (res.success) onClose();
      else setError(res.error || "Failed to rename module.");
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="rename-module-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="rename-module-title">Rename module</h2>
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

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="rename-module-name">
              Module name
            </label>
            <input
              id="rename-module-name"
              type="text"
              required
              autoFocus
              minLength={2}
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="form-input"
              disabled={isPending}
            />
            <span className="form-hint">The module chat is renamed to match.</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="primary-button" style={{ minWidth: 140 }} disabled={isPending || !name.trim()}>
              {isPending ? "Saving..." : "Save name"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
