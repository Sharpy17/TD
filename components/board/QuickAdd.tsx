"use client";

import { useState, type RefObject } from "react";
import type { UserSummary } from "@/lib/domain/types";
import { parseQuickAdd, type QuickAddResult } from "@/lib/tasks/quickAdd";

export function QuickAdd({
  modules,
  members,
  defaultModule,
  nowMs,
  inputRef,
  onSubmit,
}: {
  modules: Array<{ id: string; name: string }>;
  members: UserSummary[];
  defaultModule: { id: string; name: string } | null;
  nowMs: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (parsed: QuickAddResult & { moduleId: string }) => void;
}) {
  const [draft, setDraft] = useState("");

  if (!defaultModule) {
    return <div className="board-quick board-quick--disabled">Create a module first to add tasks.</div>;
  }

  const parsed = parseQuickAdd(draft, { modules, members, nowMs });
  const tokens = parsed.moduleId ? parsed.tokens : [...parsed.tokens, `^${defaultModule.name}`];

  return (
    <div className="board-quick">
      <label>
        <span className="sr-only">Quick add task</span>
        <input
          ref={inputRef}
          value={draft}
          maxLength={200}
          placeholder="Add task…  @who ^module !when"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setDraft("");
              event.currentTarget.blur();
            }
            if (event.key !== "Enter" || !parsed.title) return;
            // Re-parse at submit time so relative dates use the exact moment of creation.
            const final = parseQuickAdd(draft, { modules, members, nowMs: Date.now() });
            onSubmit({ ...final, moduleId: final.moduleId ?? defaultModule.id });
            setDraft("");
          }}
        />
      </label>
      {draft.trim() && (
        <div className="board-quick__tokens">
          {tokens.map((token) => (
            <span key={token} className="board-token">
              {token}
            </span>
          ))}
          <span className="board-quick__hint">
            <kbd>↵</kbd> to add
          </span>
        </div>
      )}
    </div>
  );
}
