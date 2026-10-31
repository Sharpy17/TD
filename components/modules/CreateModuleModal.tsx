"use client";

import { useActionState, useEffect, useState } from "react";
import { createModuleAction, type ModuleActionState } from "@/app/projects/[projectId]/actions";
import { PRESET_MODULE_ICONS } from "@/lib/modules/constants";

interface CreateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const initialState: ModuleActionState = {};

export function CreateModuleModal({ isOpen, onClose, projectId }: CreateModuleModalProps) {
  const [state, formAction, isPending] = useActionState(createModuleAction, initialState);
  const [selectedIcon, setSelectedIcon] = useState<string>("◆");

  // Close modal on successful module creation
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

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-module-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Project breakdown</span>
            <h2 id="create-module-title">Create module</h2>
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

        {state?.error && (
          <div className="auth-banner-error" role="alert" style={{ marginBottom: 18 }}>
            <span>⚠️</span>
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="auth-form">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="icon" value={selectedIcon} />

          <div className="form-group">
            <label className="form-label" htmlFor="module-name">
              Module name *
            </label>
            <input
              id="module-name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Realtime Voice & Media"
              className={`form-input ${state?.fieldErrors?.name ? "form-input--error" : ""}`}
              disabled={isPending}
            />
            {state?.fieldErrors?.name && (
              <span className="form-error">{state.fieldErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="module-desc">
              <span>Description</span>
              <span className="optional">optional</span>
            </label>
            <input
              id="module-desc"
              name="description"
              type="text"
              placeholder="What core capability does this module deliver?"
              className="form-input"
              disabled={isPending}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Icon badge</span>
            </label>
            <div className="icon-picker" role="radiogroup" aria-label="Module icon selector">
              {PRESET_MODULE_ICONS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  className={`icon-picker-item ${selectedIcon === icon ? "icon-picker-item--active" : ""}`}
                  onClick={() => setSelectedIcon(icon)}
                  aria-checked={selectedIcon === icon}
                  role="radio"
                >
                  {icon}
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
              {isPending ? "Creating..." : "Create module →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

