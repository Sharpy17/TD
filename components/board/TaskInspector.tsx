"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addCommentAction } from "@/app/projects/[projectId]/actions";
import type { ChecklistItem, TaskComment, TaskPriority, TaskStatus, UserSummary } from "@/lib/domain/types";
import { MAX_CHECKLIST_ITEMS } from "@/lib/tasks/checklist";
import {
  BOARD_COLUMNS,
  deadlineTone,
  DUE_PRESET_LABEL,
  duePresets,
  formatClock,
  formatFullDate,
  PRIORITY_LABEL,
  PRIORITY_LEVEL,
  resolveDuePreset,
  toLocalInputValue,
  type BoardTask,
} from "./boardModel";
import { Avatar } from "./KanbanCard";
import { PriorityBars } from "./icons";
import { PropertyMenu } from "./PropertyMenu";

function timeAgo(iso: string, nowMs: number): string {
  const minutes = Math.max(0, Math.floor((nowMs - Date.parse(iso)) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1_440)}d`;
}

function Checklist({
  items,
  disabled,
  onChange,
}: {
  items: ChecklistItem[];
  disabled: boolean;
  onChange: (items: ChecklistItem[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const done = items.filter((item) => item.done).length;

  const add = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || items.length >= MAX_CHECKLIST_ITEMS) return;
    onChange([...items, { id: crypto.randomUUID().slice(0, 12), text, done: false }]);
    setDraft("");
  };

  return (
    <section className="board-section" aria-label="Checklist">
      <div className="board-section__head">
        <span>Checklist</span>
        {items.length > 0 && (
          <span className="board-mono">
            {done} of {items.length}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div className="board-progress">
          <i style={{ width: `${Math.round((done / items.length) * 100)}%` }} />
        </div>
      )}
      {items.map((item) => (
        <div key={item.id} className="board-check">
          <label>
            <input
              type="checkbox"
              checked={item.done}
              disabled={disabled}
              onChange={() => onChange(items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
            />
            <span>{item.text}</span>
          </label>
          <button
            type="button"
            className="board-check__remove"
            aria-label={`Remove “${item.text}”`}
            disabled={disabled}
            onClick={() => onChange(items.filter((i) => i.id !== item.id))}
          >
            ✕
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="board-muted">Break the task into steps; progress shows on the card.</p>}
      <form className="board-inline-form" onSubmit={add}>
        <label className="sr-only" htmlFor="board-checklist-input">
          Add checklist item
        </label>
        <input
          id="board-checklist-input"
          className="board-inline-input"
          placeholder={items.length >= MAX_CHECKLIST_ITEMS ? "Checklist is full" : "New item…"}
          value={draft}
          maxLength={200}
          disabled={disabled || items.length >= MAX_CHECKLIST_ITEMS}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="submit"
          className="secondary-button board-inline-submit"
          disabled={disabled || !draft.trim() || items.length >= MAX_CHECKLIST_ITEMS}
        >
          Add
        </button>
      </form>
    </section>
  );
}

function Comments({
  taskId,
  projectId,
  version,
  currentUser,
  nowMs,
}: {
  taskId: string;
  projectId: string;
  version: number;
  currentUser: UserSummary | null;
  nowMs: number;
}) {
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tasks/${encodeURIComponent(taskId)}/comments`)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: TaskComment[]) => !cancelled && setComments(data))
      .catch(() => !cancelled && setComments([]));
    return () => {
      cancelled = true;
    };
  }, [taskId, version]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !currentUser || sending) return;

    const optimistic: TaskComment = {
      id: `optimistic-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      author: currentUser,
    };
    setComments((list) => [...(list ?? []), optimistic]);
    setDraft("");
    setError(null);
    setSending(true);

    const result = await addCommentAction(taskId, content, projectId);
    setSending(false);
    if (!result.success) {
      setComments((list) => (list ?? []).filter((c) => c.id !== optimistic.id));
      setDraft(content);
      setError(result.error ?? "Couldn't post comment.");
    }
  };

  return (
    <section className="board-section" aria-label="Comments">
      <div className="board-section__head">
        <span>Discussion</span>
        {comments && comments.length > 0 && <span className="board-mono">{comments.length}</span>}
      </div>
      {comments === null && <p className="board-muted">Loading…</p>}
      {comments?.length === 0 && <p className="board-muted">No comments yet.</p>}
      {comments?.map((comment) => (
        <div key={comment.id} className={`board-comment ${comment.id.startsWith("optimistic-") ? "board-comment--pending" : ""}`}>
          <Avatar user={comment.author} size="sm" />
          <div>
            <div className="board-comment__meta">
              <strong>{comment.author.name}</strong>
              <span className="board-mono" suppressHydrationWarning>
                {timeAgo(comment.createdAt, nowMs)}
              </span>
            </div>
            <p>{comment.content}</p>
          </div>
        </div>
      ))}
      {currentUser ? (
        <form onSubmit={send}>
          <label className="sr-only" htmlFor="board-comment-input">
            Write a comment
          </label>
          <input
            id="board-comment-input"
            className="board-inline-input"
            placeholder="Write a comment…"
            value={draft}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
          />
        </form>
      ) : (
        <p className="board-muted">Sign in to comment.</p>
      )}
      {error && <p className="board-error">{error}</p>}
    </section>
  );
}

const UNASSIGNED = "__unassigned";
const PRIORITY_ORDER: TaskPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export type TaskFieldsPatch = {
  assigneeId?: string | null;
  moduleId?: string;
  priority?: TaskPriority;
  dueAt?: string | null;
};

/** Exact date/time for the due menu, in the viewer's time zone. */
function CustomDue({ value, onSet }: { value: string | null; onSet: (dueAt: string) => void }) {
  const [draft, setDraft] = useState(() => toLocalInputValue(value));
  return (
    <form
      className="board-inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        const ms = Date.parse(draft);
        if (!Number.isNaN(ms)) onSet(new Date(ms).toISOString());
      }}
    >
      <label className="sr-only" htmlFor="board-due-input">
        Exact due date and time
      </label>
      <input
        id="board-due-input"
        type="datetime-local"
        className="board-inline-input board-mono"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button type="submit" className="secondary-button board-inline-submit" disabled={!draft}>
        Set
      </button>
    </form>
  );
}

export function TaskInspector({
  task,
  nowMs,
  projectId,
  members,
  modules,
  currentUser,
  commentsVersion,
  assigneeLive,
  onMove,
  onFieldsChange,
  onChecklistChange,
  onClose,
  onEdit,
  onDelete,
}: {
  task: BoardTask | null;
  nowMs: number;
  projectId: string;
  members: UserSummary[];
  modules: Array<{ id: string; name: string }>;
  currentUser: UserSummary | null;
  commentsVersion: number;
  assigneeLive: boolean;
  onMove: (taskId: string, status: TaskStatus) => void;
  onFieldsChange: (taskId: string, patch: TaskFieldsPatch) => void;
  onChecklistChange: (taskId: string, items: ChecklistItem[]) => void;
  onClose: () => void;
  onEdit: (task: BoardTask) => void;
  onDelete: (task: BoardTask) => void;
}) {
  if (!task) {
    return (
      <aside className="board-inspector board-inspector--empty" aria-label="Task details">
        <strong>No task selected</strong>
        <p>Pick a card to see its details.</p>
        <p>
          <kbd>J</kbd> <kbd>K</kbd> move between cards · <kbd>N</kbd> new task
        </p>
      </aside>
    );
  }

  const tone = deadlineTone(task, nowMs);
  const urgent = tone === "burning" || tone === "overdue";
  const priority = task.priority ?? "MEDIUM";

  return (
    <aside className="board-inspector" aria-label="Task details">
      <div className="board-inspector__head">
        <span>
          {task.code && <span className="board-mono board-inspector__code">{task.code}</span>}
          {task.moduleName}
        </span>
        <button type="button" className="board-icon-button" aria-label="Close details" onClick={onClose}>
          ✕
        </button>
      </div>

      <h2>{task.title}</h2>

      {urgent && task.dueAt && (
        <div className={`board-countdown board-countdown--${tone}`}>
          <div>
            <span>{tone === "overdue" ? "Overdue by" : "Burning · time left"}</span>
            <strong suppressHydrationWarning>
              {tone === "overdue" ? "-" : ""}
              {formatClock(Date.parse(task.dueAt) - nowMs)}
            </strong>
          </div>
          <small suppressHydrationWarning>
            due
            <br />
            {formatFullDate(task.dueAt)}
          </small>
        </div>
      )}

      <div className="board-inspector__field">
        <span>Status</span>
        <div className="board-segmented" role="group" aria-label="Move task">
          {BOARD_COLUMNS.map((column) => (
            <button
              key={column.status}
              type="button"
              aria-pressed={task.status === column.status}
              disabled={task.pending}
              onClick={() => onMove(task.id, column.status)}
            >
              {column.short}
            </button>
          ))}
        </div>
      </div>

      <dl className="board-props">
        <PropertyMenu
          label="Assignee"
          disabled={task.pending}
          display={
            <>
              <Avatar user={task.assignee} live={assigneeLive} />
              {task.assignee?.name ?? "Unassigned"}
            </>
          }
          selected={task.assignee?.id ?? UNASSIGNED}
          emptyText="No workspace members yet."
          options={[
            { value: UNASSIGNED, label: "Unassigned", icon: <Avatar user={null} size="sm" /> },
            ...members.map((member) => ({
              value: member.id,
              label: member.id === currentUser?.id ? `${member.name} (you)` : member.name,
              icon: <Avatar user={member} size="sm" />,
            })),
          ]}
          onSelect={(value) =>
            onFieldsChange(task.id, { assigneeId: value === UNASSIGNED ? null : value })
          }
        />
        <PropertyMenu
          label="Module"
          disabled={task.pending}
          display={task.moduleName}
          selected={task.moduleId}
          options={modules.map((module) => ({ value: module.id, label: module.name }))}
          onSelect={(moduleId) => onFieldsChange(task.id, { moduleId })}
        />
        <PropertyMenu
          label="Priority"
          disabled={task.pending}
          display={
            <>
              <PriorityBars level={PRIORITY_LEVEL[priority]} />
              {PRIORITY_LABEL[priority]}
            </>
          }
          selected={priority}
          options={PRIORITY_ORDER.map((value) => ({
            value,
            label: PRIORITY_LABEL[value],
            icon: <PriorityBars level={PRIORITY_LEVEL[value]} />,
          }))}
          onSelect={(value) => onFieldsChange(task.id, { priority: value })}
        />
        <PropertyMenu
          label="Due"
          disabled={task.pending}
          display={
            <span className="board-mono" suppressHydrationWarning>
              {formatFullDate(task.dueAt)}
            </span>
          }
          selected={null}
          options={duePresets(nowMs).map((preset) => ({
            value: preset,
            label: DUE_PRESET_LABEL[preset],
            // Relative presets get their exact landing time; the others already say it.
            hint:
              preset === "2h" || preset === "3d"
                ? formatFullDate(new Date(resolveDuePreset(preset, nowMs)!).toISOString())
                : undefined,
          }))}
          onSelect={(preset) => {
            const ms = resolveDuePreset(preset, Date.now());
            onFieldsChange(task.id, { dueAt: ms === null ? null : new Date(ms).toISOString() });
          }}
          footer={(close) => (
            <CustomDue
              value={task.dueAt}
              onSet={(dueAt) => {
                onFieldsChange(task.id, { dueAt });
                close();
              }}
            />
          )}
        />
      </dl>

      <p className="board-inspector__description">{task.description || "No description yet."}</p>

      {/* Sibling keys must differ: a shared key made React duplicate these sections on every tick. */}
      <Checklist
        key={`checklist-${task.id}`}
        items={task.checklist ?? []}
        disabled={!!task.pending}
        onChange={(items) => onChecklistChange(task.id, items)}
      />

      {!task.pending && (
        <Comments
          key={`comments-${task.id}`}
          taskId={task.id}
          projectId={projectId}
          version={commentsVersion}
          currentUser={currentUser}
          nowMs={nowMs}
        />
      )}

      <div className="board-inspector__actions">
        <button type="button" className="secondary-button" disabled={task.pending} onClick={() => onEdit(task)}>
          Edit task
        </button>
        <button
          type="button"
          className="secondary-button board-danger"
          disabled={task.pending}
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      </div>
    </aside>
  );
}
