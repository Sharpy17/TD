"use client";

import { useActionState, useEffect } from "react";
import { createProjectAction, type ProjectActionState } from "@/app/(main)/projects/actions";
import { Icon } from "@/components/ui/Icon";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialState: ProjectActionState = {};

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="modal-title">Create project</h2>
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
          <div className="form-group">
            <label className="form-label" htmlFor="project-name">
              Project name *
            </label>
            <input
              id="project-name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Mobile App MVP"
              className={`form-input ${state?.fieldErrors?.name ? "form-input--error" : ""}`}
              disabled={isPending}
            />
            {state?.fieldErrors?.name && (
              <span className="form-error">{state.fieldErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="project-desc">
              <span>Description</span>
              <span className="optional">optional</span>
            </label>
            <input
              id="project-desc"
              name="description"
              type="text"
              placeholder="Short summary of this project's goal"
              className="form-input"
              disabled={isPending}
            />
          </div>

          <div className="form-group" style={{ marginTop: 4 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontSize: 12,
                color: "var(--secondary)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="createDefaultModules"
                defaultChecked
                disabled={isPending}
                style={{ width: 14, height: 14, accentColor: "var(--violet)" }}
              />
              <span>Generate starter modules (Core & Architecture, UI & Features)</span>
            </label>
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
              {isPending ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

