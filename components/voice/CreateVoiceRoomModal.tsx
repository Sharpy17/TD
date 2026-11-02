"use client";

import { useActionState, useEffect, useState } from "react";
import { createVoiceRoomAction, type VoiceActionState } from "@/app/voice/actions";
import { Icon } from "@/components/ui/Icon";

interface CreateVoiceRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

const initialState: VoiceActionState = {};

const PRESET_NAMES = [
  "Pair-Programming",
  "War-Room",
  "Code-Review",
  "Watercooler",
  "Silent-Sprint",
];

export function CreateVoiceRoomModal({
  isOpen,
  onClose,
  projectId,
}: CreateVoiceRoomModalProps) {
  const [state, formAction, isPending] = useActionState(createVoiceRoomAction, initialState);
  const [name, setName] = useState("");
  const [maxUsers, setMaxUsers] = useState(10);

  // Close when successfully created
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
      aria-labelledby="create-voice-room-title"
    >
      <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="create-voice-room-title">Create voice lounge</h2>
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
          {projectId && <input type="hidden" name="projectId" value={projectId} />}
          <input type="hidden" name="maxUsers" value={maxUsers} />

          {/* Quick presets */}
          <div className="form-group">
            <label className="form-label">
              <span>Quick templates</span>
            </label>
            <div className="chip-group">
              {PRESET_NAMES.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={`chip-btn ${name === preset ? "chip-btn--active" : ""}`}
                  onClick={() => setName(preset)}
                >
                  #{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Room Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="voice-room-name-input">
              Lounge name *
            </label>
            <input
              id="voice-room-name-input"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Pair-Programming"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              disabled={isPending}
            />
          </div>

          {/* Max Users Capacity */}
          <div className="form-group">
            <label className="form-label">
              <span>Capacity limit</span>
            </label>
            <div className="chip-group">
              {[4, 10, 20, 50].map((cap) => (
                <button
                  type="button"
                  key={cap}
                  className={`chip-btn ${maxUsers === cap ? "chip-btn--active" : ""}`}
                  onClick={() => setMaxUsers(cap)}
                >
                  {cap} users
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
              {isPending ? "Creating..." : "Create lounge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
